<script setup lang="ts">
import { computed } from 'vue';
import type { DataTableColumns } from 'naive-ui';

defineOptions({ name: 'OrganizationArSection' });

const detail = defineModel<Record<string, any>>('detail', {
  required: true
});

interface Props {
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
});

const termDayColumns: DataTableColumns<Record<string, any>> = [
  { key: 'index', title: '#', width: 60, align: 'center', render: (_, index) => index + 1 },
  { key: 'job_type', title: 'Job Type', minWidth: 140 },
  { key: 'branch', title: 'Branch', minWidth: 140 },
  { key: 'department', title: 'Department', minWidth: 140 },
  { key: 'direction', title: 'Direction', minWidth: 140 },
  { key: 'transport_mode', title: 'Transport Mode', minWidth: 140 },
  { key: 'invoice_type', title: 'Invoice Type', minWidth: 140 },
  { key: 'invoice_term', title: 'Invoice Term', minWidth: 140 },
  { key: 'days_months', title: 'Days / Months', minWidth: 140 }
];

const invoiceCycleColumns: DataTableColumns<Record<string, any>> = [
  { key: 'index', title: '#', width: 60, align: 'center', render: (_, index) => index + 1 },
  { key: 'from_day', title: 'From Day', minWidth: 140 },
  { key: 'to_day', title: 'To Day', minWidth: 140 },
  { key: 'payment_day', title: 'Payment Day', minWidth: 140 }
];

const periodicColumns: DataTableColumns<Record<string, any>> = [
  { key: 'index', title: '#', width: 60, align: 'center', render: (_, index) => index + 1 },
  { key: 'job_type', title: 'Job Type', minWidth: 140 },
  { key: 'service_direction', title: 'Service Direction', minWidth: 160 },
  { key: 'transport', title: 'Transport', minWidth: 140 }
];

const termDays = computed(() => detail.value.ar_term_days_list || []);
const invoiceCycles = computed(() => detail.value.ar_invoice_cycle_list || []);
const periodicInvoicingConfigs = computed(() => detail.value.ar_periodic_invoicing_list || []);
</script>

<template>
  <NForm :model="detail" label-placement="left" label-width="220" :disabled="props.readonly">
    <NDivider title-placement="left">Credit Control</NDivider>
    <NGrid :cols="2" :x-gap="16" :y-gap="8">
      <NFormItemGi label="Credit Limit">
        <NInputNumber v-model:value="detail.ar_credit_limit" class="w-full" clearable />
      </NFormItemGi>
      <NFormItemGi label="A/C & Credit Review Due">
        <NInput v-model:value="detail.ar_account_and_credit_review_due" />
      </NFormItemGi>
      <NFormItemGi label="Temporary Credit Limit Increase">
        <NInputNumber v-model:value="detail.ar_temp_credit_limit_increase" class="w-full" clearable />
      </NFormItemGi>
      <NFormItemGi label="Expires At">
        <NInput v-model:value="detail.ar_temp_credit_limit_increase_expiry" />
      </NFormItemGi>
      <NFormItemGi label="Agreed Payment Method">
        <NInput v-model:value="detail.ar_eft_customs_payment_method" />
      </NFormItemGi>
      <NFormItemGi label="Credit Approved By">
        <NInput v-model:value="detail.ar_credit_approved_by" />
      </NFormItemGi>
    </NGrid>

    <NGrid :cols="2" :x-gap="16" :y-gap="8" class="mt-8px">
      <NFormItemGi :show-label="false">
        <NCheckbox
          v-model:checked="detail.ar_use_settlement_group_credit_limit"
          :checked-value="1"
          :unchecked-value="0"
        >
          Use Settlement Group Credit Limit
        </NCheckbox>
      </NFormItemGi>
      <NFormItemGi :show-label="false">
        <NCheckbox v-model:checked="detail.ar_credit_on_hold" :checked-value="1" :unchecked-value="0">
          AR On Credit Hold
        </NCheckbox>
      </NFormItemGi>
      <NFormItemGi :show-label="false">
        <NCheckbox v-model:checked="detail.ar_credit_approved" :checked-value="1" :unchecked-value="0">
          Credit Approved
        </NCheckbox>
      </NFormItemGi>
      <NFormItemGi :show-label="false">
        <NCheckbox v-model:checked="detail.ar_combined_statement_invoice" :checked-value="1" :unchecked-value="0">
          Combined Statement Invoice
        </NCheckbox>
      </NFormItemGi>
    </NGrid>

    <NDivider title-placement="left">Terms and Other</NDivider>
    <NGrid :cols="2" :x-gap="16" :y-gap="8">
      <NFormItemGi label="AR Category">
        <NInput v-model:value="detail.ar_category" />
      </NFormItemGi>
      <NFormItemGi label="External Debtor Code">
        <NInput v-model:value="detail.ar_external_debtor_code" />
      </NFormItemGi>
      <NFormItemGi label="Client Number">
        <NInput v-model:value="detail.ar_client_number" />
      </NFormItemGi>
      <NFormItemGi label="Credit Rating">
        <NInput v-model:value="detail.ar_credit_rating" />
      </NFormItemGi>
      <NFormItemGi label="Withholding Tax">
        <NInputNumber v-model:value="detail.ar_withholding_tax" class="w-full" clearable />
      </NFormItemGi>
      <NFormItemGi label="Currency">
        <NInput v-model:value="detail.ar_currency" />
      </NFormItemGi>
      <NFormItemGi label="Bank Account">
        <NInput v-model:value="detail.bank_account" />
      </NFormItemGi>
      <NFormItemGi :show-label="false">
        <NCheckbox v-model:checked="detail.is_debtor" :checked-value="1" :unchecked-value="0">
          Enable AR / Debtor
        </NCheckbox>
      </NFormItemGi>
    </NGrid>

    <NDivider title-placement="left">Terms and Term Days</NDivider>
    <NDataTable :columns="termDayColumns" :data="termDays" :bordered="false" size="small" :scroll-x="1200" />

    <NDivider title-placement="left">Invoice Cycle</NDivider>
    <NDataTable :columns="invoiceCycleColumns" :data="invoiceCycles" :bordered="false" size="small" :scroll-x="600" />

    <NDivider title-placement="left">Periodic Invoicing Configuration</NDivider>
    <NDataTable
      :columns="periodicColumns"
      :data="periodicInvoicingConfigs"
      :bordered="false"
      size="small"
      :scroll-x="700"
    />
  </NForm>
</template>
