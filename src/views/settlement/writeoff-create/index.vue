<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { NButton, NCard, NForm, NFormItem, NInput, NInputNumber, NSelect } from 'naive-ui';
import { queryBankPage } from '@/service/api/maintain/bank';
import { getCurrencyList } from '@/service/api/maintain/currency';
import { saveWriteoff, type WriteoffCreateRequest } from '@/service/api/business/settlement';
import { useOutstandingData } from './composables/useOutstandingData';
import { useExchangeRate } from './composables/useExchangeRate';
import { useFormRules } from './modules/validation';
import CompanySelector from './components/CompanySelector.vue';
import OutstandingBalance from './components/OutstandingBalance.vue';
import OutstandingItemsTable from './components/OutstandingItemsTable.vue';
import BankTransactionForm from './components/BankTransactionForm.vue';
import ExchangeRateCalculator from './components/ExchangeRateCalculator.vue';
import FileUploader from './components/FileUploader.vue';

defineOptions({ name: 'PageSettlementWriteoffCreate' });

const router = useRouter();
const { t } = useI18n();
const formRef = ref();
const saving = ref(false);

// 表单数据
const formData = ref<Omit<WriteoffCreateRequest, 'amount'>>({
  companyId: '',
  currency: 'CNY',
  itemIds: [],
  bankId: '',
  bankName: '',
  bankAccount: '',
  isForeignCurrency: false,
  exchangeRate: 1,
  paymentMethod: '',
  referenceNo: '',
  remark: ''
});

// 公司搜索
const companySearchQuery = ref('');

// 结欠数据
const {
  outstandingBalance,
  balanceLoading,
  outstandingItems,
  itemsLoading,
  checkedRowKeys,
  searchKey,
  searchVal,
  feeCurrencyFilter,
  showCheckedOnly,
  selectedTotal,
  convertedSettledAmount,
  displayOutstandingItems,
  loadOutstandingData,
  resetSearch
} = useOutstandingData();

// 汇率计算
const { exchangeRateOption, settledAmount, conversionOperation, referenceExRate, updateSettledAmount } =
  useExchangeRate();

// 银行交易记录数据
const bankRecord = ref({
  bankAccount: '',
  paymentDate: null as number | null,
  serialNumber: '',
  chequeNo: '',
  paymentAmount: 0,
  otherFees: 0
});

// 处理银行交易记录更新
function handleBankRecordUpdate(updatedRecord: typeof bankRecord.value) {
  bankRecord.value = { ...updatedRecord };
}

// 附件列表
const attachments = ref<string[]>([]);

// 币种选项
const currencyOptions = ref<Array<{ label: string; value: string }>>([]);
const baseCurrency = ref('CNY');

// 付款方式选项
const paymentMethodOptions = computed(() => [
  {
    label: t('page.settlement.writeoff.create.wireTransfer'),
    value: 'wire_transfer'
  },
  { label: t('page.settlement.writeoff.create.check'), value: 'check' },
  { label: t('page.settlement.writeoff.create.cash'), value: 'cash' },
  { label: t('page.settlement.writeoff.create.other'), value: 'other' }
]);

// 银行选项
const bankOptions = ref<Array<{ label: string; value: any; data?: any }>>([]);
const bankLoading = ref(false);

// 表单验证规则
const { rules } = useFormRules();

// 加载币种列表
async function loadCurrencies() {
  try {
    const response = (await getCurrencyList()) as any;
    const currencies = Array.isArray(response) ? response : response?.data || response?.result || [];
    if (currencies.length > 0) {
      currencyOptions.value = currencies.map((c: any) => ({
        label: `${c.code} - ${c.desc}`,
        value: c.code
      }));
    } else {
      throw new Error('No currencies found');
    }
  } catch (error) {
    console.error('Failed to load currencies, using defaults:', error);
    currencyOptions.value = [
      { label: 'CNY - Chinese Yuan', value: 'CNY' },
      { label: 'USD - US Dollar', value: 'USD' },
      { label: 'HKD - Hong Kong Dollar', value: 'HKD' },
      { label: 'EUR - Euro', value: 'EUR' },
      { label: 'JPY - Japanese Yen', value: 'JPY' }
    ];
  }
}

