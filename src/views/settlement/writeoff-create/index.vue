<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  NButton,
  NSpace,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NDataTable,
  NSpin,
  NPopover,
  NRadioGroup,
  NRadio,
  NDatePicker,
  NPagination
} from 'naive-ui';
import { queryCompanyPage } from '@/service/api/maintain/company';
import { queryBankPage } from '@/service/api/maintain/bank';
import { getCurrencyList } from '@/service/api/maintain/currency';
import {
  getOutstandingBalance,
  getOutstandingItems,
  saveWriteoff,
  type OutstandingBalance,
  type OutstandingItem,
  type WriteoffCreateRequest
} from '@/service/api/business/settlement';
import type { DataTableColumns } from 'naive-ui';

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

// 结欠余额
const outstandingBalance = ref<OutstandingBalance | null>(null);
const balanceLoading = ref(false);

// 明细项目
const outstandingItems = ref<OutstandingItem[]>([]);
const itemsLoading = ref(false);
const checkedRowKeys = ref<string[]>([]);

// 搜索和过滤状态
const searchKey = ref('jobNo');
const searchVal = ref('');
const feeCurrencyFilter = ref('');
const showCheckedOnly = ref(false);

// 公司选项
const companyOptions = ref<Array<{ label: string; value: string; data?: any }>>([]);
const companyLoading = ref(false);
const showCompanyDropdown = ref(false);
const companySearchQuery = ref('');

// 公司分页
const companyPagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0
});

// 银行选项
const bankOptions = ref<Array<{ label: string; value: any; data?: any }>>([]);
const bankLoading = ref(false);

// 银行交易记录表单数据
const bankRecord = ref({
  bankAccount: '',
  paymentDate: null as number | null,
  serialNumber: '',
  chequeNo: '',
  paymentAmount: 0,
  otherFees: 0
});

// 汇率选项
const exchangeRateOption = ref('bill'); // 'reference' | 'bill'
const settledAmount = ref(0);
const conversionOperation = ref('×');
const referenceExRate = ref(1.0);

// 计算转换后金额（用于汇率和金额计算区域显示）
const calculatedConvertedAmount = computed(() => {
  return settledAmount.value * referenceExRate.value;
});

// 计算总金额
const totalAmount = computed(() => {
  return calculatedConvertedAmount.value + bankRecord.value.otherFees;
});

// 计算余额：余额 = 付款金额 - (已选明细项目的合计欠款金额 + other fees)
const balanceAmount = computed(() => {
  return bankRecord.value.paymentAmount - (settledAmount.value + bankRecord.value.otherFees);
});

// 附件列表
const attachments = ref<string[]>([]);

// 币种选项
const currencyOptions = ref<Array<{ label: string; value: string }>>([]);
const baseCurrency = ref('CNY');

// 付款方式选项
const paymentMethodOptions = computed(() => [
  { label: t('page.settlement.writeoff.create.wireTransfer'), value: 'wire_transfer' },
  { label: t('page.settlement.writeoff.create.check'), value: 'check' },
  { label: t('page.settlement.writeoff.create.cash'), value: 'cash' },
  { label: t('page.settlement.writeoff.create.other'), value: 'other' }
]);

// 计算已选明细合计
const selectedTotal = computed(() => {
  return outstandingItems.value
    .filter(item => checkedRowKeys.value.includes(item.id))
    .reduce((sum, item) => sum + (item.originalOutstandingAmount || item.amount || 0), 0);
});

// 计算外币对应的已结算金额
// 当选择外币时，将 CNY 金额转换为外币金额
const convertedSettledAmount = computed(() => {
  if (formData.value.isForeignCurrency && formData.value.exchangeRate && formData.value.exchangeRate > 0) {
    return selectedTotal.value / formData.value.exchangeRate;
  }
  return selectedTotal.value;
});

// 监听 settledAmount 变化，自动填充付款金额
watch(
  () => settledAmount.value,
  newAmount => {
    bankRecord.value.paymentAmount = newAmount;
  }
);

