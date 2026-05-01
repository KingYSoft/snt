<script setup lang="ts">
import { h, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  NButton,
  NCard,
  NDataTable,
  NGrid,
  NGi,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NTag,
  NAutoComplete
} from 'naive-ui';
import type { DataTableRowKey } from 'naive-ui';

defineOptions({ name: 'PageSettlementReceivableTransactionsCreate' });

const router = useRouter();
const { t } = useI18n();

// ==================== Types ====================

interface ArChargeLine {
  id: number;
  jch_sort_num: number;
  trans_no: string;
  invoice_no: string;
  Charge_Code: string;
  Description: string;
  Debtor: string;
  Branch: string;
  Currency: string;
  Unit_Price: number;
  jch_unit: string;
  Qty: number;
  Amount: number;
  Tax_Code: string;
  Tax_Amount: number;
  Estimated_Cost: number;
  Exchange_Rate: number;
  Home_Amount: number;
  is_locked: number; // 0=open, 1=invoiced, 2=posted, 3=paid, 4=void
}

// ==================== State ====================

const saving = ref(false);
const tblSelected = ref<DataTableRowKey[]>([]);
const lines = ref<ArChargeLine[]>([]);

// TODO: remote lookup data - replace with real API calls
const chargeCodeList = ref<Array<{ code: string; description: string }>>([]);
const chargeCodeOpts = computed(() =>
  chargeCodeList.value.map(c => ({
    label: `${c.code} - ${c.description}`,
    value: c.code
  }))
);

const currencyList = ref<Array<{ code: string; desc: string }>>([]);
const currencyOpts = computed(() =>
  currencyList.value.map(c => ({
    label: `${c.code} - ${c.desc}`,
    value: c.code
  }))
);

const unitOptions = ['CNT', 'KGS', 'CBM', 'SET', 'HBL', 'DOC', 'CTN'].map(u => ({ label: u, value: u }));

// ==================== Helpers ====================

function generateNewId(): number {
  if (lines.value.length === 0) return -1;
  const minId = lines.value.reduce((min, item) => Math.min(item.id, min), 0);
  return minId > 0 ? -1 : minId - 1;
}

function createEmptyLine(): ArChargeLine {
  return {
    id: generateNewId(),
    jch_sort_num: lines.value.length + 1,
    trans_no: '',
    invoice_no: '',
    Charge_Code: '',
    Description: '',
    Debtor: '',
    Branch: '',
    Currency: '',
    Unit_Price: 0,
    jch_unit: 'CNT',
    Qty: 0,
    Amount: 0,
    Tax_Code: '',
    Tax_Amount: 0,
    Estimated_Cost: 0,
    Exchange_Rate: 1,
    Home_Amount: 0,
    is_locked: 0
  };
}

// ==================== Line operations ====================

function addNewLine() {
  lines.value.push(createEmptyLine());
}

function removeLine(index: number) {
  lines.value.splice(index, 1);
}

// ==================== Calculations ====================

function calcAmount(item: ArChargeLine) {
  const price = Number.parseFloat(String(item.Unit_Price)) || 0;
  const qty = Number.parseFloat(String(item.Qty)) || 0;
  item.Amount = Number((price * qty).toFixed(2));
}

function calcHomeAmount(item: ArChargeLine) {
  const amount = Number(item.Amount) || 0;
  const rate = Number(item.Exchange_Rate) || 1;
  item.Home_Amount = Number((amount * rate).toFixed(2));
}

// ==================== Locked status tag ====================

function renderLockedTag(isLocked: number) {
  const map: Record<
    number,
    {
      type: 'success' | 'warning' | 'error' | 'default' | 'info';
      label: string;
    }
  > = {
    0: { type: 'success', label: 'Open' },
    1: { type: 'warning', label: 'Invoiced' },
    2: { type: 'error', label: 'Posted' },
    3: { type: 'info', label: 'Paid' },
    4: { type: 'default', label: 'Void' }
  };
  const info = map[isLocked] ?? map[0];
  return h(NTag, { type: info.type, size: 'small' }, { default: () => info.label });
}

// ==================== Columns ====================

