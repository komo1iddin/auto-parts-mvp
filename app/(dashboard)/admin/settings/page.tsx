import { SettingsTabs } from "@/components/settings/SettingsTabs";
import {
  SETTING_OPTION_KINDS,
  getSettingOptions,
  getCategoriesList,
  getSuppliersList,
  getCustomersList,
  getUsersList,
} from "@/lib/data";

export default async function AdminSettingsPage() {
  const [categories, suppliers, customers, users, brands, partQualityTypes] = await Promise.all([
    getCategoriesList(),
    getSuppliersList(),
    getCustomersList(),
    getUsersList(),
    getSettingOptions(SETTING_OPTION_KINDS.brand),
    getSettingOptions(SETTING_OPTION_KINDS.partQualityType),
  ]);

  return (
    <SettingsTabs
      categories={categories}
      suppliers={suppliers}
      customers={customers}
      users={users}
      brands={brands}
      partQualityTypes={partQualityTypes}
    />
  );
}
