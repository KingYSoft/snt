<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { $t } from '@/locales';
import { saveChargeCode } from '@/service/api/maintain/charge-code';
import { mapFrontendToBackend, mapBackendToFrontend } from '@/utils/maintain/field-mapper';

const props = defineProps<{ operateType: 'add' | 'edit'; editingData: Record<string, any> | null }>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const title = computed(() => (props.operateType === 'add' ? $t('common.add') : $t('common.edit')));

const zeroOneFields = ['is_active'];

const defaultFormData = () => ({
  id: 0,
  code: '',
  description: '',
  language_description: '',
  is_active: true,
  type: '',
  margin: null as number | null,
  tax: null as number | null,
  withholding: null as number | null,
  calculator: '',
  print_sequence: null as number | null
});
const formData = ref(defaultFormData());

watch(
  () => props.editingData,
  val => {
    if (val) {
      formData.value = { ...defaultFormData(), ...mapBackendToFrontend(val, { zeroOneFields }) };
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
    await saveChargeCode(mapFrontendToBackend(formData.value, { zeroOneFields }));
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
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="160">
        <NFormItem :label="$t('page.maintain.chargeCode.code')" path="code">
          <NInput v-model:value="formData.code" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.chargeCode.description')">
          <NInput v-model:value="formData.description" type="textarea" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.chargeCode.localLanguageDescription')">
          <NInput v-model:value="formData.language_description" type="textarea" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.chargeCode.isActive')">
          <NSwitch v-model:value="formData.is_active" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.chargeCode.type')">
          <NInput v-model:value="formData.type" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.chargeCode.margin')">
          <NInputNumber v-model:value="formData.margin" class="w-full" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.chargeCode.tax')">
          <NInputNumber v-model:value="formData.tax" class="w-full" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.chargeCode.withholding')">
          <NInputNumber v-model:value="formData.withholding" class="w-full" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.chargeCode.calculator')">
          <NInput v-model:value="formData.calculator" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.chargeCode.printSequence')">
          <NInputNumber v-model:value="formData.print_sequence" :min="0" class="w-full" />
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
