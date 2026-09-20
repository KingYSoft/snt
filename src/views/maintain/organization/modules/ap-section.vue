<script setup lang="ts">
import { $t } from '@/locales';
defineOptions({ name: 'OrganizationApSection' });

const detail = defineModel<Record<string, any>>('detail', {
  required: true
});

interface Props {
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
});
</script>

<template>
  <NForm :model="detail" label-placement="left" label-width="220" :disabled="props.readonly">
    <NDivider title-placement="left">{{ $t('page.maintain.organization.creditDetails') }}</NDivider>
    <NGrid :cols="2" :x-gap="16" :y-gap="8">
      <NFormItemGi :label="$t('page.maintain.organization.creditLimit')">
        <NInputNumber v-model:value="detail.ap_credit_limit" class="w-full" clearable />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.agreedPaymentMethod')">
        <NInput v-model:value="detail.ap_payment_terms" />
      </NFormItemGi>
    </NGrid>

    <NDivider title-placement="left">{{ $t('page.maintain.organization.paymentTerms') }}</NDivider>
    <NGrid :cols="2" :x-gap="16" :y-gap="8">
      <NFormItemGi :label="$t('page.maintain.organization.paymentTerms')">
        <NInput v-model:value="detail.ap_payment_terms" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.days')">
        <NInputNumber v-model:value="detail.ap_payment_term_days" class="w-full" clearable />
      </NFormItemGi>
    </NGrid>

    <NDivider title-placement="left">{{ $t('page.maintain.organization.other') }}</NDivider>
    <NGrid :cols="2" :x-gap="16" :y-gap="8">
      <NFormItemGi :label="$t('page.maintain.organization.apCategory')">
        <NInput v-model:value="detail.ap_category" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.externalCreditorCode')">
        <NInput v-model:value="detail.ap_external_creditor_code" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.withholdingTax')">
        <NInput v-model:value="detail.ap_withholding_tax" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.defaultCurrency')">
        <NInput v-model:value="detail.ap_currency" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.bankAccount')">
        <NInput v-model:value="detail.bank_account" />
      </NFormItemGi>
      <NFormItemGi :show-label="false">
        <NCheckbox v-model:checked="detail.is_creditor" :checked-value="1" :unchecked-value="0">
          {{ $t('page.maintain.organization.enableApCreditor') }}
        </NCheckbox>
      </NFormItemGi>
    </NGrid>
  </NForm>
</template>
