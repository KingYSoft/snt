<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { $t } from '@/locales';
import { NForm, NGrid, NFormItemGi, NDivider, NCheckbox, NSpace, NSwitch, NInput } from 'naive-ui';

defineOptions({ name: 'OrganizationGeneralInfoForm' });

const formData = defineModel<Record<string, any>>('formData', {
  required: true
});

interface Props {
  readonly?: boolean;
  rules?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  rules: () => ({})
});

const emit = defineEmits<{
  (e: 'registerFormRefs', formRef: any): void;
}>();

const formRef = ref<any>(null);

onMounted(() => {
  if (formRef.value) {
    emit('registerFormRefs', formRef.value);
  }
});
</script>

<template>
  <NForm
    ref="formRef"
    :model="formData"
    :rules="props.rules"
    label-placement="left"
    label-width="120"
    :disabled="readonly"
  >
    <NGrid :cols="2" :x-gap="16">
      <NFormItemGi required :label="$t('page.maintain.organization.name')" path="org_full_name">
        <NInput v-model:value="formData.org_full_name" />
      </NFormItemGi>
      <NFormItemGi required :label="$t('page.maintain.organization.code')" path="org_code">
        <NInput v-model:value="formData.org_code" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.address1')">
        <NInput v-model:value="formData.address1" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.phone')">
        <NInput v-model:value="formData.phone" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.address2')">
        <NInput v-model:value="formData.address2" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.fax')">
        <NInput v-model:value="formData.fax" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.address3')">
        <NInput v-model:value="formData.address3" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.website')">
        <NInput v-model:value="formData.website" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.city')">
        <NInput v-model:value="formData.city" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.postal')">
        <NInput v-model:value="formData.post_code" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.email')">
        <NInput v-model:value="formData.email" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.state')">
        <NInput v-model:value="formData.state" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.country')">
        <NInput v-model:value="formData.country_code" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.unloco')">
        <NInput v-model:value="formData.port_code" />
      </NFormItemGi>
      <NFormItemGi :label="$t('page.maintain.organization.tin')">
        <NInput v-model:value="formData.tin" />
      </NFormItemGi>
    </NGrid>

    <NDivider>{{ $t('page.maintain.organization.types') }}</NDivider>
    <NGrid :cols="4" :x-gap="16" :y-gap="8">
      <NFormItemGi :show-label="false">
        <NCheckbox v-model:checked="formData.org_is_consignor" :checked-value="1" :unchecked-value="0">
          {{ $t('page.maintain.organization.isShipper') }}
        </NCheckbox>
      </NFormItemGi>
      <NFormItemGi :show-label="false">
        <NCheckbox v-model:checked="formData.org_is_consignee" :checked-value="1" :unchecked-value="0">
          {{ $t('page.maintain.organization.isConsignee') }}
        </NCheckbox>
      </NFormItemGi>
      <NFormItemGi :show-label="false">
        <NCheckbox v-model:checked="formData.org_is_shipping_provider" :checked-value="1" :unchecked-value="0">
          {{ $t('page.maintain.organization.isCarrier') }}
        </NCheckbox>
      </NFormItemGi>
      <NFormItemGi :show-label="false">
        <NCheckbox v-model:checked="formData.org_is_broker" :checked-value="1" :unchecked-value="0">
          {{ $t('page.maintain.organization.isBroker') }}
        </NCheckbox>
      </NFormItemGi>
      <NFormItemGi :show-label="false">
        <NCheckbox v-model:checked="formData.org_is_warehouse_client" :checked-value="1" :unchecked-value="0">
          {{ $t('page.maintain.organization.isWarehouse') }}
        </NCheckbox>
      </NFormItemGi>
      <NFormItemGi :show-label="false">
        <NCheckbox v-model:checked="formData.org_is_transport_client" :checked-value="1" :unchecked-value="0">
          {{ $t('page.maintain.organization.isTransportClient') }}
        </NCheckbox>
      </NFormItemGi>
      <NFormItemGi :show-label="false">
        <NCheckbox v-model:checked="formData.org_is_forwarder" :checked-value="1" :unchecked-value="0">
          {{ $t('page.maintain.organization.isAgent') }}
        </NCheckbox>
      </NFormItemGi>
      <NFormItemGi :show-label="false">
        <NCheckbox v-model:checked="formData.org_is_temp_account" :checked-value="1" :unchecked-value="0">
          {{ $t('page.maintain.organization.isTempAccount') }}
        </NCheckbox>
      </NFormItemGi>
    </NGrid>

    <NDivider>{{ $t('page.maintain.organization.categories') }}</NDivider>
    <NSpace>
      <NCheckbox v-model:checked="formData.org_is_payable" :checked-value="1" :unchecked-value="0">
        {{ $t('page.maintain.organization.isPayable') }}
      </NCheckbox>
      <NCheckbox v-model:checked="formData.org_is_receivable" :checked-value="1" :unchecked-value="0">
        {{ $t('page.maintain.organization.isReceivable') }}
      </NCheckbox>
    </NSpace>

    <NDivider />
    <NFormItem :label="$t('page.maintain.organization.isActive')">
      <NSwitch v-model:value="formData.org_is_active" :checked-value="1" :unchecked-value="0" />
    </NFormItem>
  </NForm>
</template>
