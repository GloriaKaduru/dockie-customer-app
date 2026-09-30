"use client";

import { CheckCircle2, FileUp, UploadCloud, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/app/workspace-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { vehicleName } from "@/lib/format";
import type { DocumentType } from "@/lib/types";

const types: DocumentType[] = ["Title", "Dock receipt", "Bill of lading", "Invoice", "Payment receipt", "Photo ID"];

type Step = "form" | "uploading" | "processing" | "verified" | "rejected";

/**
 * Upload flow (PRD §7.5): choose file → type → shipment (if not contextual) → upload → processing → success / rejection.
 * Tip: a file name containing "blur" is rejected, to demo the rejection state.
 */
export function UploadDialog({
  open,
  onOpenChange,
  shipmentId,
  defaultType = "Title",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  shipmentId?: string;
  defaultType?: DocumentType;
}) {
  const { shipments, uploadDocument, setDocumentStatus } = useWorkspace();
  const [step, setStep] = useState<Step>("form");
  const [file, setFile] = useState<string>("");
  const [type, setType] = useState<DocumentType>(defaultType);
  const [shipment, setShipment] = useState(shipmentId ?? "");
  const [progress, setProgress] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("form");
    setFile("");
    setProgress(0);
    setType(defaultType);
    setShipment(shipmentId ?? "");
  };

  function start() {
    setStep("uploading");
    let p = 0;
    const t = setInterval(() => {
      p += 25;
      setProgress(p);
      if (p >= 100) {
        clearInterval(t);
        const id = uploadDocument({ shipmentId: shipment, type, fileName: file });
        setStep("processing");
        setTimeout(() => {
          const rejected = /blur/i.test(file);
          setDocumentStatus(id, rejected ? "rejected" : "verified", rejected ? "Image is blurred; the VIN can't be read." : undefined);
          setStep(rejected ? "rejected" : "verified");
          if (!rejected) toast.success(`${type} verified`, { description: `${shipment} is updated.` });
        }, 1400);
      }
    }, 180);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setTimeout(reset, 200);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
          <DialogDescription>{shipmentId ? `For ${shipmentId}` : "PDF, JPG or PNG, up to 20 MB."}</DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <FieldGroup>
            <Field>
              <FieldLabel>File</FieldLabel>
              <button
                type="button"
                onClick={() => input.current?.click()}
                className={cn("flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground hover:bg-muted/50", file && "border-solid text-foreground")}
              >
                {file ? <FileUp className="size-5" /> : <UploadCloud className="size-5" />}
                {file || "Choose a file or drag it here"}
              </button>
              <input ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => setFile(e.target.files?.[0]?.name ?? "")} />
              {!file && (
                <Button type="button" variant="link" size="xs" className="justify-start px-0" onClick={() => setFile("title-scan.pdf")}>
                  Use a sample file
                </Button>
              )}
            </Field>
            <Field>
              <FieldLabel>Document type</FieldLabel>
              <Select value={type} onValueChange={(v) => setType(v as DocumentType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {!shipmentId && (
              <Field>
                <FieldLabel>Shipment</FieldLabel>
                <Select value={shipment} onValueChange={setShipment}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a shipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {shipments.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {vehicleName(s.vehicle)} · {s.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>Dockie matches documents to shipments by VIN when it can.</FieldDescription>
              </Field>
            )}
          </FieldGroup>
        )}

        {(step === "uploading" || step === "processing") && (
          <div className="space-y-3 py-4">
            <p className="text-sm font-medium">{step === "uploading" ? `Uploading ${file}…` : "Checking the document…"}</p>
            <Progress value={step === "uploading" ? progress : 100} className={cn(step === "processing" && "animate-pulse")} />
            <p className="text-xs text-muted-foreground">{step === "processing" ? "We verify the VIN and owner details. This usually takes a few seconds." : "Don't close this window."}</p>
          </div>
        )}

        {step === "verified" && (
          <div className="flex gap-3 py-4">
            <CheckCircle2 className="size-5 shrink-0 text-success" />
            <div>
              <p className="font-medium">{type} verified</p>
              <p className="text-sm text-muted-foreground">It&apos;s attached to {shipment} and operations can proceed.</p>
            </div>
          </div>
        )}

        {step === "rejected" && (
          <div className="flex gap-3 py-4">
            <XCircle className="size-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium">We couldn&apos;t accept this document</p>
              <p className="text-sm text-muted-foreground">The image is blurred and the VIN can&apos;t be read. Upload a clearer scan.</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "form" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={start} disabled={!file || !shipment}>
                Upload
              </Button>
            </>
          )}
          {step === "rejected" && (
            <Button variant="outline" onClick={reset}>
              Upload a new file
            </Button>
          )}
          {(step === "verified" || step === "rejected") && <Button onClick={() => onOpenChange(false)}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
