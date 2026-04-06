<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { $t } from '@/locales';
import { saveBank } from '@/service/api/maintain/bank';
import { getCurrencyList } from '@/service/api/maintain/currency';
import { mapFrontendToBackend, mapBackendToFrontend } from '@/utils/maintain/field-mapper';

const props = defineProps<{ operateType: 'add' | 'edit'; editingData: Record<string, any> | null }>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const title = computed(() => (props.operateType === 'add' ? $t('common.add') : $t('common.edit')));
const currencyOptions = ref<Array<{ label: string; value: string }>>([]);

const fieldMap: Record<string, string> = {
  account_number: 'account_num',
  abbreviation: 'bank_abbreviation',
  swift_code: 'swift'
};

const zeroOneFields = ['is_active'];

const defaultFormData = () => ({
  id: 0,
  code: '',
  description: '',
  bank_name: '',
  account_number: '',
  currency: '',
  account_type: '',
  abbreviation: '',
  account_eft: '',
  gl_account: '',
  bank_address: '',
  branch: '',
  company: '',
  swift_code: '',
  is_active: true
});
const formData = ref(defaultFormData());

watch(
  () => props.editingData,
  val => {
    if (val) {
      formData.value = {
        ...defaultFormData(),
        ...mapBackendToFrontend(val, { fieldMap, zeroOneFields })
      };
    } else {
      formData.value = defaultFormData();
    }
  },
  { immediate: true }
);

const rules: FormRules = {
  code: { required: true, message: $t('form.required') },
  bank_name: { required: true, message: $t('form.required') }
};

async function loadCurrencyOptions() {
  try {
    const res = await getCurrencyList();
    if (res.data) {
      currencyOptions.value = res.data.map((item: any) => ({
        label: item.desc || item.code,
        value: item.code
      }));
    }
  } catch {
    // ignore
  }
}

onMounted(() => {
  loadCurrencyOptions();
});

async function handleSubmit() {
  await formRef.value?.validate();
  loading.value = true;
  try {
    await saveBank(mapFrontendToBackend(formData.value, { fieldMap, zeroOneFields }));
    window.$message?.success($t('common.modifySuccess'));
    visible.value = false;
    emit('submitted');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NDrawer v-model:show="visible" :width="520">
    <NDrawerContent :title="title" :native-scrollbar="false">
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="120">
        <NFormItem :label="$t('page.maintain.bank.code')" path="code">
          <NInput v-model:value="formData.code" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.bank.description')">
          <NInput v-model:value="formData.description" type="textarea" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.bank.bankName')" path="bank_name">
          <NInput v-model:value="formData.bank_name" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.bank.accountNumber')">
          <NInput v-model:value="formData.account_number" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.bank.currency')">
          <NSelect v-model:value="formData.currency" :options="currencyOptions" filterable clearable />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.bank.accountType')">
          <NInput v-model:value="formData.account_type" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.bank.abbreviation')">
          <NInput v-model:value="formData.abbreviation" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.bank.accountEft')">
          <NInput v-model:value="formData.account_eft" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.bank.glAccount')">
          <NInput v-model:value="formData.gl_account" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.bank.bankAddress')">
          <NInput v-model:value="formData.bank_address" type="textarea" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.bank.branch')">
          <NInput v-model:value="formData.branch" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.bank.company')">
          <NInput v-model:value="formData.company" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.bank.swiftCode')">
          <NInput v-model:value="formData.swift_code" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.bank.isActive')">
          <NSwitch v-model:value="formData.is_active" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="loading" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
