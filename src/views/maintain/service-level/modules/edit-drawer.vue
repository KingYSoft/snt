<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { $t } from '@/locales';
import { saveServiceLevel } from '@/service/api/maintain/service-level';
import { mapFrontendToBackend, mapBackendToFrontend } from '@/utils/maintain/field-mapper';

const props = defineProps<{ operateType: 'add' | 'edit'; editingData: Record<string, any> | null }>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const title = computed(() => (props.operateType === 'add' ? $t('common.add') : $t('common.edit')));

const defaultFormData = () => ({ id: 0, code: '', description: '', is_active: true });
const formData = ref(defaultFormData());

watch(
  () => props.editingData,
  val => {
    if (val) {
      formData.value = { ...defaultFormData(), ...mapBackendToFrontend(val, { zeroOneFields: ['is_active'] }) };
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
    await saveServiceLevel(mapFrontendToBackend(formData.value, { zeroOneFields: ['is_active'] }));
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
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="100">
        <NFormItem :label="$t('page.maintain.serviceLevel.code')" path="code">
          <NInput v-model:value="formData.code" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.serviceLevel.description')">
          <NInput v-model:value="formData.description" type="textarea" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.serviceLevel.isActive')">
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
