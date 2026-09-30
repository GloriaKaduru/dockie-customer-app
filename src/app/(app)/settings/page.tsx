import { OrgSettings } from "@/components/settings/org-settings";

export const metadata = { title: "Organization" };

// ?tab=general|team|roles|billing|activity
export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const { tab } = (await searchParams) as { tab?: string };
  return <OrgSettings key={tab} initialTab={tab} />;
}
