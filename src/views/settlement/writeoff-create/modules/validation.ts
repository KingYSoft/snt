import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export function useFormRules() {
  const { t } = useI18n();

  const rules = computed(() => ({
    companyId: {
      required: true,
      message: t('page.settlement.writeoff.create.pleaseSelectCompany2'),
      trigger: 'change'
    },
    currency: { required: true, message: t('page.settlement.writeoff.create.pleaseSelectCurrency'), trigger: 'change' },
    bankId: { required: true, message: t('page.settlement.writeoff.create.selectBank'), trigger: 'change' },
    paymentMethod: {
      required: true,
      message: t('page.settlement.writeoff.create.pleaseSelectPaymentMethod'),
      trigger: 'change'
    }
  }));

  return { rules };
}
