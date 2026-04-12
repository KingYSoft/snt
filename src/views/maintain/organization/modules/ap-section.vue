<script setup lang="ts">
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
    <NDivider title-placement="left">Credit Details</NDivider>
    <NGrid :cols="2" :x-gap="16" :y-gap="8">
      <NFormItemGi label="Credit Limit">
        <NInputNumber v-model:value="detail.ap_credit_limit" class="w-full" clearable />
      </NFormItemGi>
      <NFormItemGi label="Agreed Payment Method">
        <NInput v-model:value="detail.ap_payment_terms" />
      </NFormItemGi>
    </NGrid>

    <NDivider title-placement="left">Payment Terms</NDivider>
    <NGrid :cols="2" :x-gap="16" :y-gap="8">
      <NFormItemGi label="Payment Terms">
        <NInput v-model:value="detail.ap_payment_terms" />
      </NFormItemGi>
      <NFormItemGi label="Days">
        <NInputNumber v-model:value="detail.ap_payment_term_days" class="w-full" clearable />
      </NFormItemGi>
    </NGrid>

    <NDivider title-placement="left">Other</NDivider>
    <NGrid :cols="2" :x-gap="16" :y-gap="8">
      <NFormItemGi label="AP Category">
        <NInput v-model:value="detail.ap_category" />
      </NFormItemGi>
      <NFormItemGi label="External Creditor Code">
        <NInput v-model:value="detail.ap_external_creditor_code" />
      </NFormItemGi>
      <NFormItemGi label="Withholding Tax">
        <NInput v-model:value="detail.ap_withholding_tax" />
      </NFormItemGi>
      <NFormItemGi label="Default Currency">
        <NInput v-model:value="detail.ap_currency" />
      </NFormItemGi>
      <NFormItemGi label="Bank Account">
        <NInput v-model:value="detail.bank_account" />
      </NFormItemGi>
      <NFormItemGi :show-label="false">
        <NCheckbox v-model:checked="detail.is_creditor" :checked-value="1" :unchecked-value="0">
          Enable AP / Creditor
        </NCheckbox>
      </NFormItemGi>
    </NGrid>
  </NForm>
</template>
