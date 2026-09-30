<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { $t } from '@/locales';
import { saveSystemCompany, type SysCompany } from '@/service/api/system/company';

const props = defineProps<{
  operateType: 'add' | 'edit';
  editingData: SysCompany | null;
}>();

const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInst | null>(null);
const loading = ref(false);

const title = computed(() => {
  if (props.operateType === 'add') return 'COMPANY';
  const code = String(formData.value.code || props.editingData?.code || '').trim();
  return code ? `COMPANY-${code}` : $t('common.edit');
});

const defaultFormData = (): SysCompany => ({
  pk: '',
  code: '',
  name: '',
  business_reg_no: '',
  business_reg_no2: '',
  customs_registration_no: '',
  address1: '',
  address2: '',
  address3: '',
  city: '',
  postal_code: '',
  postcode: '',
  state: '',
  country_code: '',
  phone: '',
  fax: '',
  email: '',
  website: '',
  web_address: '',
  home_currency: '',
  org_code: '',
  is_gst_registered: 0,
  is_active: 1,
  is_valid: 1
});

const formData = ref(defaultFormData());

const rules: FormRules = {
  code: { required: true, message: $t('form.required'), trigger: ['blur', 'input'] },
  name: { required: true, message: $t('form.required'), trigger: ['blur', 'input'] }
};

function normalizeCompany(data: Partial<SysCompany> = {}): SysCompany {
  const next = { ...defaultFormData(), ...data };
  next.postal_code = data.postal_code || data.postcode || '';
  next.postcode = next.postal_code;
  next.website = data.website || data.web_address || '';
  next.web_address = next.website;
  next.is_gst_registered = Number(data.is_gst_registered ?? 0);
  return next;
}

function fillForm() {
  formRef.value?.restoreValidation();
  if (props.operateType === 'edit') {
    formData.value = normalizeCompany(props.editingData ?? {});
    return;
  }
  formData.value = defaultFormData();
}

watch(visible, show => {
  if (!show) return;
  fillForm();
});

async function handleSubmit() {
  await formRef.value?.validate();
  loading.value = true;
  try {
    const postal = formData.value.postal_code || formData.value.postcode || '';
    const website = formData.value.website || formData.value.web_address || '';
    await saveSystemCompany({
      ...formData.value,
      postal_code: postal,
      postcode: postal,
      website,
      web_address: website
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
        <NTabPane name="detail" :tab="$t('page.system.company.detail')">
          <NForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-placement="left"
            label-width="140"
            require-mark-placement="left"
            :show-feedback="false"
            class="pt-12px"
          >
            <NGrid :cols="2" :x-gap="16" :y-gap="12">
              <NFormItemGi :label="$t('page.system.company.code')" path="code">
                <NInput v-model:value="formData.code" :disabled="operateType === 'edit'" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.company.name')" path="name">
                <NInput v-model:value="formData.name" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.company.businessRegNo')">
                <NInput v-model:value="formData.business_reg_no" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.company.address1')">
                <NInput v-model:value="formData.address1" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.company.address2')">
                <NInput v-model:value="formData.address2" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.company.address3')">
                <NInput v-model:value="formData.address3" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.company.city')">
                <NInput v-model:value="formData.city" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.company.postcode')">
                <NInput v-model:value="formData.postal_code" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.company.state')">
                <NInput v-model:value="formData.state" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.company.countryCode')">
                <NInput v-model:value="formData.country_code" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.company.phone')">
                <NInput v-model:value="formData.phone" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.company.fax')">
                <NInput v-model:value="formData.fax" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.company.email')">
                <NInput v-model:value="formData.email" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.company.webAddress')">
                <NInput v-model:value="formData.website" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.company.homeCurrency')">
                <NInput v-model:value="formData.home_currency" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.company.orgCode')">
                <NInput v-model:value="formData.org_code" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.company.gstRegistered')">
                <NSwitch v-model:value="formData.is_gst_registered" :checked-value="1" :unchecked-value="0" />
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
