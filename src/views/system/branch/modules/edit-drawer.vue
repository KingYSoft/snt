<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { $t } from '@/locales';
import { getBranch, queryBranchGroupList, saveBranch, type SysBranch } from '@/service/api/system/branch';

const props = defineProps<{
  operateType: 'add' | 'edit';
  editingData: SysBranch | null;
}>();

const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const financeGroupOptions = ref<Array<{ label: string; value: string }>>([]);

const title = computed(() => {
  if (props.operateType === 'add') return 'BRANCH';
  const code = String(formData.value.code || props.editingData?.code || '').trim();
  return code ? `BRANCH-${code}` : $t('common.edit');
});

const defaultFormData = (): SysBranch => ({
  pk: '',
  code: '',
  branch_name: '',
  company_pk: '',
  address1: '',
  address2: '',
  address3: '',
  city: '',
  state: '',
  postal_code: '',
  postcode: '',
  country_code: '',
  phone: '',
  fax: '',
  email: '',
  home_port: '',
  org_code: '',
  system_company: '',
  accounting_group_code: '',
  finance_group_code: null as any,
  is_active: 1,
  is_valid: 1
});

const formData = ref(defaultFormData());

const rules: FormRules = {
  code: { required: true, message: $t('form.required'), trigger: ['blur', 'input'] },
  branch_name: { required: true, message: $t('form.required'), trigger: ['blur', 'input'] }
};

function normalizeBranch(data: Partial<SysBranch> = {}): SysBranch {
  const next = { ...defaultFormData(), ...data };
  next.postal_code = data.postal_code || data.postcode || '';
  next.postcode = next.postal_code;
  next.finance_group_code = (data.finance_group_code as string) || (null as any);
  return next;
}

function resolveFinanceGroup(value: string | null | undefined) {
  if (!value) return null;
  const raw = String(value);
  const byValue = financeGroupOptions.value.find(item => item.value === raw);
  if (byValue) return byValue.value;
  const byLabel = financeGroupOptions.value.find(item => item.label === raw || item.label.startsWith(`${raw} `) || item.label.startsWith(`${raw} -`));
  return byLabel?.value ?? raw;
}

async function loadFinanceGroups() {
  try {
    const { data } = await queryBranchGroupList();
    financeGroupOptions.value = (data?.list ?? []).map(item => ({
      label: [item.code, item.desc || item.description].filter(Boolean).join(' - '),
      value: String(item.pk ?? item.code ?? '')
    }));
  } catch {
    financeGroupOptions.value = [];
  }
}

async function fillForm() {
  formData.value = defaultFormData();
  if (props.operateType !== 'edit') return;
  const pk = String(props.editingData?.pk ?? '').trim();
  if (!pk) {
    formData.value = normalizeBranch(props.editingData ?? {});
    return;
  }
  try {
    const { data } = await getBranch({ pk });
    formData.value = normalizeBranch(data ?? props.editingData ?? {});
  } catch {
    formData.value = normalizeBranch(props.editingData ?? {});
  }
}

watch(visible, async show => {
  if (!show) return;
  loading.value = true;
  try {
    await loadFinanceGroups();
    await fillForm();
    formData.value.finance_group_code = resolveFinanceGroup(formData.value.finance_group_code) as any;
  } finally {
    loading.value = false;
  }
});

async function handleSubmit() {
  await formRef.value?.validate();
  loading.value = true;
  try {
    const postal = formData.value.postal_code || formData.value.postcode || '';
    await saveBranch({
      ...formData.value,
      postal_code: postal,
      postcode: postal
    });
    window.$message?.success($t('common.saveSuccess'));
    visible.value = false;
    emit('submitted');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="title"
    :mask-closable="false"
    :auto-focus="false"
    style="width: 920px"
    content-style="max-height: 72vh; overflow: auto;"
  >
    <NSpin :show="loading">
      <NTabs type="line">
        <NTabPane name="detail" :tab="$t('page.system.branch.detail')">
          <NForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-placement="left"
            label-width="160"
            require-mark-placement="left"
            :show-feedback="false"
            class="pt-12px"
          >
            <NGrid :cols="2" :x-gap="16" :y-gap="12">
              <NFormItemGi :label="$t('page.system.branch.code')" path="code">
                <NInput v-model:value="formData.code" :disabled="operateType === 'edit'" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.branch.branchName')" path="branch_name">
                <NInput v-model:value="formData.branch_name" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.branch.address1')">
                <NInput v-model:value="formData.address1" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.branch.address2')">
                <NInput v-model:value="formData.address2" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.branch.address3')">
                <NInput v-model:value="formData.address3" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.branch.city')">
                <NInput v-model:value="formData.city" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.branch.state')">
                <NInput v-model:value="formData.state" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.branch.postcode')">
                <NInput v-model:value="formData.postal_code" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.branch.countryCode')">
                <NInput v-model:value="formData.country_code" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.branch.phone')">
                <NInput v-model:value="formData.phone" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.branch.fax')">
                <NInput v-model:value="formData.fax" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.branch.email')">
                <NInput v-model:value="formData.email" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.branch.homePort')">
                <NInput v-model:value="formData.home_port" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.branch.orgCode')">
                <NInput v-model:value="formData.org_code" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.branch.systemCompany')">
                <NInput v-model:value="formData.system_company" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.branch.accountingGroupCode')">
                <NInput v-model:value="formData.accounting_group_code" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.branch.financeGroupCode')">
                <NSelect
                  v-model:value="formData.finance_group_code"
                  :options="financeGroupOptions"
                  clearable
                  filterable
                  :placeholder="$t('common.pleaseSelect')"
                />
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NTabPane>
      </NTabs>
    </NSpin>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="loading" @click="handleSubmit">{{ $t('common.save') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
