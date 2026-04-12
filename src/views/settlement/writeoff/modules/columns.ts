import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NTag, NButton } from 'naive-ui';
import { useRouter } from 'vue-router';
import type { WriteoffRecord } from '@/service/api/business/settlement';

export function getWriteoffColumns(): DataTableColumns<WriteoffRecord> {
  const router = useRouter();

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
      title: '销账单号',
      width: 150,
      align: 'center' as const
    },
    {
      key: 'companyName',
      title: '公司名称',
      minWidth: 180
    },
    {
      key: 'amount',
      title: '销账金额',
      width: 130,
      align: 'right' as const,
      render: row => {
        return `${row.amount.toFixed(2)} ${row.currency}`;
      }
    },
    {
      key: 'currency',
      title: '币种',
      width: 90,
      align: 'center' as const
    },
    {
      key: 'writeoffDate',
      title: '销账日期',
      width: 120,
      align: 'center' as const
    },
    {
      key: 'status',
      title: '状态',
      width: 110,
      align: 'center' as const,
      render: row => {
        const statusMap = {
          draft: { type: 'default' as const, text: '草稿' },
          submitted: { type: 'info' as const, text: '已提交' },
          approved: { type: 'success' as const, text: '已批准' },
          rejected: { type: 'error' as const, text: '已拒绝' }
        };
        const status = statusMap[row.status] || statusMap.draft;
        return h(NTag, { type: status.type, size: 'small' }, () => status.text);
      }
    },
    {
      key: 'createdAt',
      title: '创建时间',
      width: 160,
      align: 'center' as const
    },
    {
      key: 'remark',
      title: '备注',
      minWidth: 150,
      ellipsis: {
        tooltip: true
      }
    },
    {
      key: 'actions',
      title: '操作',
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
            () => '查看'
          )
        ]);
      }
    }
  ];
}
