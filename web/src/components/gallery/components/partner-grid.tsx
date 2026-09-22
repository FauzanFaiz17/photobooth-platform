import { Building2, Images } from "lucide-react";
import { EmptyState } from "./empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PartnerGrid({
  partners,
  onSelect,
}: {
  readonly partners: ReadonlyArray<{
    id: number;
    company_name: string;
    brand_name: string | null;
  }>;
  readonly onSelect: (id: number) => void;
}) {
  if (partners.length === 0) {
    return <EmptyState icon={Building2} title="Partner tidak tersedia" />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {partners.map((partner) => (
        <Card
          key={partner.id}
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => onSelect(partner.id)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5" />
              {partner.brand_name || partner.company_name}
            </CardTitle>
            <CardDescription>{partner.company_name}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(partner.id);
              }}
            >
              <Images aria-hidden="true" /> Lihat Gallery
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}