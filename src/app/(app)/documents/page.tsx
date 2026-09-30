import { DocumentsView } from "@/components/documents/documents-view";

export const metadata = { title: "Documents" };

// ?status=required · ?doc=<id> opens detail · ?upload=<shipmentId>|1 opens the upload flow
export default async function DocumentsPage({ searchParams }: PageProps<"/documents">) {
  const { status, doc, upload } = (await searchParams) as { status?: string; doc?: string; upload?: string };
  return <DocumentsView key={`${status}-${upload}`} initialStatus={status} openDoc={doc} uploadFor={upload} />;
}
