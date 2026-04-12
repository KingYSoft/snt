import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { $t } from '@/locales';
import type { FormInst, FormRules } from 'naive-ui';
import { createOrUpdateOrganization, organizationTbl } from '@/service/api/maintain/organization';

export function useOrganizationForm() {
  const route = useRoute();
  const router = useRouter();
  const loading = ref(false);
  const skeletonLoading = ref(false);
  const cardLoading = ref(false);
  const activedTab = ref('1');

  const defaultDetailData = () => ({
    is_active: 1,
    is_debtor: 0,
    is_creditor: 0,
    ap_category: '',
    ap_external_creditor_code: '',
    ap_credit_limit: null,
    ap_payment_term_days: null,
    ap_payment_terms: '',
    ap_withholding_tax: '',
    ap_currency: '',
    bank_account: '',
    ar_category: '',
    ar_external_debtor_code: '',
    ar_credit_limit: null,
    ar_temp_credit_limit_increase: null,
    ar_temp_credit_limit_increase_expiry: '',
    ar_credit_on_hold: 0,
    ar_credit_approved: 0,
    ar_credit_approved_by: '',
    ar_combined_statement_invoice: 0,
    ar_credit_rating: '',
    ar_use_settlement_group_credit_limit: 0,
    ar_account_and_credit_review_due: '',
    ar_eft_customs_payment_method: '',
    ar_withholding_tax: null,
    ar_currency: '',
    ar_client_number: '',
    ar_term_days_list: [] as Record<string, any>[],
    ar_invoice_cycle_list: [] as Record<string, any>[],
    ar_periodic_invoicing_list: [] as Record<string, any>[]
  });

  const defaultData = () => ({
    org_code: '',
    org_full_name: '',
    org_is_active: 1,
    org_is_consignee: 0,
    org_is_consignor: 0,
    org_is_transport_client: 0,
    org_is_warehouse_client: 0,
    org_is_forwarder: 0,
    org_is_shipping_provider: 0,
    org_is_air_cto: 0,
    org_is_sea_cto: 0,
    org_is_air_line: 0,
    org_is_broker: 0,
    org_is_container_yard: 0,
    org_is_local_transport: 0,
    org_is_shipping_line: 0,
    org_is_container_leasing_company: 0,
    org_is_global_account: 0,
    org_is_national_account: 0,
    org_is_temp_account: 0,
    org_is_distribution_centre: 0,
    org_is_vgm_contractor: 0,
    org_language: '',
    org_category: '',
    org_screening_status: '',
    org_approved_by: '',
    detail: defaultDetailData(),
    addresses_list: [] as Record<string, any>[],
    contacts_list: [] as Record<string, any>[],
    staff_assignments_list: [] as Record<string, any>[]
  });

  const inputData = ref(defaultData());
  const inputDataRules: FormRules = {
    org_code: { required: true, message: $t('form.required') },

    org_full_name: { required: true, message: $t('form.required') }
  };

  const formRefs = ref<FormInst[]>([]);
  const registerFormRefs = (el: any) => {
    if (!el) {
      return;
    }
    if (!formRefs.value.includes(el)) {
      formRefs.value.push(el);
    }
  };

  const tabTitle = computed(() => {
    const tabTitleTemplate = route.query.pk || route.query.id ? 'Edit Organization - {org_code}' : 'New Organization';
    const orgCode = route.query.org_code || inputData.value.org_code || '';
    return tabTitleTemplate.replace('{org_code}', orgCode as string);
  });

  async function queryData(pk?: any, id?: any) {
    const actualPk = pk || route.params.pk || route.query.pk;
    const actualId = id || route.query.id;
    if (!actualPk && !actualId) return;

    loading.value = true;
    skeletonLoading.value = true;
    try {
      const filters: { key: string; op: string; val: any }[] = [];
      if (actualId) {
        filters.push({ key: 'id', op: '=', val: actualId });
      }
      if (actualPk) {
        filters.push({ key: 'pk', op: '=', val: actualPk });
      }

      const res = await organizationTbl({ filters });

      skeletonLoading.value = false;
      if (res.data && res.data.items && res.data.items.length > 0) {
        const el = res.data.items[0];
        inputData.value = {
          ...defaultData(),
          ...el
        };
        inputData.value.addresses_list = el.addresses || [];
        inputData.value.contacts_list = el.contacts || [];
        inputData.value.detail = {
          ...defaultDetailData(),
          ...el.detail
        };
        inputData.value.staff_assignments_list = el.staff_assignments_list || el.staff_assignments || [];
      } else {
        showOrganizationEmptyDialog();
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      showOrganizationEmptyDialog();
    } finally {
      loading.value = false;
      skeletonLoading.value = false;
    }
  }

  function showOrganizationEmptyDialog() {
    window.$dialog?.warning({
      title: 'Organization Not Exists.',
      content: 'This organization not exists. You can new organization or close page.',
      positiveText: 'New Organization',
      negativeText: 'Close',
      onPositiveClick: newOrganizationHandle,
      onNegativeClick: closeOrganizationPageHandle
    });
  }

  async function onSaveHandle() {
    // 验证所有表单
    let isValid = true;
    for (const formRef of formRefs.value) {
      try {
        await formRef.validate();
      } catch {
        isValid = false;
        break;
      }
    }

    if (!isValid) {
      window.$message?.error($t('form.validationFailed'));
      return;
    }

    cardLoading.value = true;
    try {
      // 创建保存数据，去掉 id 字段
      const saveData = {
        ...inputData.value,
        detail: inputData.value.detail || defaultDetailData(),
        addresses: inputData.value.addresses_list || [],
        contacts: inputData.value.contacts_list || []
      };

      const res = await createOrUpdateOrganization(saveData);
      if (res.data) {
        window.$message?.success($t('common.modifySuccess'));
        router.push({ name: 'maintain_organization' });
      }
    } catch (error) {
      console.error('Error saving organization:', error);
    } finally {
      cardLoading.value = false;
    }
  }

  function closeOrganizationPageHandle() {
    router.push({ name: 'maintain_organization' });
  }

  function newOrganizationHandle() {
    router.push({ name: 'maintain_organization_new' });
  }

  function addNewAddress() {
    inputData.value.addresses_list.push({});
  }

  function removeNewAddress(index: number) {
    inputData.value.addresses_list.splice(index, 1);
  }

  function addNewContact() {
    inputData.value.contacts_list.push({});
  }

  function removeNewContact(index: number) {
    inputData.value.contacts_list.splice(index, 1);
  }

  return {
    loading,
    skeletonLoading,
    cardLoading,
    activedTab,
    inputData,
    inputDataRules,
    tabTitle,
    queryData,
    onSaveHandle,
    closeOrganizationPageHandle,
    newOrganizationHandle,
    addNewAddress,
    removeNewAddress,
    addNewContact,
    removeNewContact,
    registerFormRefs
  };
}
