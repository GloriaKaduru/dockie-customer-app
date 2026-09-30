"use client";

import { Download, Eye, FileText, RefreshCw, Search, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState, Restricted } from "@/components/app/states";
import { useWorkspace } from "@/components/app/workspace-provider";
import { SetDockieContext } from "@/components/dockie/dockie-provider";
import { DocumentStatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { documentStatus } from "@/lib/status";
import { formatDate, formatDateTime, vehicleName } from "@/lib/format";
import type { DocumentStatus, DocumentType, ShipmentDocument } from "@/lib/types";
import { UploadDialog } from "./upload-dialog";

const ALL = "all";

export function DocumentsView({ initialStatus, openDoc, uploadFor }: { initialStatus?: string; openDoc?: string; uploadFor?: string }) {
  const { documents, getShipment, can } = useWorkspace();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(initialStatus && initialStatus in documentStatus ? initialStatus : ALL);
  const [type, setType] = useState(ALL);
  const [upload, setUpload] = useState<{ open: boolean; shipmentId?: string; type?: DocumentType }>({
    open: !!uploadFor,
    shipmentId: uploadFor && uploadFor !== "1" ? uploadFor : undefined,
  });
  const selected = documents.find((d) => d.id === openDoc);

  const name = (d: ShipmentDocument) => d.fileName ?? `${d.type} — ${d.shipmentId}`;
  const rows = documents
    .filter((d) => status === ALL || d.status === status)
    .filter((d) => type === ALL || d.type === type)
    .filter((d) => !query || `${name(d)} ${d.type} ${d.shipmentId}`.toLowerCase().includes(query.toLowerCase()))
    // Required and rejected first — they need action.
    .sort((a, b) => Number(b.status === "required" || b.status === "rejected") - Number(a.status === "required" || a.status === "rejected"));

  const open = (id?: string) => router.replace(id ? `/documents?doc=${id}` : "/documents", { scroll: false });

  return (
    <>
      <SetDockieContext context={{ kind: "documents" }} />
      <PageHeader
        title="Documents"
        description="Titles, receipts and paperwork across all shipments."
        actions={
          <Restricted allowed={can("documents.upload")}>
            <Button onClick={() => setUpload({ open: true })}>
              <Upload /> Upload
            </Button>
          </Restricted>
        }
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <InputGroup className="sm:max-w-xs">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search documents" value={query} onChange={(e) => setQuery(e.target.value)} />
          </InputGroup>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {(Object.keys(documentStatus) as DocumentStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {documentStatus[s].label} ({documents.filter((d) => d.status === s).length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {[...new Set(documents.map((d) => d.type))].map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <Card className="py-0">
        {rows.length === 0 ? (
          <EmptyState icon={FileText} title="No documents match" description="Try another status or type, or upload a document." />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Shipment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Uploaded by</TableHead>
                  <TableHead className="w-24 pr-4">
                    <span className="sr-only">Action</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((d) => {
                  const s = getShipment(d.shipmentId);
                  const needsFile = d.status === "required" || d.status === "rejected";
                  return (
                    <TableRow key={d.id} className="cursor-pointer" onClick={() => open(d.id)}>
                      <TableCell className="pl-4">
                        <span className="flex items-center gap-2 font-medium">
                          <FileText className="size-4 text-muted-foreground" />
                          {name(d)}
                        </span>
                      </TableCell>
                      <TableCell>{d.type}</TableCell>
                      <TableCell>
                        <Link href={`/shipments/${d.shipmentId}?tab=documents`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                          {d.shipmentId}
                        </Link>
                        {s && <span className="block text-xs text-muted-foreground">{vehicleName(s.vehicle)}</span>}
                      </TableCell>
                      <TableCell>
                        <DocumentStatusBadge status={d.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{d.uploadedAt ? formatDate(d.uploadedAt) : "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{d.uploadedBy ?? "—"}</TableCell>
                      <TableCell className="pr-4 text-right">
                        {needsFile && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!can("documents.upload")}
                            onClick={(e) => {
                              e.stopPropagation();
                              setUpload({ open: true, shipmentId: d.shipmentId, type: d.type });
                            }}
                          >
                            {d.status === "rejected" ? "Replace" : "Upload"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Document detail (PRD §7.4) */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && open()}>
        <SheetContent className="w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.type}</SheetTitle>
                <SheetDescription>{name(selected)}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4">
                <div className="grid aspect-[3/4] max-h-72 w-full place-items-center rounded-lg border bg-muted/40 text-muted-foreground">
                  {selected.uploadedAt ? <FileText className="size-10" /> : <span className="text-sm">No file uploaded</span>}
                </div>
                <dl className="divide-y text-sm">
                  <Row k="Shipment">
                    <Link href={`/shipments/${selected.shipmentId}`} className="hover:underline">
                      {selected.shipmentId}
                    </Link>
                  </Row>
                  <Row k="Status">
                    <DocumentStatusBadge status={selected.status} />
                  </Row>
                  <Row k="Uploaded">{selected.uploadedAt ? `${formatDateTime(selected.uploadedAt)} by ${selected.uploadedBy}` : "—"}</Row>
                  {selected.note && <Row k="Note">{selected.note}</Row>}
                </dl>
              </div>
              <SheetFooter className="flex-row">
                {selected.uploadedAt && (
                  <>
                    <Button variant="outline" className="flex-1" onClick={() => toast("Opening preview…")}>
                      <Eye /> Preview
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => toast(`Downloading ${selected.fileName}`)}>
                      <Download /> Download
                    </Button>
                  </>
                )}
                {(selected.status === "required" || selected.status === "rejected") && (
                  <Button className="flex-1" disabled={!can("documents.upload")} onClick={() => setUpload({ open: true, shipmentId: selected.shipmentId, type: selected.type })}>
                    {selected.status === "rejected" ? <RefreshCw /> : <Upload />} {selected.status === "rejected" ? "Replace" : "Upload"}
                  </Button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <UploadDialog
        key={`${upload.shipmentId}-${upload.type}`}
        open={upload.open}
        onOpenChange={(o) => setUpload((u) => ({ ...u, open: o }))}
        shipmentId={upload.shipmentId}
        defaultType={upload.type}
      />
    </>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
