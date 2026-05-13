import { SettingsOptionsList } from "@/components/settings/SettingsOptionsList";
import { SETTING_OPTION_KINDS, getSettingOptions } from "@/lib/data";

export default async function AdminSettingsPage() {
  const [brands, partQualityTypes] = await Promise.all([
    getSettingOptions(SETTING_OPTION_KINDS.brand),
    getSettingOptions(SETTING_OPTION_KINDS.partQualityType),
  ]);

  return (
    <SettingsOptionsList
      sections={[
        {
          kind: SETTING_OPTION_KINDS.brand,
          title: "Brendlar",
          description: "Qism qo'shish va tahrirlashda Brend fieldida chiqadigan ro'yxat.",
          emptyText: "Brendlar hali qo'shilmagan",
          options: brands,
        },
        {
          kind: SETTING_OPTION_KINDS.partQualityType,
          title: "Part quality typelar",
          description: "Original, OEM, Kopiya kabi qism sifat turlari.",
          emptyText: "Quality type hali qo'shilmagan",
          options: partQualityTypes,
        },
      ]}
    />
  );
}
