<script setup lang="ts">
import { computed } from 'vue';
import { NCard, NFormItem, NInput, NInputNumber, NDatePicker, NSpace } from 'naive-ui';
import { useI18n } from 'vue-i18n';

defineOptions({ name: 'BankTransactionForm' });

const { t } = useI18n();

interface BankRecord {
  bankAccount: string;
  paymentDate: number | null;
  serialNumber: string;
  chequeNo: string;
  paymentAmount: number;
  otherFees: number;
}

interface Props {
  bankRecord: BankRecord;
}

const props = defineProps<Props>();

interface Emits {
  'update:bankRecord': [value: BankRecord];
}

const emit = defineEmits<Emits>();

const paymentAmount = defineModel<number>('paymentAmount', { default: 0 });
const otherFees = defineModel<number>('otherFees', { default: 0 });

const balanceAmount = computed(() => {
  return (paymentAmount.value || 0) - (otherFees.value || 0);
});

function updateBankRecordField<K extends keyof BankRecord>(field: K, value: BankRecord[K]) {
  emit('update:bankRecord', { ...props.bankRecord, [field]: value });
}
</script>

<template>
  <NCard size="small" :bordered="true" :title="t('page.settlement.writeoff.create.bankTransactionRecord')">
    <NSpace vertical :size="12">
      <NFormItem label="Bank Account" label-placement="left" label-width="120px">
        <NInput :value="bankRecord.bankAccount" placeholder="Select Bank Account" readonly />
      </NFormItem>
      <NSpace :size="16">
        <NFormItem label="Payment Date" label-placement="left" label-width="100px">
          <NDatePicker
            :value="bankRecord.paymentDate"
            type="date"
            class="w-full"
            @update:value="val => updateBankRecordField('paymentDate', val)"
          />
        </NFormItem>
        <NFormItem label="Serial number" label-placement="left" label-width="100px">
          <NInput
            :value="bankRecord.serialNumber"
            placeholder="Please Input"
            @update:value="val => updateBankRecordField('serialNumber', val)"
          />
        </NFormItem>
        <NFormItem label="Cheque No." label-placement="left" label-width="100px">
          <NInput
            :value="bankRecord.chequeNo"
            placeholder="Please Input"
            @update:value="val => updateBankRecordField('chequeNo', val)"
          />
        </NFormItem>
      </NSpace>
      <NSpace :size="16">
        <NFormItem label="Payment Amount" label-placement="left" label-width="120px">
          <NInputNumber
            v-model:value="paymentAmount"
            :precision="2"
            placeholder="0.00"
            :show-button="false"
            class="w-full"
          />
        </NFormItem>
        <NFormItem label="Balance" label-placement="left" label-width="100px">
          <NInput :value="balanceAmount.toFixed(2)" readonly class="w-full" />
        </NFormItem>
        <NFormItem label="Other Fees" label-placement="left" label-width="100px">
          <NInputNumber v-model:value="otherFees" :precision="2" placeholder="0" :show-button="false" class="w-full">
            <template #suffix>
              <span class="cursor-pointer">✏️</span>
            </template>
          </NInputNumber>
        </NFormItem>
      </NSpace>
    </NSpace>
  </NCard>
</template>
