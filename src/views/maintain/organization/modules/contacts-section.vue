<script setup lang="ts">
import { ref, h } from 'vue';
import { $t } from '@/locales';
import type { DataTableColumns } from 'naive-ui';

defineOptions({ name: 'OrganizationContactsSection' });

const props = defineProps<{
  contacts: Record<string, any>[];
  readonly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:contacts', val: Record<string, any>[]): void;
}>();

const showModal = ref(false);
const editingIndex = ref(-1);
const formData = ref<Record<string, any>>({});

function getDefaultContact() {
  return { contact_name: '', email: '', mobile: '', office_phone: '', position: '', social_media_id: '' };
}

function handleAdd() {
  editingIndex.value = -1;
  formData.value = getDefaultContact();
  showModal.value = true;
}

function handleEdit(index: number) {
  editingIndex.value = index;
  formData.value = { ...props.contacts[index] };
  showModal.value = true;
}

function handleDelete(index: number) {
  const list = [...props.contacts];
  list.splice(index, 1);
  emit('update:contacts', list);
}

function handleSave() {
  const list = [...props.contacts];
  if (editingIndex.value >= 0) {
    list[editingIndex.value] = { ...formData.value };
  } else {
    list.push({ ...formData.value });
  }
  emit('update:contacts', list);
  showModal.value = false;
}

const columns: DataTableColumns = [
  {
    key: 'index',
    title: '#',
    width: 60,
    align: 'center',
    render(_, index) {
      return index + 1;
    }
  },
  { key: 'contact_name', title: $t('page.maintain.organization.contactName'), width: 150 },
  { key: 'position', title: $t('page.maintain.organization.position'), width: 120 },
  { key: 'email', title: $t('page.maintain.organization.email'), minWidth: 180 },
  { key: 'mobile', title: $t('page.maintain.organization.mobile'), width: 130 },
  { key: 'office_phone', title: $t('page.maintain.organization.officePhone'), width: 130 },
  { key: 'social_media_id', title: $t('page.maintain.organization.socialMediaId'), width: 120 },
  {
    key: 'actions',
    title: $t('common.action'),
    width: 130,
    align: 'center',
    render(_, index) {
      return h('div', { class: 'flex gap-8px justify-center' }, [
        h('a', { class: 'text-primary cursor-pointer', onClick: () => handleEdit(index) }, $t('common.edit')),
        h('a', { class: 'text-error cursor-pointer', onClick: () => handleDelete(index) }, $t('common.delete'))
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
      :data="contacts"
      :bordered="false"
      size="small"
      :scroll-x="1100"
    />
    <NModal v-model:show="showModal" preset="dialog" :title="editingIndex >= 0 ? $t('common.edit') : $t('common.add')">
      <NForm :model="formData" label-placement="left" label-width="100">
        <NFormItem :label="$t('page.maintain.organization.contactName')">
          <NInput v-model:value="formData.contact_name" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.organization.position')">
          <NInput v-model:value="formData.position" />
        </NFormItem>
        <NFormItem :label="$t('page.maintain.organization.email')">
          <NInput v-model:value="formData.email" />
        </NFormItem>
        <NGrid :cols="2" :x-gap="12">
          <NFormItemGi :label="$t('page.maintain.organization.mobile')">
            <NInput v-model:value="formData.mobile" />
          </NFormItemGi>
          <NFormItemGi :label="$t('page.maintain.organization.officePhone')">
            <NInput v-model:value="formData.office_phone" />
          </NFormItemGi>
        </NGrid>
        <NFormItem :label="$t('page.maintain.organization.socialMediaId')">
          <NInput v-model:value="formData.social_media_id" />
        </NFormItem>
      </NForm>
      <template #action>
        <NSpace justify="end">
          <NButton @click="showModal = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSave">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
