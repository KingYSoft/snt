<script setup lang="ts">
import { $t } from '@/locales';
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
  { key: 'job_type', title: $t('page.maintain.organization.jobType'), minWidth: 140 },
  { key: 'branch', title: $t('page.maintain.organization.branch'), minWidth: 140 },
  { key: 'department', title: $t('page.maintain.organization.department'), minWidth: 140 },
  { key: 'direction', title: $t('page.maintain.organization.direction'), minWidth: 140 },
  { key: 'transport_mode', title: $t('page.maintain.organization.transportMode'), minWidth: 140 },
  { key: 'invoice_type', title: $t('page.maintain.organization.invoiceType'), minWidth: 140 },
  { key: 'invoice_term', title: $t('page.maintain.organization.invoiceTerm'), minWidth: 140 },
  { key: 'days_months', title: $t('page.maintain.organization.daysMonths'), minWidth: 140 }
];

const invoiceCycleColumns: DataTableColumns<Record<string, any>> = [
  { key: 'index', title: '#', width: 60, align: 'center', render: (_, index) => index + 1 },
  { key: 'from_day', title: $t('page.maintain.organization.fromDay'), minWidth: 140 },
  { key: 'to_day', title: $t('page.maintain.organization.toDay'), minWidth: 140 },
  { key: 'payment_day', title: $t('page.maintain.organization.paymentDay'), minWidth: 140 }
];

const periodicColumns: DataTableColumns<Record<string, any>> = [
  { key: 'index', title: '#', width: 60, align: 'center', render: (_, index) => index + 1 },
  { key: 'job_type', title: $t('page.maintain.organization.jobType'), minWidth: 140 },
  { key: 'service_direction', title: $t('page.maintain.organization.serviceDirection'), minWidth: 160 },
  { key: 'transport', title: $t('page.maintain.organization.transport'), minWidth: 140 }
];

const termDays = computed(() => detail.value.ar_term_days_list || []);
const invoiceCycles = computed(() => detail.value.ar_invoice_cycle_list || []);
const periodicInvoicingConfigs = computed(() => detail.value.ar_periodic_invoicing_list || []);
</script>

<template>
  <NForm :model="detail" label-placement="left" label-width="220" :disabled="props.readonly">
    <NDivider title-placement="left">{{ $t('page.maintain.organization.creditControl') }}</NDivider>
    <NGrid :cols="2" :x-gap="16" :y-gap="8">
      <NFormItemGi :label="$t('page.maintain.organization.creditLimit')">
        <NInputNumber v-model:value="detail.ar_credit_limit" class="w-full" clearable />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.acCreditReviewDue')">
        <NInput v-model:value="detail.ar_account_and_credit_review_due" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.tempCreditLimitIncrease')">
        <NInputNumber v-model:value="detail.ar_temp_credit_limit_increase" class="w-full" clearable />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.expiresAt')">
        <NInput v-model:value="detail.ar_temp_credit_limit_increase_expiry" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.agreedPaymentMethod')">
        <NInput v-model:value="detail.ar_eft_customs_payment_method" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.creditApprovedBy')">
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
          {{ $t('page.maintain.organization.useSettlementGroupCreditLimit') }}
        </NCheckbox>
      </NFormItemGi>
      <NFormItemGi :show-label="false">
        <NCheckbox v-model:checked="detail.ar_credit_on_hold" :checked-value="1" :unchecked-value="0">
          {{ $t('page.maintain.organization.arOnCreditHold') }}
        </NCheckbox>
      </NFormItemGi>
      <NFormItemGi :show-label="false">
        <NCheckbox v-model:checked="detail.ar_credit_approved" :checked-value="1" :unchecked-value="0">
          {{ $t('page.maintain.organization.creditApproved') }}
        </NCheckbox>
      </NFormItemGi>
      <NFormItemGi :show-label="false">
        <NCheckbox v-model:checked="detail.ar_combined_statement_invoice" :checked-value="1" :unchecked-value="0">
          {{ $t('page.maintain.organization.combinedStatementInvoice') }}
        </NCheckbox>
      </NFormItemGi>
    </NGrid>

    <NDivider title-placement="left">{{ $t('page.maintain.organization.termsAndOther') }}</NDivider>
    <NGrid :cols="2" :x-gap="16" :y-gap="8">
      <NFormItemGi :label="$t('page.maintain.organization.arCategory')">
        <NInput v-model:value="detail.ar_category" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.externalDebtorCode')">
        <NInput v-model:value="detail.ar_external_debtor_code" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.clientNumber')">
        <NInput v-model:value="detail.ar_client_number" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.creditRating')">
        <NInput v-model:value="detail.ar_credit_rating" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.withholdingTax')">
        <NInputNumber v-model:value="detail.ar_withholding_tax" class="w-full" clearable />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.currency')">
        <NInput v-model:value="detail.ar_currency" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.bankAccount')">
        <NInput v-model:value="detail.bank_account" />
      </NFormItemGi>
      <NFormItemGi :show-label="false">
        <NCheckbox v-model:checked="detail.is_debtor" :checked-value="1" :unchecked-value="0">
          {{ $t('page.maintain.organization.enableArDebtor') }}
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
