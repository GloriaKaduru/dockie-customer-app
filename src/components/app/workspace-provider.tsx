"use client";

import { createContext, use, useCallback, useMemo, useState } from "react";
import * as seed from "@/lib/data";
import { can as roleCan, type Capability } from "@/lib/permissions";
import type { DocumentType, Payment, Role, Shipment, ShipmentDocument } from "@/lib/types";
import { NOW } from "@/lib/format";

/**
 * In-memory workspace for the prototype.
 * Seeded from lib/data.ts; mutations (upload a title, pay an invoice, change a destination)
 * live for the session so the PRD scenarios can be walked end-to-end.
 * When the backend exists, swap these setters for API calls + revalidation.
 */
interface Workspace {
  shipments: Shipment[]; // excludes drafts
  getShipment: (id: string) => Shipment | undefined;
  updateShipment: (id: string, patch: Partial<Shipment>, activity?: string) => void;
  createDraftShipment: (id: string) => void;

  documents: ShipmentDocument[];
  uploadDocument: (input: { shipmentId: string; type: DocumentType; fileName: string; replaceId?: string }) => string;
  setDocumentStatus: (id: string, status: ShipmentDocument["status"], note?: string) => void;

  payments: Payment[];
  markPaid: (id: string) => void;

  notifications: typeof seed.notifications;
  markAllRead: () => void;
  markRead: (id: string) => void;

  role: Role;
  setRole: (r: Role) => void;
  can: (c: Capability) => boolean;
}

const WorkspaceContext = createContext<Workspace | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [allShipments, setShipments] = useState(seed.shipments);
  const [documents, setDocuments] = useState(seed.documents);
  const [payments, setPayments] = useState(seed.payments);
  const [notifications, setNotifications] = useState(seed.notifications);
  const [role, setRole] = useState<Role>("admin");

  const getShipment = useCallback((id: string) => allShipments.find((s) => s.id === id), [allShipments]);

  const updateShipment = useCallback((id: string, patch: Partial<Shipment>, activity?: string) => {
    setShipments((list) =>
      list.map((s) =>
        s.id === id
          ? {
              ...s,
              ...patch,
              lastUpdated: NOW.toISOString(),
              activity: activity ? [{ at: NOW.toISOString(), actor: seed.currentUser.name, text: activity }, ...s.activity] : s.activity,
            }
          : s,
      ),
    );
  }, []);

  const createDraftShipment = useCallback((id: string) => {
    setShipments((list) => list.map((s) => (s.id === id ? { ...s, draft: false } : s)));
  }, []);

  const uploadDocument: Workspace["uploadDocument"] = useCallback(({ shipmentId, type, fileName, replaceId }) => {
    const id = replaceId ?? `d-${Date.now()}`;
    const doc: ShipmentDocument = {
      id,
      shipmentId,
      type,
      fileName,
      status: "processing",
      required: type === "Title" || type === "Invoice" || type === "Dock receipt",
      uploadedAt: NOW.toISOString(),
      uploadedBy: seed.currentUser.name,
    };
    setDocuments((list) => {
      // Replace an existing required/rejected slot of the same type on the same shipment.
      const existing = list.find((d) => d.id === replaceId || (d.shipmentId === shipmentId && d.type === type && (d.status === "required" || d.status === "rejected")));
      return existing ? list.map((d) => (d.id === existing.id ? { ...doc, id: existing.id } : d)) : [doc, ...list];
    });
    return id;
  }, []);

  const setDocumentStatus = useCallback((id: string, status: ShipmentDocument["status"], note?: string) => {
    setDocuments((list) => list.map((d) => (d.id === id ? { ...d, status, note } : d)));
  }, []);

  const markPaid = useCallback((id: string) => {
    setPayments((list) => list.map((p) => (p.id === id ? { ...p, status: "paid", paidAt: NOW.toISOString() } : p)));
  }, []);

  const value = useMemo<Workspace>(
    () => ({
      shipments: allShipments.filter((s) => !s.draft),
      getShipment,
      updateShipment,
      createDraftShipment,
      documents,
      uploadDocument,
      setDocumentStatus,
      payments,
      markPaid,
      notifications,
      markAllRead: () => setNotifications((n) => n.map((x) => ({ ...x, unread: false }))),
      markRead: (id) => setNotifications((n) => n.map((x) => (x.id === id ? { ...x, unread: false } : x))),
      role,
      setRole,
      can: (c) => roleCan(role, c),
    }),
    [allShipments, getShipment, updateShipment, createDraftShipment, documents, uploadDocument, setDocumentStatus, payments, markPaid, notifications, role],
  );

  return <WorkspaceContext value={value}>{children}</WorkspaceContext>;
}

export function useWorkspace() {
  const ctx = use(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}

/** Derived counts used by Home's "Needs attention" and the sidebar badges. */
export function useAttention() {
  const { shipments, documents, payments } = useWorkspace();
  const issues = shipments.filter((s) => s.status === "issue_reported" || s.eta.kind === "delayed");
  const missingTitles = documents.filter((d) => d.type === "Title" && (d.status === "required" || d.status === "rejected"));
  const paymentsDue = payments.filter((p) => p.status === "outstanding" || p.status === "overdue");
  return { issues, missingTitles, paymentsDue };
}
