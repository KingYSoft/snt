import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NTag, NButton } from 'naive-ui';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { WriteoffRecord } from '@/service/api/business/settlement';

export function getWriteoffColumns(): DataTableColumns<WriteoffRecord> {
  const router = useRouter();
  const { t } = useI18n();

  return [
    {
      key: 'index',
      title: '#',
      width: 60,
      align: 'center' as const,
      render: (_, index) => index + 1
    },
    {
      key: 'writeoffNo',
      title: () => t('page.settlement.writeoff.writeoffNo'),
      width: 150,
      align: 'center' as const
    },
    {
      key: 'companyName',
      title: () => t('page.settlement.writeoff.companyName'),
      minWidth: 180
    },
    {
      key: 'amount',
      title: () => t('page.settlement.writeoff.amount'),
      width: 130,
      align: 'right' as const,
      render: row => {
        return `${row.amount.toFixed(2)} ${row.currency}`;
      }
    },
    {
      key: 'currency',
      title: () => t('page.settlement.writeoff.currency'),
      width: 90,
      align: 'center' as const
    },
    {
      key: 'writeoffDate',
      title: () => t('page.settlement.writeoff.writeoffDate'),
      width: 120,
      align: 'center' as const
    },
    {
      key: 'status',
      title: () => t('page.settlement.writeoff.status'),
      width: 110,
      align: 'center' as const,
      render: row => {
        const statusMap = {
          draft: { type: 'default' as const, text: () => t('page.settlement.writeoff.statusDraft') },
          submitted: { type: 'info' as const, text: () => t('page.settlement.writeoff.statusSubmitted') },
          approved: { type: 'success' as const, text: () => t('page.settlement.writeoff.statusApproved') },
          rejected: { type: 'error' as const, text: () => t('page.settlement.writeoff.statusRejected') }
        };
        const status = statusMap[row.status] || statusMap.draft;
        return h(NTag, { type: status.type, size: 'small' }, () => status.text());
      }
    },
    {
      key: 'createdAt',
      title: () => t('page.settlement.writeoff.createdAt'),
      width: 160,
      align: 'center' as const
    },
    {
      key: 'remark',
      title: () => t('page.settlement.writeoff.remark'),
      minWidth: 150,
      ellipsis: {
        tooltip: true
      }
    },
    {
      key: 'actions',
      title: () => t('page.settlement.writeoff.actions'),
      width: 100,
      align: 'center' as const,
      fixed: 'right' as const,
      render: row => {
        return h('div', { class: 'flex gap-8px justify-center' }, [
          h(
            NButton,
            {
              size: 'small',
              text: true,
              type: 'primary',
              onClick: () => {
                router.push({
                  name: 'settlement_writeoff-detail',
                  query: { writeoffNo: row.writeoffNo }
                });
              }
            },
            () => t('page.settlement.writeoff.view')
          )
        ]);
      }
    }
  ];
}
