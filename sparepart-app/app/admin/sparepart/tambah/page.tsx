import SparePartForm from "@/components/SparePartForm";
import { Card, PageHeader } from "@/components/ui";

export default function TambahSparepartPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Tambah Sparepart"
        description="Lengkapi data item baru beserta fotonya."
      />
      <Card className="animate-fade-up p-5 sm:p-7" >
        <SparePartForm />
      </Card>
    </div>
  );
}
