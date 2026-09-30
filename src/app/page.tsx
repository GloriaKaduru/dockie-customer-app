import { redirect } from "next/navigation";

// "/" → Home. When auth exists, send signed-out users to /login instead.
export default function Root() {
  redirect("/home");
}
