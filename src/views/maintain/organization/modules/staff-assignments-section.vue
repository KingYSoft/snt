<script setup lang="ts">
import { computed, h, ref } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { $t } from '@/locales';

defineOptions({ name: 'OrganizationStaffAssignmentsSection' });

const staffAssignments = defineModel<Record<string, any>[]>('staffAssignments', {
  required: true
});

interface Props {
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
});

const showModal = ref(false);
const editingIndex = ref(-1);
const formData = ref<Record<string, any>>({});

function getDefaultAssignment() {
  return {
    assigned_person: '',
    role: '',
    role_description: '',
    company: '',
    branch: ''
  };
}

function handleAdd() {
  editingIndex.value = -1;
  formData.value = getDefaultAssignment();
  showModal.value = true;
}

function handleEdit(index: number) {
  editingIndex.value = index;
  formData.value = { ...staffAssignments.value[index] };
  showModal.value = true;
}

function handleDelete(index: number) {
  const list = [...staffAssignments.value];
  list.splice(index, 1);
  staffAssignments.value = list;
}

function handleSave() {
  const list = [...staffAssignments.value];
  if (editingIndex.value >= 0) {
    list[editingIndex.value] = { ...formData.value };
  } else {
    list.push({ ...formData.value });
  }
  staffAssignments.value = list;
  showModal.value = false;
}

const columns = computed<DataTableColumns<Record<string, any>>>(() => {
  const base: DataTableColumns<Record<string, any>> = [
    {
      key: 'index',
      title: '#',
      width: 60,
      align: 'center',
      render: (_, index) => index + 1
    },
    {
      key: 'assigned_person',
      title: 'Assigned Person',
      minWidth: 160
    },
    {
      key: 'role',
      title: 'Role',
      minWidth: 140
    },
    {
      key: 'role_description',
      title: 'Role Description',
      minWidth: 180
    },
    {
      key: 'company',
      title: 'Company',
      minWidth: 140
    },
    {
      key: 'branch',
      title: 'Branch',
      minWidth: 140
    }
  ];

  if (props.readonly) {
    return base;
  }

  return [
    ...base,
    {
      key: 'actions',
      title: $t('common.action'),
      width: 130,
      align: 'center',
      render: (_, index) =>
        h('div', { class: 'flex gap-8px justify-center' }, [
          h('a', { class: 'text-primary cursor-pointer', onClick: () => handleEdit(index) }, $t('common.edit')),
          h('a', { class: 'text-error cursor-pointer', onClick: () => handleDelete(index) }, $t('common.delete'))
        ])
    }
  ];
});
</script>

<template>
  <div>
    <NButton v-if="!props.readonly" type="primary" size="small" class="mb-12px" @click="handleAdd">
      {{ $t('common.add') }}
    </NButton>
    <NDataTable :columns="columns" :data="staffAssignments" :bordered="false" size="small" :scroll-x="1000" />

    <NModal v-model:show="showModal" preset="dialog" :title="editingIndex >= 0 ? $t('common.edit') : $t('common.add')">
      <NForm :model="formData" label-placement="left" label-width="120">
        <NFormItem label="Assigned Person">
          <NInput v-model:value="formData.assigned_person" />
        </NFormItem>
        <NFormItem label="Role">
          <NInput v-model:value="formData.role" />
        </NFormItem>
        <NFormItem label="Role Description">
          <NInput v-model:value="formData.role_description" />
        </NFormItem>
        <NGrid :cols="2" :x-gap="12">
          <NFormItemGi label="Company">
            <NInput v-model:value="formData.company" />
          </NFormItemGi>
          <NFormItemGi label="Branch">
            <NInput v-model:value="formData.branch" />
          </NFormItemGi>
        </NGrid>
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
