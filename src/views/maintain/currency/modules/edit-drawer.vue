<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { $t } from '@/locales';
import { saveCurrency } from '@/service/api/maintain/currency';

const props = defineProps<{
  operateType: 'add' | 'edit';
  editingData: Record<string, any> | null;
}>();

const emit = defineEmits<{
  (e: 'submitted'): void;
}>();

const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInst | null>(null);
const loading = ref(false);

const title = computed(() => (props.operateType === 'add' ? $t('common.add') : $t('common.edit')));

const defaultFormData = () => ({
  id: 0,
  code: '',
  symbol: '',
  desc: ''
});

const formData = ref(defaultFormData());

watch(
  () => props.editingData,
  val => {
    formData.value = val ? { ...defaultFormData(), ...val } : defaultFormData();
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
    await saveCurrency(formData.value);
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
        <NFormItem :label="$t('page.maintain.currency.code')" path="code">
          <NInput v-model:value="formData.code" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.currency.symbol')" path="symbol">
          <NInput v-model:value="formData.symbol" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.currency.desc')">
          <NInput v-model:value="formData.desc" type="textarea" />
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
