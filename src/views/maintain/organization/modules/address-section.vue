<script setup lang="ts">
import { ref, h } from 'vue';
import { $t } from '@/locales';
import type { DataTableColumns } from 'naive-ui';

defineOptions({ name: 'OrganizationAddressSection' });

const props = defineProps<{
  addresses: Record<string, any>[];
  readonly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:addresses', val: Record<string, any>[]): void;
}>();

const showModal = ref(false);
const editingIndex = ref(-1);
const formData = ref<Record<string, any>>({});

const addressTypeOptions = [
  { label: 'OFC', value: 'OFC' },
  { label: 'WHS', value: 'WHS' },
  { label: 'BRH', value: 'BRH' }
];

function getDefaultAddress() {
  return {
    company_name: '',
    address_type: 'OFC',
    address1: '',
    address2: '',
    address3: '',
    city: '',
    post_code: '',
    state: '',
    country_code: '',
    phone: '',
    fax: '',
    email: ''
  };
}

function handleAdd() {
  editingIndex.value = -1;
  formData.value = getDefaultAddress();
  showModal.value = true;
}

function handleEdit(index: number) {
  editingIndex.value = index;
  formData.value = { ...props.addresses[index] };
  showModal.value = true;
}

function handleDelete(index: number) {
  const list = [...props.addresses];
  list.splice(index, 1);
  emit('update:addresses', list);
}

function handleSave() {
  const list = [...props.addresses];
  if (editingIndex.value >= 0) {
    list[editingIndex.value] = { ...formData.value };
  } else {
    list.push({ ...formData.value });
  }
  emit('update:addresses', list);
  showModal.value = false;
}

const columns: DataTableColumns = [
  {
    key: 'address_type',
    title: $t('page.maintain.organization.addressType'),
    width: 100,
    align: 'center'
  },
  {
    key: 'company_name',
    title: $t('page.maintain.organization.companyName'),
    width: 150
  },
  {
    key: 'address1',
    title: $t('page.maintain.organization.address1'),
    minWidth: 150
  },
  {
    key: 'country_code',
    title: $t('page.maintain.organization.country'),
    width: 80,
    align: 'center'
  },
  {
    key: 'actions',
    title: $t('common.action'),
    width: 130,
    align: 'center',
    render(_, index) {
      return h('div', { class: 'flex gap-8px justify-center' }, [
        h(
          'a',
          {
            class: 'text-primary cursor-pointer',
            onClick: () => handleEdit(index)
          },
          $t('common.edit')
        ),
        h(
          'a',
          {
            class: 'text-error cursor-pointer',
            onClick: () => handleDelete(index)
          },
          $t('common.delete')
        )
      ]);
    }
  }
];
</script>

<template>
  <div>
    <NButton v-if="!readonly" type="primary" size="small" class="mb-12px" @click="handleAdd">
      {{ $t('common.add') }}
    </NButton>
    <NDataTable
      :columns="readonly ? columns.filter(c => 'key' in c && c.key !== 'actions') : columns"
      :data="addresses"
      :bordered="false"
      size="small"
    />
    <NModal v-model:show="showModal" preset="dialog" :title="editingIndex >= 0 ? $t('common.edit') : $t('common.add')">
      <NForm :model="formData" label-placement="left" label-width="100">
        <NFormItem :label="$t('page.maintain.organization.companyName')" path="company_name">
          <NInput v-model:value="formData.company_name" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.organization.addressType')">
          <NSelect v-model:value="formData.address_type" :options="addressTypeOptions" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.organization.address1')">
          <NInput v-model:value="formData.address1" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.organization.address2')">
          <NInput v-model:value="formData.address2" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.organization.address3')">
          <NInput v-model:value="formData.address3" />
        </NFormItem>
        <NGrid :cols="2" :x-gap="12">
          <NFormItemGi :label="$t('page.maintain.organization.city')">
            <NInput v-model:value="formData.city" />
          </NFormItemGi>
          <NFormItemGi :label="$t('page.maintain.organization.postal')">
            <NInput v-model:value="formData.post_code" />
          </NFormItemGi>
          <NFormItemGi :label="$t('page.maintain.organization.state')">
            <NInput v-model:value="formData.state" />
          </NFormItemGi>
          <NFormItemGi :label="$t('page.maintain.organization.country')">
            <NInput v-model:value="formData.country_code" />
          </NFormItemGi>
          <NFormItemGi :label="$t('page.maintain.organization.phone')">
            <NInput v-model:value="formData.phone" />
          </NFormItemGi>
          <NFormItemGi :label="$t('page.maintain.organization.fax')">
            <NInput v-model:value="formData.fax" />
          </NFormItemGi>
        </NGrid>
        <NFormItem :label="$t('page.maintain.organization.email')">
          <NInput v-model:value="formData.email" />
        </NFormItem>
      </NForm>
      <template #action>
        <NSpace justify="end">
          <NButton @click="showModal = false">
            {{ $t('common.cancel') }}
          </NButton>
          <NButton type="primary" @click="handleSave">
            {{ $t('common.confirm') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