const columns = [
  {
    title: '',
    key: 'actions',
    width: 50,
    align: 'center' as const,
    render(_: any, index: number) {
      return h(
        NButton,
        {
          text: true,
          type: 'error',
          size: 'small',
          disabled: lines.value[index]?.is_locked !== 0,
          onClick: () => removeLine(index)
        },
        { default: () => 'Del' }
      );
    }
  },
  {
    title: 'Status',
    key: 'is_locked',
    width: 90,
    align: 'center' as const,
    render(row: ArChargeLine) {
      return renderLockedTag(row.is_locked);
    }
  },
  {
    title: 'Sort #',
    key: 'jch_sort_num',
    width: 80,
    render(row: ArChargeLine) {
      return h(NInputNumber, {
        value: row.jch_sort_num,
        size: 'small',
        disabled: row.is_locked !== 0,
        min: 1,
        step: 1,
        showButton: false,
        style: 'width:100%',
        onUpdateValue: (v: number | null) => {
          row.jch_sort_num = v ?? 1;
        }
      });
    }
  },
  {
    title: 'Invoice No',
    key: 'invoice_no',
    width: 130,
    render(row: ArChargeLine) {
      return h(NInput, {
        value: row.invoice_no,
        size: 'small',
        disabled: row.is_locked !== 0,
        onUpdateValue: (v: string) => {
          row.invoice_no = v;
        }
      });
    }
  },
  {
    title: 'Charge Code',
    key: 'Charge_Code',
    width: 140,
    render(row: ArChargeLine) {
      return h(NAutoComplete, {
        value: row.Charge_Code,
        options: chargeCodeOpts.value,
        size: 'small',
        disabled: row.is_locked !== 0,
        getShow: () => true,
        onUpdateValue: (v: string) => {
          row.Charge_Code = v;
        },
        onSelect: (v: string) => {
          row.Charge_Code = v;
          const cc = chargeCodeList.value.find(c => c.code === v);
          if (cc) row.Description = cc.description;
        }
      });
    }
  },
  {
    title: 'Description',
    key: 'Description',
    width: 150,
    render(row: ArChargeLine) {
      return h(NInput, {
        value: row.Description,
        size: 'small',
        disabled: row.is_locked !== 0,
        onUpdateValue: (v: string) => {
          row.Description = v;
        }
      });
    }
  },
  {
    title: 'Debtor',
    key: 'Debtor',
    width: 120,
    render(row: ArChargeLine) {
      return h(NInput, {
        value: row.Debtor,
        size: 'small',
        disabled: row.is_locked !== 0,
        onUpdateValue: (v: string) => {
          row.Debtor = v;
        }
      });
    }
  },
  {
    title: 'Branch',
    key: 'Branch',
    width: 80,
    render(row: ArChargeLine) {
      return h('span', null, row.Branch || '');
    }
  },
  {
    title: 'Currency',
    key: 'Currency',
    width: 100,
    render(row: ArChargeLine) {
      return h(NAutoComplete, {
        value: row.Currency,
        options: currencyOpts.value,
        size: 'small',
        disabled: row.is_locked !== 0,
        getShow: () => true,
        onUpdateValue: (v: string) => {
          row.Currency = v;
        }
      });
    }
  },
  {
    title: 'Unit Price',
    key: 'Unit_Price',
    width: 100,
    render(row: ArChargeLine) {
      return h(NInputNumber, {
        value: row.Unit_Price,
        size: 'small',
        disabled: row.is_locked !== 0,
        showButton: false,
        style: 'width:100%',
        onUpdateValue: (v: number | null) => {
          row.Unit_Price = v ?? 0;
          calcAmount(row);
          calcHomeAmount(row);
        }
      });
    }
  },
  {
    title: 'Unit',
    key: 'jch_unit',
    width: 90,
    render(row: ArChargeLine) {
      return h(NSelect, {
        value: row.jch_unit,
        options: unitOptions,
        size: 'small',
        disabled: row.is_locked !== 0,
        style: 'width:100%',
        onUpdateValue: (v: string) => {
          row.jch_unit = v;
        }
      });
    }
  },
  {
    title: 'Qty',
    key: 'Qty',
    width: 80,
    render(row: ArChargeLine) {
      return h(NInputNumber, {
        value: row.Qty,
        size: 'small',
        disabled: row.is_locked !== 0,
        showButton: false,
        style: 'width:100%',
        onUpdateValue: (v: number | null) => {
          row.Qty = v ?? 0;
          calcAmount(row);
          calcHomeAmount(row);
        }
      });
    }
  },
  {
    title: 'Amount',
    key: 'Amount',
    width: 110,
    align: 'right' as const,
    render(row: ArChargeLine) {
      return h('span', null, (row.Amount || 0).toFixed(2));
    }
  },
  {
    title: 'Tax Code',
    key: 'Tax_Code',
    width: 90,
    render(row: ArChargeLine) {
      return h('span', null, row.Tax_Code || '');
    }
  },
  {
    title: 'Tax Amount',
    key: 'Tax_Amount',
    width: 100,
    render(row: ArChargeLine) {
      return h(NInputNumber, {
        value: row.Tax_Amount,
        size: 'small',
        disabled: row.is_locked !== 0,
        showButton: false,
        style: 'width:100%',
        onUpdateValue: (v: number | null) => {
          row.Tax_Amount = v ?? 0;
        }
      });
    }
  },
  {
    title: 'Est. Cost',
    key: 'Estimated_Cost',
    width: 100,
    render(row: ArChargeLine) {
      return h(NInputNumber, {
        value: row.Estimated_Cost,
        size: 'small',
        disabled: row.is_locked !== 0,
        showButton: false,
        style: 'width:100%',
        onUpdateValue: (v: number | null) => {
          row.Estimated_Cost = v ?? 0;
        }
      });
    }
  },
  {
    title: 'Exch Rate',
    key: 'Exchange_Rate',
    width: 100,
    render(row: ArChargeLine) {
      return h(NInputNumber, {
        value: row.Exchange_Rate,
        size: 'small',
        disabled: row.is_locked !== 0,
        showButton: false,
        style: 'width:100%',
        onUpdateValue: (v: number | null) => {
          row.Exchange_Rate = v ?? 1;
          calcHomeAmount(row);
        }
      });
    }
  },
  {
    title: 'Home Amt',
    key: 'Home_Amount',
    width: 110,
    align: 'right' as const,
    render(row: ArChargeLine) {
      return h('span', null, (row.Home_Amount || 0).toFixed(2));
    }
  }
];

