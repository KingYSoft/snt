import { ref, computed } from 'vue';
import { getOutstandingBalance, getOutstandingItems } from '@/service/api/business/settlement';
import type { OutstandingBalance, OutstandingItem } from '@/service/api/business/settlement';

export function useOutstandingData() {
  const outstandingBalance = ref<OutstandingBalance | null>(null);
  const balanceLoading = ref(false);
  const outstandingItems = ref<OutstandingItem[]>([]);
  const itemsLoading = ref(false);
  const checkedRowKeys = ref<Array<string | number>>([]);

  // 搜索和过滤状态
  const searchKey = ref('jobNo');
  const searchVal = ref('');
  const feeCurrencyFilter = ref('');
  const showCheckedOnly = ref(false);

  // 计算已选明细合计
  const selectedTotal = computed(() => {
    return outstandingItems.value
      .filter(item => checkedRowKeys.value.includes(String(item.id)))
      .reduce((sum, item) => sum + (item.originalOutstandingAmount || item.amount || 0), 0);
  });

  // 计算外币对应的已结算金额
  const convertedSettledAmount = computed(() => {
    const isForeignCurrency =
      outstandingItems.value.length > 0 ? outstandingItems.value[0]?.originalCurrency !== 'CNY' : false;
    const exchangeRate = outstandingItems.value[0]?.exRate || 1;

    if (isForeignCurrency && exchangeRate && exchangeRate > 0) {
      return selectedTotal.value / exchangeRate;
    }
    return selectedTotal.value;
  });

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
      items = items.filter(item => checkedRowKeys.value.includes(String(item.id)));
    }

    return items;
  });

  // 加载结欠余额和明细项目
  async function loadOutstandingData(id: string) {
    if (!id) {
      outstandingBalance.value = null;
      outstandingItems.value = [];
      checkedRowKeys.value = [];
      return;
    }

    // 加载结欠余额
    balanceLoading.value = true;
    try {
      outstandingBalance.value = await getOutstandingBalance(id);
    } finally {
      balanceLoading.value = false;
    }

    // 加载明细项目
    itemsLoading.value = true;
    try {
      outstandingItems.value = await getOutstandingItems(id);
      checkedRowKeys.value = [];
    } finally {
      itemsLoading.value = false;
    }
  }

  // 重置搜索
  function resetSearch() {
    searchVal.value = '';
    feeCurrencyFilter.value = '';
    showCheckedOnly.value = false;
  }

  return {
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
  };
}