// 过滤后的明细列表
const displayOutstandingItems = computed(() => {
  let items = [...outstandingItems.value];

  // 应用搜索过滤
  if (searchVal.value) {
    const key = searchKey.value as keyof OutstandingItem;
    items = items.filter(item => {
      const value = String(item[key] || '').toLowerCase();
      return value.includes(searchVal.value.toLowerCase());
    });
  }

  // 应用币种过滤
  if (feeCurrencyFilter.value) {
    items = items.filter(item => item.originalCurrency === feeCurrencyFilter.value);
  }

  // 应用仅显示已选
  if (showCheckedOnly.value) {
    items = items.filter(item => checkedRowKeys.value.includes(item.id));
  }

  return items;
});

// 监听公司选择变化
watch(
  () => formData.value.companyId,
  async newCompanyId => {
    console.log('newCompanyId: ', newCompanyId);
    //TODO: 待删除
    newCompanyId = '1';
    if (newCompanyId) {
      // 加载结欠余额
      balanceLoading.value = true;
      try {
        outstandingBalance.value = await getOutstandingBalance(newCompanyId);
      } finally {
        balanceLoading.value = false;
      }

      // 加载明细项目
      itemsLoading.value = true;
      try {
        outstandingItems.value = await getOutstandingItems(newCompanyId);
        checkedRowKeys.value = [];
      } finally {
        itemsLoading.value = false;
      }
    } else {
      outstandingBalance.value = null;
      outstandingItems.value = [];
      checkedRowKeys.value = [];
    }
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

// 监听已选项目、币种、汇率变化，自动更新已结算金额
watch(
  [() => checkedRowKeys.value, () => formData.value.isForeignCurrency, () => formData.value.exchangeRate],
  () => {
    settledAmount.value = convertedSettledAmount.value;
  },
  { deep: true }
);

// 搜索公司
async function handleSearchCompany(query: string, page = 1) {
  companySearchQuery.value = query;
  if (!query) {
    companyOptions.value = [];
    companyPagination.value.page = 1;
    companyPagination.value.itemCount = 0;
    return;
  }

  companyLoading.value = true;
  try {
    const skipCount = (page - 1) * companyPagination.value.pageSize;
    const result = (await queryCompanyPage({
      skipCount,
      maxResultCount: companyPagination.value.pageSize,
      filters: [{ key: 'name', op: 'Contain', val: query }]
    })) as any;

    // 处理 API 响应格式: { data: { items, totalCount }, success, errCode, msg }
    const items = result?.data?.items || result?.items || [];
    const totalCount = result?.data?.totalCount || result?.totalCount || 0;

    companyOptions.value = items.map((item: any) => ({
      label: item.name,
      value: item.pk || String(item.id),
      data: {
        ...item,
        nameEnglish: item.name,
        abbreviation: item.name?.length > 20 ? item.name.substring(0, 20) + '...' : item.name
      }
    }));

    // 更新分页信息
    companyPagination.value.page = page;
    companyPagination.value.itemCount = totalCount;
  } finally {
    companyLoading.value = false;
  }
}

// 处理公司分页变化
function handleCompanyPageChange(page: number) {
  handleSearchCompany(companySearchQuery.value, page);
}

// 选择公司
function handleSelectCompany(company: any) {
  formData.value.companyId = company.value;
  companySearchQuery.value = company.label;
  // 使用 nextTick 确保弹窗在下一个事件循环关闭，避免闪烁
  setTimeout(() => {
    showCompanyDropdown.value = false;
  }, 0);
}

// 搜索明细
function handleSearchItems() {
  // 过滤逻辑在 computed 中处理
}

// 重置搜索
function handleResetSearch() {
  searchVal.value = '';
  feeCurrencyFilter.value = '';
  showCheckedOnly.value = false;
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

// 文件上传处理
function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    attachments.value.push(file.name);
    window.$message?.success(`${t('page.settlement.writeoff.create.uploadSuccess')}: ${file.name}`);
  }
}

function handleRemoveAttachment(index: number) {
  attachments.value.splice(index, 1);
}

// 公司表格列定义
const companyColumns = computed<DataTableColumns<any>>(() => [
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
]);

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

    // 处理 API 响应格式: { data: { items, totalCount }, success, errCode, msg }
    const items = result?.data?.items || result?.items || [];

    bankOptions.value = items.map((item: any) => ({
      label: `${item.account_num}(${item.currency}) | ${item.bank_name}`,
      value: item.pk || String(item.id),
      data: item // 存储完整的银行数据用于自动填充
    }));
  } finally {
    bankLoading.value = false;
  }
}

