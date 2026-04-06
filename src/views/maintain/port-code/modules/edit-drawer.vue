<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { $t } from '@/locales';
import { savePortCode } from '@/service/api/maintain/port-code';
import { mapFrontendToBackend, mapBackendToFrontend } from '@/utils/maintain/field-mapper';

const props = defineProps<{ operateType: 'add' | 'edit'; editingData: Record<string, any> | null }>();
const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const title = computed(() => (props.operateType === 'add' ? $t('common.add') : $t('common.edit')));

const zeroOneFields = ['rl_has_airport', 'rl_has_seaport', 'rl_has_rail', 'rl_has_terminal'];

const defaultFormData = () => ({
  id: 0,
  rl_code: '',
  rl_port_name: '',
  rl_iata: '',
  rl_country_code: '',
  rl_has_airport: false,
  rl_has_seaport: false,
  rl_has_rail: false,
  rl_has_terminal: false
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
  rl_code: { required: true, message: $t('form.required') }
};

async function handleSubmit() {
  await formRef.value?.validate();
  loading.value = true;
  try {
    await savePortCode(mapFrontendToBackend(formData.value, { zeroOneFields }));
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
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="140">
        <NFormItem :label="$t('page.maintain.portCode.rlCode')" path="rl_code">
          <NInput v-model:value="formData.rl_code" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.portCode.rlPortName')">
          <NInput v-model:value="formData.rl_port_name" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.portCode.rlIata')">
          <NInput v-model:value="formData.rl_iata" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.portCode.rlCountryCode')">
          <NInput v-model:value="formData.rl_country_code" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.portCode.rlHasAirport')">
          <NSwitch v-model:value="formData.rl_has_airport" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.portCode.rlHasSeaport')">
          <NSwitch v-model:value="formData.rl_has_seaport" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.portCode.rlHasRail')">
          <NSwitch v-model:value="formData.rl_has_rail" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.portCode.rlHasTerminal')">
          <NSwitch v-model:value="formData.rl_has_terminal" />
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
