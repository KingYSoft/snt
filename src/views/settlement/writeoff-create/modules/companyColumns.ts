import type { DataTableColumns } from 'naive-ui';
import { useI18n } from 'vue-i18n';

export function useCompanyColumns() {
  const { t } = useI18n();

  const columns: DataTableColumns<any> = [
    {
      key: 'index',
      title: '#',
      width: 60,
      render: (_: any, index: number) => index + 1
    },
    { key: 'name', title: t('page.settlement.writeoff.create.companyName'), width: 250, ellipsis: { tooltip: true } },
    {
      key: 'nameEnglish',
      title: t('page.settlement.writeoff.create.companyNameEn'),
      width: 200,
      ellipsis: { tooltip: true }
    },
    {
      key: 'abbreviation',
      title: t('page.settlement.writeoff.create.abbreviation'),
      width: 150,
      ellipsis: { tooltip: true }
    },
    { key: 'code', title: t('page.settlement.writeoff.create.companyCode'), width: 130 }
  ];

  return { columns };
}