// 加载币种列表
async function loadCurrencies() {
  try {
    const response = (await getCurrencyList()) as any;
    // 处理可能的响应格式：直接数组 或 { data: [...] } 或 { result: [...] }
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

// 明细表格列定义（14列）
const itemColumns = computed<DataTableColumns<OutstandingItem>>(() => [
  { type: 'selection', multiple: true },
  {
    key: 'jobNo',
    title: t('page.settlement.writeoff.create.jobNo'),
    width: 140,
    ellipsis: { tooltip: true }
  },
  {
    key: 'taxInvoiceNo',
    title: t('page.settlement.writeoff.create.taxInvoiceNo'),
    width: 140,
    ellipsis: { tooltip: true }
  },
  {
    key: 'billNo',
    title: t('page.settlement.writeoff.create.billNo'),
    width: 120,
    ellipsis: { tooltip: true }
  },
  {
    key: 'billingDate',
    title: t('page.settlement.writeoff.create.billingDate'),
    width: 120
  },
  {
    key: 'fee',
    title: t('page.settlement.writeoff.create.fee'),
    width: 150,
    ellipsis: { tooltip: true }
  },
  {
    key: 'originalCurrency',
    title: t('page.settlement.writeoff.create.originalCurrency'),
    width: 80
  },
  {
    key: 'originalOutstandingAmount',
    title: t('page.settlement.writeoff.create.originalOutstandingAmount'),
    width: 120,
    align: 'right',
    render: row => row.originalOutstandingAmount.toFixed(2)
  },
  {
    key: 'settledAmountOriginalCurrency',
    title: t('page.settlement.writeoff.create.settledAmountOriginalCurrency'),
    width: 140,
    align: 'right',
    render: row => row.settledAmountOriginalCurrency.toFixed(2)
  },
  {
    key: 'symbol',
    title: t('page.settlement.writeoff.create.symbol'),
    width: 80
  },
  {
    key: 'exRate',
    title: t('page.settlement.writeoff.create.exRate'),
    width: 100,
    align: 'right',
    render: row => row.exRate || '-'
  },
  {
    key: 'settledAmountConverted',
    title: t('page.settlement.writeoff.create.settledAmountConverted'),
    width: 140,
    align: 'right',
    render: row => row.settledAmountConverted.toFixed(2)
  },
  {
    key: 'convertedCurrency',
    title: t('page.settlement.writeoff.create.convertedCY'),
    width: 80
  }
]);

// 表单验证规则
const rules = computed(() => ({
  companyId: { required: true, message: t('page.settlement.writeoff.create.pleaseSelectCompany2'), trigger: 'change' },
  currency: { required: true, message: t('page.settlement.writeoff.create.pleaseSelectCurrency'), trigger: 'change' },
  bankId: { required: true, message: t('page.settlement.writeoff.create.selectBank'), trigger: 'change' },
  paymentMethod: {
    required: true,
    message: t('page.settlement.writeoff.create.pleaseSelectPaymentMethod'),
    trigger: 'change'
  }
}));

// 处理复选框变化
function handleCheck(rowKeys: any) {
  checkedRowKeys.value = rowKeys as string[];
  formData.value.itemIds = rowKeys as string[];
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
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="120px">
        <!-- 公司选择 -->
        <NFormItem :label="t('page.settlement.writeoff.create.settlementUnit')" path="companyId">
          <NPopover
            v-model:show="showCompanyDropdown"
            trigger="manual"
            placement="bottom-start"
            :width="700"
            :show-arrow="false"
          >
            <template #trigger>
              <NInput
                :value="companySearchQuery || formData.companyId"
                :placeholder="t('page.settlement.writeoff.create.selectCompany')"
                clearable
                @update:value="(val: string) => handleSearchCompany(val)"
                @focus="showCompanyDropdown = true"
              >
                <template #suffix>
                  <span class="text-gray cursor-pointer" @click.stop="showCompanyDropdown = !showCompanyDropdown">
                    ▼
                  </span>
                </template>
              </NInput>
            </template>
            <div class="company-dropdown">
              <NSpin :show="companyLoading">
                <NDataTable
                  :columns="companyColumns"
                  :data="
                    companyOptions.map((opt, index) => ({
                      index: index + 1,
                      id: opt.value,
                      name: opt.label,
                      nameEnglish: opt.data?.nameEnglish || opt.label,
                      abbreviation: opt.data?.abbreviation || '',
                      code: opt.data?.code || ''
                    }))
                  "
                  :max-height="300"
                  :scroll-x="800"
                  size="small"
                  :row-props="
                    (row: any) => ({
                      style: 'cursor: pointer;',
                      onClick: () => {
                        console.log('row: ', row);
                        const company = companyOptions.find(c => c.value === row.id);
                        if (company) {
                          handleSelectCompany(company);
                        }
                      }
                    })
                  "
                />
              </NSpin>
              <div v-if="companyOptions.length === 0 && !companyLoading" class="text-center p-16px text-gray">
                {{ t('page.settlement.writeoff.create.searchCompany') }}
              </div>
              <!-- 分页 -->
              <div v-if="companyPagination.itemCount > 0" class="flex justify-between items-center p-8px border-t">
                <span class="text-sm text-gray">
                  {{ t('page.settlement.writeoff.create.totalRecords', { count: companyPagination.itemCount }) }}
                </span>
                <NPagination
                  v-model:page="companyPagination.page"
                  :page-size="companyPagination.pageSize"
                  :item-count="companyPagination.itemCount"
                  size="small"
                  show-size-picker
                  :page-sizes="[10, 20, 50, 100]"
                  @update:page="handleCompanyPageChange"
                />
              </div>
            </div>
          </NPopover>
        </NFormItem>

        <!-- 结欠余额展示 -->
        <NFormItem :label="t('page.settlement.writeoff.create.outstandingBalance')">
          <NSpace v-if="balanceLoading" vertical>
            <NSpin :size="16" />
          </NSpace>
          <NSpace v-else-if="outstandingBalance" vertical>
            <div class="text-16px font-semibold">
              {{ outstandingBalance.companyName }}
            </div>
            <div class="text-20px font-bold text-primary">
              {{ outstandingBalance.balance.toFixed(2) }}
              {{ outstandingBalance.currency }}
            </div>
            <div
              v-if="outstandingBalance.baseCurrencyAmount !== undefined && outstandingBalance.exchangeRate"
              class="text-12px text-gray"
            >
              {{ t('page.settlement.writeoff.create.baseCurrencyAmount') }}:
              {{ outstandingBalance.baseCurrencyAmount.toFixed(2) }} CNY ({{
                t('page.settlement.writeoff.create.exchangeRate')
              }}: {{ outstandingBalance.exchangeRate }})
            </div>
          </NSpace>
          <div v-else class="text-gray">{{ t('page.settlement.writeoff.create.pleaseSelectCompany') }}</div>
        </NFormItem>

        <!-- 明细选择表格 -->
        <NFormItem :label="t('page.settlement.writeoff.create.writeoffDetails')">
          <div class="w-full">
            <!-- 搜索和操作栏 -->
            <NSpace vertical :size="12" class="w-full mb-8px">
              <NSpace :size="8">
                <NSelect
                  v-model:value="searchKey"
                  :options="[
                    { label: t('page.settlement.writeoff.create.jobNo'), value: 'jobNo' },
                    { label: t('page.settlement.writeoff.create.taxInvoiceNo'), value: 'taxInvoiceNo' },
                    { label: t('page.settlement.writeoff.create.billNo'), value: 'billNo' },
                    { label: t('page.settlement.writeoff.create.fee'), value: 'fee' }
                  ]"
                  style="width: 150px"
                />
                <NInput
                  v-model:value="searchVal"
                  :placeholder="t('page.settlement.writeoff.create.pleaseInput')"
                  clearable
                  style="width: 200px"
                  @keyup.enter="handleSearchItems"
                />
                <NSelect
                  v-model:value="feeCurrencyFilter"
                  :options="currencyOptions"
                  :placeholder="t('page.settlement.writeoff.create.feeCurrency')"
                  clearable
                  style="width: 150px"
                />
                <NButton @click="handleSearchItems">{{ t('page.settlement.writeoff.create.search') }}</NButton>
                <NButton @click="handleResetSearch">{{ t('page.settlement.writeoff.create.reset') }}</NButton>
                <NButton>{{ t('page.settlement.writeoff.create.showCheckedOnly') }}</NButton>
              </NSpace>
              <NSpace :size="8">
                <NButton type="primary" ghost @click="handleVerificationByFee">
                  {{ t('page.settlement.writeoff.create.verificationByFeeDetails') }}
                </NButton>
                <NButton @click="handleAutoMatch">{{ t('page.settlement.writeoff.create.autoMatch') }}</NButton>
                <NButton @click="handleSetValue">{{ t('page.settlement.writeoff.create.setValue') }}</NButton>
              </NSpace>
            </NSpace>
            <NSpin :show="itemsLoading">
              <NDataTable
                :columns="itemColumns"
                :data="displayOutstandingItems"
                :row-key="(row: OutstandingItem) => row.id"
                :checked-row-keys="checkedRowKeys"
                :max-height="250"
                :scroll-x="1400"
                @update:checked-row-keys="handleCheck"
              />
            </NSpin>
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
                  {{ outstandingBalance.balance.toFixed(2) }} {{ outstandingBalance.currency }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray">{{ t('page.settlement.writeoff.create.selectedTotalCNY') }}:</span>
                <span class="font-semibold text-primary">{{ selectedTotal.toFixed(2) }} CNY</span>
              </div>
              <div v-if="formData.isForeignCurrency" class="flex justify-between">
                <span class="text-gray">
                  {{ t('page.settlement.writeoff.create.selectedTotalCurrency', { currency: formData.currency }) }}:
                </span>
                <span class="font-semibold text-primary">
                  {{ convertedSettledAmount.toFixed(2) }} {{ formData.currency }}
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
            <NCard size="small" :bordered="true" :title="t('page.settlement.writeoff.create.bankTransactionRecord')">
              <NSpace vertical :size="12">
                <NFormItem label="Bank Account" label-placement="left" label-width="120px">
                  <NInput v-model:value="bankRecord.bankAccount" placeholder="Select Bank Account" readonly />
                </NFormItem>
                <NSpace :size="16">
                  <NFormItem label="Payment Date" label-placement="left" label-width="100px">
                    <NDatePicker v-model:value="bankRecord.paymentDate" type="date" class="w-full" />
                  </NFormItem>
                  <NFormItem label="Serial number" label-placement="left" label-width="100px">
                    <NInput v-model:value="bankRecord.serialNumber" placeholder="Please Input" />
                  </NFormItem>
                  <NFormItem label="Cheque No." label-placement="left" label-width="100px">
                    <NInput v-model:value="bankRecord.chequeNo" placeholder="Please Input" />
                  </NFormItem>
                </NSpace>
                <NSpace :size="16">
                  <NFormItem label="Payment Amount" label-placement="left" label-width="120px">
                    <NInputNumber
                      v-model:value="bankRecord.paymentAmount"
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
                    <NInputNumber
                      v-model:value="bankRecord.otherFees"
                      :precision="2"
                      placeholder="0"
                      :show-button="false"
                      class="w-full"
                    >
                      <template #suffix>
                        <span class="cursor-pointer">✏️</span>
                      </template>
                    </NInputNumber>
                  </NFormItem>
                </NSpace>
              </NSpace>
            </NCard>
          </div>
        </NFormItem>

        <!-- 汇率和金额计算 -->
        <NFormItem :label="t('page.settlement.writeoff.create.exchangeRateAndAmount')">
          <div class="w-full">
            <NCard size="small" :bordered="true" :title="t('page.settlement.writeoff.create.billExRate')">
              <NSpace vertical :size="12">
                <NRadioGroup v-model:value="exchangeRateOption">
                  <NSpace>
                    <NRadio value="reference">
                      {{ t('page.settlement.writeoff.create.writeOffAtReferenceExRate') }}
                    </NRadio>
                    <NRadio value="bill">{{ t('page.settlement.writeoff.create.billExRate') }}</NRadio>
                  </NSpace>
                </NRadioGroup>
                <!-- 显示原币种金额 -->
                <div v-if="formData.isForeignCurrency" class="text-sm text-gray">
                  {{ t('page.settlement.writeoff.create.originalCurrencyAmount') }}: {{ selectedTotal.toFixed(2) }} CNY
                  <span v-if="formData.exchangeRate">
                    → {{ formData.currency }}
                    {{
                      t('page.settlement.writeoff.create.rateInfo2', {
                        currency: formData.currency,
                        rate: formData.exchangeRate
                      })
                    }}
                  </span>
                </div>
                <NSpace :size="16" align="center">
                  <span>{{ formData.currency }}</span>
                  <NInputNumber
                    v-model:value="settledAmount"
                    :precision="2"
                    :min="0"
                    :show-button="false"
                    class="w-120px"
                  />
                  <NSelect
                    v-model:value="conversionOperation"
                    :options="[{ label: '×', value: '×' }]"
                    style="width: 60px"
                  />
                  <NInputNumber
                    v-model:value="referenceExRate"
                    :precision="6"
                    :min="0"
                    placeholder="1.000000"
                    :show-button="false"
                    class="w-120px"
                  />
                  <span>=</span>
                  <span>{{ calculatedConvertedAmount.toFixed(2) }} {{ formData.currency }}</span>
                  <span class="ml-16px font-bold">
                    {{ t('page.settlement.writeoff.create.total') }}: {{ totalAmount.toFixed(2) }}
                    {{ formData.currency }}
                  </span>
                </NSpace>
              </NSpace>
            </NCard>
          </div>
        </NFormItem>

        <!-- 附件上传 -->
        <NFormItem :label="t('page.settlement.writeoff.create.attachmentUpload')">
          <div class="w-full">
            <NCard size="small" :bordered="true" :title="t('page.settlement.writeoff.create.bankSlipAttachment')">
              <NSpace vertical :size="12">
                <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" @change="handleFileUpload" />
                <NButton @click="$el.querySelector('input[type=file]')?.click()">
                  <template #icon>
                    <span>📎</span>
                  </template>
                  {{ t('page.settlement.writeoff.create.selectFile') }}
                </NButton>
                <div v-if="attachments.length > 0" class="space-y-4px">
                  <div
                    v-for="(file, index) in attachments"
                    :key="index"
                    class="flex items-center justify-between p-8px bg-gray-50 rounded"
                  >
                    <span>{{ file }}</span>
                    <NButton text type="error" size="small" @click="handleRemoveAttachment(index)">
                      {{ t('page.settlement.writeoff.create.delete') }}
                    </NButton>
                  </div>
                </div>
              </NSpace>
            </NCard>
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
            {{ (selectedTotal * (formData.exchangeRate || 1)).toFixed(2) }} {{ baseCurrency }}
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

        <!-- 操作按钮 -->
        <NFormItem>
          <NSpace>
            <NButton type="primary" :loading="saving" @click="handleSave">
              {{ t('page.settlement.writeoff.create.save') }}
            </NButton>
            <NButton @click="handleCancel">{{ t('page.settlement.writeoff.create.cancel') }}</NButton>
          </NSpace>
        </NFormItem>
      </NForm>
    </NCard>
  </div>
</template>
