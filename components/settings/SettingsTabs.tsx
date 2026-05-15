"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CategoriesList } from "@/components/categories/CategoriesList";
import { SuppliersList } from "@/components/suppliers/SuppliersList";
import { CustomersList } from "@/components/customers/CustomersList";
import { UsersList } from "@/components/users/UsersList";
import { SettingsOptionsList } from "@/components/settings/SettingsOptionsList";
import type { SettingOption } from "@/lib/data";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children: Category[];
}

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  wechat: string | null;
  note: string | null;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  canCreateClientPayments: boolean;
  createdAt: string;
}

interface Props {
  categories: Category[];
  suppliers: Supplier[];
  customers: Customer[];
  users: User[];
  brands: SettingOption[];
  partQualityTypes: SettingOption[];
}

const TABS = [
  { id: "kategoriyalar", label: "Kategoriyalar" },
  { id: "taminotchilar", label: "Ta'minotchilar" },
  { id: "mijozlar", label: "Mijozlar" },
  { id: "foydalanuvchilar", label: "Foydalanuvchilar" },
  { id: "royxatlar", label: "Ro'yxatlar" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsTabs({ categories, suppliers, customers, users, brands, partQualityTypes }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("kategoriyalar");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sozlamalar</h1>
      </div>

      <div className="mb-6 flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "-mb-px px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-gray-900 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "kategoriyalar" && <CategoriesList categories={categories} />}
      {activeTab === "taminotchilar" && <SuppliersList suppliers={suppliers} />}
      {activeTab === "mijozlar" && <CustomersList customers={customers} />}
      {activeTab === "foydalanuvchilar" && <UsersList users={users} />}
      {activeTab === "royxatlar" && (
        <SettingsOptionsList
          sections={[
            {
              kind: "brand",
              title: "Brendlar",
              description: "Qism qo'shish va tahrirlashda Brend fieldida chiqadigan ro'yxat.",
              emptyText: "Brendlar hali qo'shilmagan",
              options: brands,
            },
            {
              kind: "part_quality_type",
              title: "Part quality typelar",
              description: "Original, OEM, Kopiya kabi qism sifat turlari.",
              emptyText: "Quality type hali qo'shilmagan",
              options: partQualityTypes,
            },
          ]}
        />
      )}
    </div>
  );
}