// ==================== Summary ====================

const totalAmount = computed(() => lines.value.reduce((sum, r) => sum + (Number(r.Amount) || 0), 0));
const totalTaxAmount = computed(() => lines.value.reduce((sum, r) => sum + (Number(r.Tax_Amount) || 0), 0));
const totalHomeAmount = computed(() => lines.value.reduce((sum, r) => sum + (Number(r.Home_Amount) || 0), 0));

// ==================== Actions ====================

// TODO: replace with real API call
async function handleSave() {
  if (lines.value.length === 0) {
    window.$message?.warning('Please add at least one line.');
    return;
  }

  saving.value = true;
  try {
    // TODO: call saveArTransaction API
    await new Promise(resolve => setTimeout(resolve, 500));
    window.$message?.success('Saved successfully.');
    router.push({ name: 'settlement_receivable-transactions' });
  } catch {
    window.$message?.error('Failed to save.');
  } finally {
    saving.value = false;
  }
}

function handleBack() {
  router.push({ name: 'settlement_receivable-transactions' });
}

// Initialize with one empty line
addNewLine();
</script>

<template>
  <div class="h-full overflow-auto p-16px">
    <NCard title="New AR Transaction" :bordered="false">
      <template #header-extra>
        <NSpace>
          <NButton type="primary" :loading="saving" @click="handleSave">
            {{ t('common.save') }}
          </NButton>
          <NButton @click="handleBack">{{ t('common.cancel') }}</NButton>
        </NSpace>
      </template>

      <!-- Summary bar -->
      <NGrid :cols="24" :x-gap="12" :y-gap="8" class="mb-12px">
        <NGi :span="6">
          <div class="flex items-center gap-8px">
            <span class="shrink-0 text-12px text-gray-500">Total Amount:</span>
            <span class="font-bold">{{ totalAmount.toFixed(2) }}</span>
          </div>
        </NGi>
        <NGi :span="6">
          <div class="flex items-center gap-8px">
            <span class="shrink-0 text-12px text-gray-500">Total Tax:</span>
            <span class="font-bold">{{ totalTaxAmount.toFixed(2) }}</span>
          </div>
        </NGi>
        <NGi :span="6">
          <div class="flex items-center gap-8px">
            <span class="shrink-0 text-12px text-gray-500">Total Home Amount:</span>
            <span class="font-bold">{{ totalHomeAmount.toFixed(2) }}</span>
          </div>
        </NGi>
        <NGi :span="6">
          <div class="flex items-center gap-8px">
            <span class="shrink-0 text-12px text-gray-500">Lines:</span>
            <span class="font-bold">{{ lines.length }}</span>
          </div>
        </NGi>
      </NGrid>

      <!-- Toolbar -->
      <NSpace class="mb-8px">
        <NButton type="primary" size="small" @click="addNewLine">Add Line</NButton>
      </NSpace>

      <!-- Editable Data Table -->
      <NDataTable
        v-model:checked-row-keys="tblSelected"
        :columns="columns"
        :data="lines"
        :bordered="true"
        size="small"
        :row-key="(row: ArChargeLine) => row.id"
        :scroll-x="2500"
        :max-height="400"
        striped
      />
    </NCard>
  </div>
</template>