// 搜索银行
async function handleSearchBank(query: string) {
  if (!query) {
    bankOptions.value = [];
    return;
  }
  bankLoading.value = true;
  try {
    const result = (await queryBankPage({
      skipCount: 0,
      maxResultCount: 50,
      filters: [{ key: 'bank_name', op: 'Contain', val: query }]
    })) as any;
    const items = result?.data?.items || result?.items || [];
    bankOptions.value = items.map((item: any) => ({
      label: `${item.account_num}(${item.currency}) | ${item.bank_name}`,
      value: item.pk || String(item.id),
      data: item
    }));
  } finally {
    bankLoading.value = false;
  }
}

// 选择公司
function handleSelectCompany(company: any) {
  formData.value.companyId = company.value;
  companySearchQuery.value = company.label;
}

function handleClearCompany() {
  formData.value.companyId = '';
  companySearchQuery.value = '';
}

// 监听公司选择变化
watch(
  () => formData.value.companyId,
  async newCompanyId => {
    // TODO: 待删除
    const companyId = newCompanyId || '1';
    await loadOutstandingData(companyId);
  }
);

// 监听币种选择变化
watch(
  () => formData.value.currency,
  newCurrency => {
    formData.value.isForeignCurrency = newCurrency !== baseCurrency.value;
    if (formData.value.isForeignCurrency) {
      formData.value.exchangeRate = 1;
    }
  }
);

// 监听银行选择变化，自动填充银行信息
watch(
  () => formData.value.bankId,
  newBankId => {
    const selectedBank = bankOptions.value.find(b => b.value === newBankId);
    if (selectedBank && selectedBank.data) {
      formData.value.bankName = selectedBank.data.bank_name || '';
      formData.value.bankAccount = selectedBank.data.account_num || '';
      bankRecord.value.bankAccount = `${selectedBank.data.account_num}(${formData.value.currency}) | ${selectedBank.data.bank_name}`;
    }
  }
);

// 监听已选项目变化，自动更新已结算金额
watch([() => checkedRowKeys.value, () => formData.value.isForeignCurrency], () => {
  updateSettledAmount(convertedSettledAmount.value);
});

// 监听 settledAmount 变化，自动填充付款金额
watch(
  () => settledAmount.value,
  newAmount => {
    bankRecord.value.paymentAmount = newAmount;
  }
);

// 处理复选框变化
function handleCheck(rowKeys: Array<string | number>) {
  checkedRowKeys.value = rowKeys.map(String);
  formData.value.itemIds = rowKeys.map(String);
}

// 操作按钮处理
function handleVerificationByFee() {
  window.$message?.info(t('page.settlement.writeoff.create.verificationByFeeDetailsDeveloping'));
}

function handleAutoMatch() {
  window.$message?.info(t('page.settlement.writeoff.create.autoMatchDeveloping'));
}

function handleSetValue() {
  window.$message?.info(t('page.settlement.writeoff.create.setValueDeveloping'));
}

// 保存
async function handleSave() {
  try {
    await formRef.value?.validate();

    if (formData.value.itemIds.length === 0) {
      window.$message?.error(t('page.settlement.writeoff.create.pleaseSelectDetails'));
      return;
    }

    if (selectedTotal.value <= 0) {
      window.$message?.error(t('page.settlement.writeoff.create.settlementAmountMustBePositive'));
      return;
    }

    saving.value = true;
    const result = await saveWriteoff({
      ...formData.value,
      amount: selectedTotal.value
    } as WriteoffCreateRequest);

    if (result.success) {
      window.$message?.success(result.message || t('page.settlement.writeoff.create.saveSuccess'));
      router.push({ name: 'settlement_writeoff' });
    }
  } catch (error: any) {
    console.error('保存失败:', error);
    if (error?.message) {
      window.$message?.error(error.message);
    }
  } finally {
    saving.value = false;
  }
}

