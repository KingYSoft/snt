<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { $t } from '@/locales';
import { saveVessel } from '@/service/api/maintain/vessel';
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

const defaultFormData = () => ({
  id: 0,
  vessel_name: '',
  shipping_provider: '',
  lloyds_imo: '',
  vessel_type: '',
  call_sign: '',
  is_active: true
});

const fieldMap = {
  vessel_name: 'vessel_name',
  shipping_provider: 'shipping_provider',
  lloyds_imo: 'lloyds_imo',
  vessel_type: 'vessel_type',
  call_sign: 'call_sign',
  is_active: 'is_active'
};

const zeroOneFields = ['is_active'];

const vesselTypeOptions = [
  { label: 'CV', value: 'CV' },
  { label: 'CNT', value: 'CNT' },
  { label: 'BLK', value: 'BLK' }
];
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

const rules = computed<FormRules>(() => {
  const required = $t('form.required');

  return {
    vessel_name: [{ required: true, message: required }]
  };
});

async function handleSubmit() {
  await formRef.value?.validate();
  loading.value = true;
  try {
    await saveVessel(mapFrontendToBackend(formData.value, { fieldMap, zeroOneFields }));
    window.$message?.success($t('common.modifySuccess'));
    visible.value = false;
    emit('submitted');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NDrawer v-model:show="visible" :width="480">
    <NDrawerContent :title="title" :native-scrollbar="false">
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="120">
        <NFormItem :label="$t('page.maintain.vessel.vesselName')" path="vessel_name">
          <NInput v-model:value="formData.vessel_name" :placeholder="$t('page.maintain.vessel.vesselName')" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.vessel.shippingProvider')" path="shipping_provider">
          <NInput
            v-model:value="formData.shipping_provider"
            :placeholder="$t('page.maintain.vessel.shippingProvider')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.vessel.lloydsImo')" path="lloyds_imo">
          <NInput v-model:value="formData.lloyds_imo" :placeholder="$t('page.maintain.vessel.lloydsImo')" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.vessel.vesselType')" path="vessel_type">
          <NSelect
            v-model:value="formData.vessel_type"
            :options="vesselTypeOptions"
            :placeholder="$t('page.maintain.vessel.vesselType')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.vessel.callSign')" path="call_sign">
          <NInput v-model:value="formData.call_sign" :placeholder="$t('page.maintain.vessel.callSign')" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.vessel.isActive')" path="is_active">
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
