<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { $t } from '@/locales';
import { saveContainerType } from '@/service/api/maintain/containers';
import { mapFrontendToBackend, mapBackendToFrontend } from '@/utils/maintain/field-mapper';

const props = defineProps<{ operateType: 'add' | 'edit'; editingData: Record<string, any> | null }>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const title = computed(() => (props.operateType === 'add' ? $t('common.add') : $t('common.edit')));

const booleanFields = ['iso'];
const zeroOneFields = ['is_active'];

const defaultFormData = () => ({
  id: 0,
  code: '',
  description: '',
  mode: '',
  container_type: '',
  iata_class: '',
  teu: null as number | null,
  height: null as number | null,
  length: null as number | null,
  width: null as number | null,
  gross_weight: null as number | null,
  tare_weight: null as number | null,
  capacity_m3: null as number | null,
  iso: false,
  iso_type: '',
  iso_size: '',
  iso_description: '',
  is_active: true
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
    await saveContainerType(mapFrontendToBackend(formData.value, { booleanFields, zeroOneFields }));
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
        <NFormItem :label="$t('page.maintain.containers.code')" path="code">
          <NInput v-model:value="formData.code" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.containers.description')">
          <NInput v-model:value="formData.description" type="textarea" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.containers.mode')">
          <NInput v-model:value="formData.mode" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.containers.containerType')">
          <NInput v-model:value="formData.container_type" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.containers.iataClass')">
          <NInput v-model:value="formData.iata_class" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.containers.teu')">
          <NInputNumber v-model:value="formData.teu" :min="0" class="w-full" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.containers.height')">
          <NInputNumber v-model:value="formData.height" :min="0" class="w-full" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.containers.length')">
          <NInputNumber v-model:value="formData.length" :min="0" class="w-full" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.containers.width')">
          <NInputNumber v-model:value="formData.width" :min="0" class="w-full" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.containers.grossWeight')">
          <NInputNumber v-model:value="formData.gross_weight" :min="0" class="w-full" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.containers.tareWeight')">
          <NInputNumber v-model:value="formData.tare_weight" :min="0" class="w-full" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.containers.capacityM3')">
          <NInputNumber v-model:value="formData.capacity_m3" :min="0" class="w-full" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.containers.iso')">
          <NSwitch v-model:value="formData.iso" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.containers.isoType')">
          <NInput v-model:value="formData.iso_type" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.containers.isoSize')">
          <NInput v-model:value="formData.iso_size" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.containers.isoDescription')">
          <NInput v-model:value="formData.iso_description" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.containers.isActive')">
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
