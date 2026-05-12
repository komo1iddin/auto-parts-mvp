import { PartForm } from "@/components/parts/PartForm";

export default function NewPartPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Yangi qism qo'shish</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <PartForm mode="create" />
      </div>
    </div>
  );
}
