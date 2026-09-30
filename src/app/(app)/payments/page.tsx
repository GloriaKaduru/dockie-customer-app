import { PaymentsView } from "@/components/payments/payments-view";

export const metadata = { title: "Payments" };

// ?invoice=INV-10283 opens the payment detail.
export default async function PaymentsPage({ searchParams }: PageProps<"/payments">) {
  const { invoice } = (await searchParams) as { invoice?: string };
  return <PaymentsView openInvoice={invoice} />;
}
