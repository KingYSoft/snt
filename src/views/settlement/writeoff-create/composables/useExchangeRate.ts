import { ref, computed } from 'vue';

export function useExchangeRate() {
  const exchangeRateOption = ref<'reference' | 'bill'>('bill');
  const settledAmount = ref(0);
  const conversionOperation = ref('×');
  const referenceExRate = ref(1.0);

  // 计算转换后金额
  const calculatedConvertedAmount = computed(() => {
    return settledAmount.value * referenceExRate.value;
  });

  // 计算总金额（需要 otherFees 作为参数）
  function calculateTotalAmount(otherFees: number) {
    return calculatedConvertedAmount.value + otherFees;
  }

  // 监听已选项目变化，自动更新已结算金额
  function updateSettledAmount(total: number) {
    settledAmount.value = total;
  }

  return {
    exchangeRateOption,
    settledAmount,
    conversionOperation,
    referenceExRate,
    calculatedConvertedAmount,
    calculateTotalAmount,
    updateSettledAmount
  };
}
