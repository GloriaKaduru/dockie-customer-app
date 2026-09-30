import { TrackingView } from "@/components/tracking/tracking-view";

export const metadata = { title: "Tracking" };

export default async function TrackingPage({ searchParams }: PageProps<"/tracking">) {
  const { id } = (await searchParams) as { id?: string };
  return <TrackingView selectedId={id} />;
}
