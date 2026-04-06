<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { $t } from '@/locales';
import { saveShippingLines } from '@/service/api/maintain/shipping-lines';
import { mapFrontendToBackend, mapBackendToFrontend } from '@/utils/maintain/field-mapper';

const props = defineProps<{
  operateType: 'add' | 'edit';
  editingData: Record<string, any> | null;
}>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const title = computed(() => (props.operateType === 'add' ? $t('common.add') : $t('common.edit')));

const booleanFields = [
  'is_nvo',
  'ocean_carrier_messaging',
  'global_sailing_schedule',
  'container_automation',
  'e_si',
  'e_vgm',
  'e_so',
  'e_manifest'
];

const zeroOneFields = ['is_active'];

const defaultFormData = () => ({
  id: 0,
  scac_code: '',
  carrier_name: '',
  is_nvo: false,
  ocean_carrier_messaging: false,
  global_sailing_schedule: false,
  container_automation: false,
  e_si: false,
  e_vgm: false,
  e_so: false,
  e_manifest: false,
  is_active: true
});
const formData = ref(defaultFormData());

watch(
  () => props.editingData,
  val => {
    if (val) {
      formData.value = {
        ...defaultFormData(),
        ...mapBackendToFrontend(val, { booleanFields, zeroOneFields })
      };
    } else {
      formData.value = defaultFormData();
    }
  },
  { immediate: true }
);

const rules: FormRules = {
  scac_code: { required: true, message: $t('form.required') }
};

async function handleSubmit() {
  await formRef.value?.validate();
  loading.value = true;
  try {
    await saveShippingLines(mapFrontendToBackend(formData.value, { booleanFields, zeroOneFields }));
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
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="180">
        <NFormItem :label="$t('page.maintain.shippingLines.code')" path="scac_code">
          <NInput v-model:value="formData.scac_code" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.shippingLines.name')">
          <NInput v-model:value="formData.carrier_name" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.shippingLines.isNvo')">
          <NSwitch v-model:value="formData.is_nvo" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.shippingLines.oceanCarrierMessaging')">
          <NSwitch v-model:value="formData.ocean_carrier_messaging" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.shippingLines.globalSailingSchedule')">
          <NSwitch v-model:value="formData.global_sailing_schedule" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.shippingLines.containerAutomation')">
          <NSwitch v-model:value="formData.container_automation" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.shippingLines.eSi')">
          <NSwitch v-model:value="formData.e_si" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.shippingLines.eVgm')">
          <NSwitch v-model:value="formData.e_vgm" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.shippingLines.eSo')">
          <NSwitch v-model:value="formData.e_so" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.shippingLines.eManifest')">
          <NSwitch v-model:value="formData.e_manifest" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.shippingLines.isActive')">
          <NSwitch v-model:value="formData.is_active" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="loading" @click="handleSubmit">
            {{ $t('common.confirm') }}
          </NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
