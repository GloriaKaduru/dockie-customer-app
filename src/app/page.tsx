import { redirect } from "next/navigation";

// "/" has no content of its own; send people to the dashboard.
// Once auth exists, send signed-out users to /login instead.
export default function Home() {
  redirect("/dashboard");
}
