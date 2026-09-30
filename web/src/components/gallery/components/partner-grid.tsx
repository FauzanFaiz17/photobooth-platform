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
          className="cursor-pointer border border-border shadow-[0_5px_0_var(--border)] rounded-2xl hover:shadow-none transition duration-300"
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
              className="w-full bg-background text-primary border-2 border-border shadow-[0_4px_0_var(--border)] hover:bg-background transition-all duration-300 hover:shadow-none hover:translate-y-1.5"
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