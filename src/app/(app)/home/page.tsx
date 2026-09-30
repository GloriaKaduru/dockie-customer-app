import { HomeView } from "@/components/home/home-view";

export const metadata = { title: "Home" };

// Add ?state=empty to preview the new-organization empty state (PRD §1.7).
export default async function HomePage({ searchParams }: PageProps<"/home">) {
  const { state } = (await searchParams) as { state?: string };
  return <HomeView empty={state === "empty"} />;
}
