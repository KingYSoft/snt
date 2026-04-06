<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { $t } from '@/locales';
import { saveAirline } from '@/service/api/maintain/airlines';
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

const fieldMap: Record<string, string> = {
  airline_name_1: 'airline_name1',
  airline_name_2: 'airline_name2',
  three_letter_code: 'three_char',
  two_char_code: 'two_character_code',
  airline_numeric_code: 'numeric_code',
  airline_country_region: 'airline_country',
  address_line_1: 'address_line1',
  address_line_2: 'address_line2'
};

const booleanFields = ['cass_controlled'];
const zeroOneFields = ['is_active'];

const defaultFormData = () => ({
  id: 0,
  airline_numeric_code: '',
  three_letter_code: '',
  two_char_code: '',
  airline_name_1: '',
  airline_name_2: '',
  airline_city: '',
  airline_state: '',
  postcode: '',
  airline_country_region: '',
  cass_controlled: false,
  is_active: 1
});
const formData = ref(defaultFormData());

watch(
  () => props.editingData,
  val => {
    if (val) {
      formData.value = {
        ...defaultFormData(),
        ...mapBackendToFrontend(val, { fieldMap, booleanFields, zeroOneFields })
      };
    } else {
      formData.value = defaultFormData();
    }
  },
  { immediate: true }
);

const rules: FormRules = {
  airline_numeric_code: { required: true, message: $t('form.required') },
  three_letter_code: { required: true, message: $t('form.required') }
};

async function handleSubmit() {
  await formRef.value?.validate();
  loading.value = true;
  try {
    await saveAirline(mapFrontendToBackend(formData.value, { fieldMap, booleanFields, zeroOneFields }));
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
        <NFormItem :label="$t('page.maintain.airlines.airlineNumericCode')" path="airline_numeric_code">
          <NInput v-model:value="formData.airline_numeric_code" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.airlines.threeLetterCode')" path="three_letter_code">
          <NInput v-model:value="formData.three_letter_code" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.airlines.twoCharCode')">
          <NInput v-model:value="formData.two_char_code" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.airlines.airlineName1')">
          <NInput v-model:value="formData.airline_name_1" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.airlines.airlineName2')">
          <NInput v-model:value="formData.airline_name_2" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.airlines.airlineCity')">
          <NInput v-model:value="formData.airline_city" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.airlines.airlineState')">
          <NInput v-model:value="formData.airline_state" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.airlines.postcode')">
          <NInput v-model:value="formData.postcode" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.airlines.airlineCountryRegion')">
          <NInput v-model:value="formData.airline_country_region" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.airlines.cassControlled')">
          <NSwitch v-model:value="formData.cass_controlled" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.airlines.isActive')">
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