// 取消
function handleCancel() {
  router.back();
}

// 初始化
loadCurrencies();
</script>

<template>
  <div class="h-full overflow-auto p-16px">
    <NCard :title="t('page.settlement.writeoff.create.title')" :bordered="false">
      <template #header-extra>
        <div class="flex gap-2">
          <NButton @click="handleCancel">
            {{ t('page.settlement.writeoff.create.cancel') }}
          </NButton>
          <NButton type="primary" :loading="saving" @click="handleSave">
            {{ t('page.settlement.writeoff.create.save') }}
          </NButton>
        </div>
      </template>

      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="120px">
        <!-- 公司选择 -->
        <NFormItem :label="t('page.settlement.writeoff.create.settlementUnit')" path="companyId">
          <CompanySelector v-model="companySearchQuery" @select="handleSelectCompany" @clear="handleClearCompany" />
        </NFormItem>

        <!-- 结欠余额展示 -->
        <NFormItem :label="t('page.settlement.writeoff.create.outstandingBalance')">
          <OutstandingBalance :balance="outstandingBalance" :loading="balanceLoading" />
        </NFormItem>

        <!-- 明细选择表格 -->
        <NFormItem :label="t('page.settlement.writeoff.create.writeoffDetails')">
          <div class="w-full">
            <OutstandingItemsTable
              :items="displayOutstandingItems"
              :loading="itemsLoading"
              :checked-keys="checkedRowKeys"
              :search-key="searchKey"
              :search-value="searchVal"
              :fee-currency-filter="feeCurrencyFilter"
              :currency-options="currencyOptions"
              @update:checked-keys="handleCheck"
              @update:search-key="val => (searchKey = val)"
              @update:search-value="val => (searchVal = val)"
              @update:fee-currency-filter="val => (feeCurrencyFilter = val)"
              @reset="resetSearch"
              @verification="handleVerificationByFee"
              @auto-match="handleAutoMatch"
              @set-value="handleSetValue"
              @toggle-show-checked-only="() => (showCheckedOnly = !showCheckedOnly)"
            />
            <div v-if="outstandingItems.length > 0" class="mt-8px text-right">
              <span class="text-gray">{{ t('page.settlement.writeoff.create.selectedTotal') }}:</span>
              <span class="text-16px font-bold text-primary">{{ selectedTotal.toFixed(2) }}</span>
            </div>
          </div>
        </NFormItem>

        <!-- 支付信息汇总 -->
        <NFormItem v-if="outstandingBalance" :label="t('page.settlement.writeoff.create.paymentInfo') || '支付信息'">
          <div class="w-full p-16px bg-gray-50 rounded">
            <div class="space-y-8px">
              <div class="flex justify-between">
                <span class="text-gray">{{ t('page.settlement.writeoff.create.outstandingBalance') }}:</span>
                <span class="font-semibold">
                  {{ outstandingBalance.balance.toFixed(2) }}
                  {{ outstandingBalance.currency }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray">{{ t('page.settlement.writeoff.create.selectedTotalCNY') }}:</span>
                <span class="font-semibold text-primary">{{ selectedTotal.toFixed(2) }} CNY</span>
              </div>
              <div v-if="formData.isForeignCurrency" class="flex justify-between">
                <span class="text-gray">
                  {{
                    t('page.settlement.writeoff.create.selectedTotalCurrency', {
                      currency: formData.currency
                    })
                  }}:
                </span>
                <span class="font-semibold text-primary">
                  {{ convertedSettledAmount.toFixed(2) }}
                  {{ formData.currency }}
                </span>
              </div>
              <div v-if="formData.isForeignCurrency" class="text-12px text-gray">
                {{
                  t('page.settlement.writeoff.create.rateInfo', {
                    currency: formData.currency,
                    rate: formData.exchangeRate || 0
                  })
                }}
              </div>
            </div>
          </div>
        </NFormItem>

        <!-- 银行选择 -->
        <NFormItem :label="t('page.settlement.writeoff.create.bank')" path="bankId">
          <NSelect
            v-model:value="formData.bankId"
            :options="bankOptions"
            :loading="bankLoading"
            filterable
            remote
            clearable
            :placeholder="t('page.settlement.writeoff.create.selectBank')"
            @search="handleSearchBank"
          />
        </NFormItem>

        <!-- 银行交易记录 -->
        <NFormItem :label="t('page.settlement.writeoff.create.bankTransactionRecord')">
          <div class="w-full">
            <BankTransactionForm
              v-model:payment-amount="bankRecord.paymentAmount"
              v-model:other-fees="bankRecord.otherFees"
              :bank-record="bankRecord"
              @update:bank-record="handleBankRecordUpdate"
            />
          </div>
        </NFormItem>

        <!-- 汇率和金额计算 -->
        <NFormItem :label="t('page.settlement.writeoff.create.exchangeRateAndAmount')">
          <div class="w-full">
            <ExchangeRateCalculator
              v-model:exchange-rate-option="exchangeRateOption"
              v-model:settled-amount="settledAmount"
              v-model:conversion-operation="conversionOperation"
              v-model:reference-ex-rate="referenceExRate"
              :currency="formData.currency"
              :is-foreign-currency="formData.isForeignCurrency"
            />
          </div>
        </NFormItem>

        <!-- 附件上传 -->
        <NFormItem :label="t('page.settlement.writeoff.create.attachmentUpload')">
          <div class="w-full">
            <FileUploader v-model="attachments" />
          </div>
        </NFormItem>

        <!-- 币种选择 -->
        <NFormItem :label="t('page.settlement.writeoff.currency')" path="currency">
          <NSelect
            v-model:value="formData.currency"
            :options="currencyOptions"
            :placeholder="t('page.settlement.writeoff.create.selectCurrency')"
          />
        </NFormItem>

        <!-- 汇率输入（外币时显示） -->
        <NFormItem v-if="formData.isForeignCurrency" :label="t('page.settlement.writeoff.create.exchangeRate')">
          <NInputNumber
            v-model:value="formData.exchangeRate"
            :min="0"
            :precision="4"
            :placeholder="t('page.settlement.writeoff.create.exchangeRate')"
            :show-button="false"
            class="w-full"
          >
            <template #suffix>{{ formData.currency }} → {{ baseCurrency }}</template>
          </NInputNumber>
          <div v-if="selectedTotal > 0" class="ml-16px text-gray">
            {{ t('page.settlement.writeoff.create.convertedAmount') }}:
            {{ (selectedTotal * (formData.exchangeRate || 1)).toFixed(2) }}
            {{ baseCurrency }}
          </div>
        </NFormItem>

        <!-- 付款方式 -->
        <NFormItem :label="t('page.settlement.writeoff.create.paymentMethod')" path="paymentMethod">
          <NSelect
            v-model:value="formData.paymentMethod"
            :options="paymentMethodOptions"
            :placeholder="t('page.settlement.writeoff.create.pleaseSelectPaymentMethod')"
          />
        </NFormItem>

        <!-- 参考号 -->
        <NFormItem :label="t('page.settlement.writeoff.create.referenceNo')">
          <NInput
            v-model:value="formData.referenceNo"
            :placeholder="t('page.settlement.writeoff.create.referenceNoPlaceholder')"
          />
        </NFormItem>

        <!-- 备注 -->
        <NFormItem :label="t('page.settlement.writeoff.create.remark')">
          <NInput
            v-model:value="formData.remark"
            type="textarea"
            :rows="3"
            :placeholder="t('page.settlement.writeoff.create.remarkPlaceholder')"
          />
        </NFormItem>
      </NForm>
    </NCard>
  </div>
</template>

<style scoped>
.space-y-8px > * + * {
  margin-top: 8px;
}

.space-y-4px > * + * {
  margin-top: 4px;
}

.company-dropdown {
  max-height: 400px;
  overflow-y: auto;
}
</style>
