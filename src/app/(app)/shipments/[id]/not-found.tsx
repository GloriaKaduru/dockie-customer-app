import { PackageX } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/app/states";
import { Button } from "@/components/ui/button";

// DATA_NOT_FOUND
export default function ShipmentNotFound() {
  return (
    <EmptyState icon={PackageX} title="We couldn't find that shipment" description="Check the booking number, or search by VIN." className="min-h-[50vh]">
      <Button asChild variant="outline">
        <Link href="/shipments">Back to shipments</Link>
      </Button>
    </EmptyState>
  );
}
