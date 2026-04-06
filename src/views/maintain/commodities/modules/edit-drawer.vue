<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { $t } from '@/locales';
import { saveCommodity } from '@/service/api/maintain/commodities';
import { mapFrontendToBackend, mapBackendToFrontend } from '@/utils/maintain/field-mapper';

const props = defineProps<{ operateType: 'add' | 'edit'; editingData: Record<string, any> | null }>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const title = computed(() => (props.operateType === 'add' ? $t('common.add') : $t('common.edit')));

const booleanFields = ['is_forwarding', 'is_shipping', 'is_hazardous'];
const zeroOneFields = ['is_active'];

const defaultFormData = () => ({
  id: 0,
  code: '',
  description: '',
  is_forwarding: false,
  is_shipping: false,
  is_active: true,
  is_hazardous: false
});
const formData = ref(defaultFormData());

watch(
  () => props.editingData,
  val => {
    if (val) {
      formData.value = { ...defaultFormData(), ...mapBackendToFrontend(val, { booleanFields, zeroOneFields }) };
    } else {
      formData.value = defaultFormData();
    }
  },
  { immediate: true }
);

const rules: FormRules = {
  code: { required: true, message: $t('form.required') }
};

async function handleSubmit() {
  await formRef.value?.validate();
  loading.value = true;
  try {
    await saveCommodity(mapFrontendToBackend(formData.value, { booleanFields, zeroOneFields }));
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
        <NFormItem :label="$t('page.maintain.commodities.code')" path="code">
          <NInput v-model:value="formData.code" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.commodities.description')">
          <NInput v-model:value="formData.description" type="textarea" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.commodities.isForwarding')">
          <NSwitch v-model:value="formData.is_forwarding" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.commodities.isShipping')">
          <NSwitch v-model:value="formData.is_shipping" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.commodities.isActive')">
          <NSwitch v-model:value="formData.is_active" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.commodities.isHazardous')">
          <NSwitch v-model:value="formData.is_hazardous" />
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
