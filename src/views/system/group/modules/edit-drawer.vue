<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import type { DataTableColumns, FormInst, FormRules, TreeOption } from 'naive-ui';
import { NButton, NSelect } from 'naive-ui';
import { $t } from '@/locales';
import { queryUserAll, type SysUser } from '@/service/api/system/user';
import {
  getGroupDetail,
  queryCompanyBranchOptions,
  queryGroupAllPermission,
  saveGroup,
  type BranchOption,
  type CompanyOption,
  type GroupPermissionRow,
  type PermissionDto,
  type SysGroup
} from '@/service/api/system/group';

type PermRow = GroupPermissionRow & { _id: number };

const props = defineProps<{
  operateType: 'add' | 'edit';
  editingData: SysGroup | null;
}>();

const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const activeTab = ref('detail');
const userModalVisible = ref(false);
const userPickerKeys = ref<string[]>([]);

const allUsers = ref<SysUser[]>([]);
const selectedUsers = ref<SysUser[]>([]);
const companyList = ref<CompanyOption[]>([]);
const permissionTree = ref<TreeOption[]>([]);
const expandedKeys = ref<Array<string | number>>([]);
const permissionRows = ref<PermRow[]>([]);
const activePermissionRowId = ref<number | null>(null);
const activePermissionNames = ref<string[]>([]);
const editRowKey = ref<number | null>(null);
let nextRowId = 1;

const title = computed(() => {
  if (props.operateType === 'add') return 'GROUP';
  const code = String(formData.value.code || props.editingData?.code || '').trim();
  return code ? `GROUP-${code}` : $t('common.edit');
});

const defaultFormData = (): SysGroup => ({
  pk: '',
  code: '',
  description: '',
  desc: '',
  is_admin: 'N',
  is_active: 1
});

const formData = ref(defaultFormData());

const rules: FormRules = {
  code: { required: true, message: $t('form.required'), trigger: ['blur', 'input'] }
};

const allowOptions = [
  { label: 'Y', value: 'Y' },
  { label: 'N', value: 'N' }
];

function companyCodeOf(item?: CompanyOption | null) {
  return item?.company_code || item?.code || '';
}

function branchCodeOf(item?: BranchOption | null) {
  return item?.branch_code || item?.code || '';
}

function toPermissionTree(list: PermissionDto[] = []): TreeOption[] {
  const tree: TreeOption[] = [];
  for (const item of list) {
    const key = String(item.permission_name || item.name || '').trim();
    if (!key) continue;
    const children = item.children?.length ? toPermissionTree(item.children) : undefined;
    tree.push({
      key,
      label: key,
      children: children?.length ? children : undefined
    });
  }
  return tree;
}

function findCompany(row: GroupPermissionRow) {
  const code = row.company_code;
  if (code) {
    const byCode = companyList.value.find(item => companyCodeOf(item).toLowerCase() === code.toLowerCase());
    if (byCode) return byCode;
  }
  const pk = row.company_pks?.[0];
  if (!pk) return undefined;
  return companyList.value.find(item => String(item.pk) === pk || item.company_pks?.includes(pk));
}

function findBranch(row: GroupPermissionRow) {
  const company = findCompany(row);
  const branches = company?.branch_list ?? [];
  const code = row.branch_code;
  if (code) {
    const byCode = branches.find(item => branchCodeOf(item).toLowerCase() === code.toLowerCase());
    if (byCode) return byCode;
  }
  const pk = row.branch_pks?.[0];
  if (!pk) return undefined;
  return branches.find(item => String(item.pk) === pk || item.branch_pks?.includes(pk));
}

const companySelectOptions = computed(() =>
  companyList.value.map(item => ({
    label: companyCodeOf(item) || item.company_name || item.name || '',
    value: companyCodeOf(item)
  }))
);

function branchOptionsOf(row: GroupPermissionRow) {
  return (findCompany(row)?.branch_list ?? []).map(item => ({
    label: branchCodeOf(item) || item.branch_name || item.name || '',
    value: branchCodeOf(item)
  }));
}

function hydratePermissionRow(row: GroupPermissionRow, id: number): PermRow {
  const next: PermRow = {
    ...row,
    _id: id,
    is_allow: row.is_allow || 'Y',
    permission_names: [...(row.permission_names || [])]
  };
  const company = findCompany(next);
  if (company) {
    next.company_code = next.company_code || companyCodeOf(company);
    next.company_name = next.company_name || company.company_name || company.name || '';
    if (!next.company_pks?.length) {
      next.company_pks = company.company_pks?.length ? [...company.company_pks] : company.pk ? [String(company.pk)] : [];
    }
  }
  const branch = findBranch(next);
  if (branch) {
    next.branch_code = next.branch_code || branchCodeOf(branch);
    next.branch_name = next.branch_name || branch.branch_name || branch.name || '';
    if (!next.branch_pks?.length) {
      next.branch_pks = branch.branch_pks?.length ? [...branch.branch_pks] : branch.pk ? [String(branch.pk)] : [];
    }
  }
  return next;
}

const userColumns = computed<DataTableColumns<SysUser>>(() => [
  { key: 'login_name', title: $t('page.system.user.loginName'), minWidth: 140 },
  { key: 'full_name', title: $t('page.system.user.fullName'), minWidth: 140 },
  { key: 'email_address', title: $t('page.system.user.email'), minWidth: 180 },
  {
    key: 'actions',
    title: $t('common.action'),
    width: 80,
    align: 'center',
    render: row =>
      h(
        NButton,
        { size: 'tiny', type: 'error', text: true, onClick: () => removeSelectedUser(String(row.pk ?? '')) },
        { default: () => $t('common.delete') }
      )
  }
]);

const pickerColumns = computed<DataTableColumns<SysUser>>(() => [
  { type: 'selection' },
  { key: 'login_name', title: $t('page.system.user.loginName'), minWidth: 140 },
  { key: 'full_name', title: $t('page.system.user.fullName'), minWidth: 140 },
  { key: 'email_address', title: $t('page.system.user.email'), minWidth: 180 }
]);

function stopRowClick(event?: MouseEvent) {
  event?.stopPropagation();
}

function renderCellSelect(
  value: string | null | undefined,
  options: Array<{ label: string; value: string }>,
  placeholder: string,
  disabled: boolean,
  onUpdate: (val: string | null) => void
) {
  return h(NSelect, {
    value: value || null,
    options,
    size: 'small',
    filterable: true,
    clearable: true,
    disabled,
    consistentMenuWidth: false,
    placeholder,
    onClick: stopRowClick,
    onUpdateValue: onUpdate
  });
}

const checkedPermissionKeys = computed(() =>
  activePermissionRowId.value != null ? [activePermissionRowId.value] : []
);

const permissionColumns = computed<DataTableColumns<PermRow>>(() => [
  { type: 'selection', multiple: false, width: 36 },
  { key: '_id', title: '#', width: 48, align: 'center' },
  {
    key: 'company_pk',
    title: $t('page.system.group.company'),
    width: 90,
    ellipsis: { tooltip: true },
    render: row =>
      editRowKey.value === row._id
        ? renderCellSelect(
            row.company_code,
            companySelectOptions.value,
            $t('page.system.group.company'),
            false,
            val => onCompanyChange(row, val)
          )
        : row.company_code || ''
  },
  {
    key: 'branch_pk',
    title: $t('page.system.group.branch'),
    width: 90,
    ellipsis: { tooltip: true },
    render: row =>
      editRowKey.value === row._id
        ? renderCellSelect(
            row.branch_code,
            branchOptionsOf(row),
            $t('page.system.group.branch'),
            !row.company_code,
            val => onBranchChange(row, val)
          )
        : row.branch_code || ''
  },
  {
    key: 'is_allow',
    title: $t('page.system.group.allow'),
    width: 70,
    align: 'center',
    render: row =>
      editRowKey.value === row._id
        ? h(NSelect, {
            value: row.is_allow || 'Y',
            options: allowOptions,
            size: 'small',
            onClick: stopRowClick,
            onUpdateValue: (val: string) => {
              row.is_allow = val || 'Y';
            }
          })
        : row.is_allow || 'Y'
  },
  {
    key: 'actions',
    title: $t('common.action'),
    width: 110,
    align: 'center',
    render: row =>
      h('div', { class: 'flex-center gap-8px', onClick: stopRowClick }, [
        h(
          NButton,
          {
            size: 'tiny',
            type: 'primary',
            text: true,
            onClick: () => toggleEditRow(row)
          },
          { default: () => $t('common.modify') }
        ),
        h(
          NButton,
          { size: 'tiny', type: 'error', text: true, onClick: () => onOpenRemove(row) },
          { default: () => $t('common.delete') }
        )
      ])
  }
]);

function removeSelectedUser(pk: string) {
  selectedUsers.value = selectedUsers.value.filter(item => item.pk !== pk);
}

function openUserDialog() {
  userPickerKeys.value = selectedUsers.value.map(item => String(item.pk ?? '')).filter(Boolean);
  userModalVisible.value = true;
}

function applyUserSelection() {
  const keySet = new Set(userPickerKeys.value.map(String));
  selectedUsers.value = allUsers.value.filter(item => keySet.has(String(item.pk ?? '')));
  userModalVisible.value = false;
}

function selectPermissionRow(row: PermRow | null) {
  if (!row) {
    activePermissionRowId.value = null;
    activePermissionNames.value = [];
    return;
  }
  activePermissionRowId.value = row._id;
  activePermissionNames.value = [...(row.permission_names || [])];
}

function onCheckPermissionRow(keys: Array<string | number>) {
  const id = Number(keys[keys.length - 1]);
  const row = permissionRows.value.find(item => item._id === id) ?? null;
  selectPermissionRow(row);
}

function permissionRowClassName(row: PermRow) {
  return row._id === activePermissionRowId.value ? 'permission-row--active' : '';
}

function permissionRowProps(row: PermRow) {
  return {
    style: 'cursor: pointer',
    onClick: () => selectPermissionRow(row)
  };
}

function addPermissionRow() {
  const row: PermRow = {
    _id: nextRowId++,
    company_pks: [],
    company_code: '',
    branch_pks: [],
    branch_code: '',
    is_allow: 'Y',
    permission_names: []
  };
  permissionRows.value.push(row);
  editRowKey.value = row._id;
  selectPermissionRow(row);
}

function toggleEditRow(row: PermRow) {
  selectPermissionRow(row);
  editRowKey.value = editRowKey.value === row._id ? null : row._id;
}

function removePermissionRow(id: number) {
  permissionRows.value = permissionRows.value.filter(row => row._id !== id);
  if (editRowKey.value === id) editRowKey.value = null;
  if (activePermissionRowId.value === id) {
    selectPermissionRow(permissionRows.value[0] ?? null);
  }
}

function onOpenRemove(row: PermRow) {
  window.$dialog?.warning({
    title: $t('page.system.group.removeRowTitle').replace('{0}', String(row._id)),
    content: $t('page.system.group.removeRowConfirm'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => removePermissionRow(row._id)
  });
}

function onCompanyChange(row: PermRow, code: string | null) {
  const company = companyList.value.find(item => companyCodeOf(item) === code);
  row.company_code = company ? companyCodeOf(company) : '';
  row.company_name = company?.company_name || company?.name || '';
  row.company_pks = company?.company_pks?.length
    ? [...company.company_pks]
    : company?.pk
      ? [String(company.pk)]
      : [];
  row.branch_pks = [];
  row.branch_code = '';
  row.branch_name = '';
}

function onBranchChange(row: PermRow, code: string | null) {
  const branch = (findCompany(row)?.branch_list ?? []).find(item => branchCodeOf(item) === code);
  row.branch_code = branch ? branchCodeOf(branch) : '';
  row.branch_name = branch?.branch_name || branch?.name || '';
  row.branch_pks = branch?.branch_pks?.length
    ? [...branch.branch_pks]
    : branch?.pk
      ? [String(branch.pk)]
      : [];
}

function onTreeChecked(keys: Array<string | number>) {
  const names = keys.map(String);
  activePermissionNames.value = names;
  const row = permissionRows.value.find(item => item._id === activePermissionRowId.value);
  if (row) row.permission_names = names;
}

async function loadBaseOptions() {
  const [userRes, permRes, orgRes] = await Promise.all([
    queryUserAll(),
    queryGroupAllPermission(),
    queryCompanyBranchOptions()
  ]);
  allUsers.value = userRes.data?.list ?? [];
  permissionTree.value = toPermissionTree(permRes.data?.list ?? []);
  expandedKeys.value = permissionTree.value[0]?.key != null ? [permissionTree.value[0].key] : [];
  companyList.value = orgRes.data?.company_list ?? [];
}

async function fillForm() {
  formData.value = defaultFormData();
  selectedUsers.value = [];
  permissionRows.value = [];
  nextRowId = 1;
  activeTab.value = 'detail';
  editRowKey.value = null;
  selectPermissionRow(null);
  if (props.operateType !== 'edit') return;
  const pk = String(props.editingData?.pk ?? '').trim();
  if (!pk) {
    formData.value = { ...defaultFormData(), ...(props.editingData ?? {}) };
    return;
  }
  try {
    const { data } = await getGroupDetail(pk);
    formData.value = { ...defaultFormData(), ...(data?.group_detail ?? props.editingData ?? {}) };
    selectedUsers.value = data?.users ?? [];
    const rows = data?.permission_rows ?? [];
    permissionRows.value = rows.map((row, index) => {
      const rawId = Number((row as GroupPermissionRow & { id?: number }).id || 0);
      return hydratePermissionRow(row, rawId || index + 1);
    });
    nextRowId = Math.max(0, ...permissionRows.value.map(row => row._id)) + 1;
    selectPermissionRow(permissionRows.value[0] ?? null);
  } catch {
    formData.value = { ...defaultFormData(), ...(props.editingData ?? {}) };
  }
}

watch(visible, async show => {
  if (!show) return;
  loading.value = true;
  try {
    await loadBaseOptions();
    await fillForm();
  } finally {
    loading.value = false;
  }
});

async function handleSubmit() {
  await formRef.value?.validate();
  loading.value = true;
  try {
    const groupDetail = {
      ...formData.value,
      desc: formData.value.desc || formData.value.description,
      description: formData.value.description || formData.value.desc
    };
    await saveGroup({
      group_detail: groupDetail,
      pk: groupDetail.pk,
      code: groupDetail.code,
      description: groupDetail.description,
      desc: groupDetail.desc,
      is_admin: groupDetail.is_admin,
      is_active: groupDetail.is_active,
      selected_user_pks: selectedUsers.value.map(item => String(item.pk ?? '')).filter(Boolean),
      permission_rows: permissionRows.value.map(row => ({
        company_pks: row.company_pks ?? [],
        company_code: row.company_code,
        company_name: row.company_name,
        branch_pks: row.branch_pks ?? [],
        branch_code: row.branch_code,
        branch_name: row.branch_name,
        is_allow: row.is_allow || 'Y',
        permission_names: [...new Set(row.permission_names || [])]
      }))
    });
    window.$message?.success($t('common.saveSuccess'));
    visible.value = false;
    emit('submitted');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="title"
    :mask-closable="false"
    :auto-focus="false"
    style="width: 1180px"
    content-style="max-height: 78vh; overflow: auto;"
  >
    <NSpin :show="loading">
      <NTabs v-model:value="activeTab" type="line">
        <NTabPane name="detail" :tab="$t('page.system.group.detail')">
          <NForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-placement="left"
            label-width="120"
            require-mark-placement="left"
            :show-feedback="false"
            class="pt-12px"
          >
            <NGrid :cols="2" :x-gap="16" :y-gap="12">
              <NFormItemGi :label="$t('page.system.group.code')" path="code">
                <NInput v-model:value="formData.code" :disabled="operateType === 'edit'" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.group.status')">
                <NSwitch v-model:value="formData.is_active" :checked-value="1" :unchecked-value="0" />
              </NFormItemGi>
              <NFormItemGi :span="2" :label="$t('page.system.group.description')">
                <NInput v-model:value="formData.desc" type="textarea" :rows="4" />
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NTabPane>

        <NTabPane name="users" :tab="$t('page.system.group.users')">
          <NSpace vertical :size="12">
            <NButton type="primary" size="small" @click="openUserDialog">
              {{ $t('page.system.group.selectUsers') }}
            </NButton>
            <NDataTable
              :columns="userColumns"
              :data="selectedUsers"
              :row-key="(row: SysUser) => String(row.pk ?? '')"
              :pagination="false"
              size="small"
            />
          </NSpace>
        </NTabPane>

        <NTabPane name="permission" :tab="$t('page.system.group.permission')">
          <NGrid :cols="2" :x-gap="16">
            <NGi>
              <NSpace vertical :size="12">
                <NButton type="primary" size="small" @click="addPermissionRow">
                  {{ $t('page.system.group.addRow') }}
                </NButton>
                <NDataTable
                  :checked-row-keys="checkedPermissionKeys"
                  :columns="permissionColumns"
                  :data="permissionRows"
                  :max-height="420"
                  :pagination="false"
                  :row-class-name="permissionRowClassName"
                  :row-key="(row: PermRow) => row._id"
                  :row-props="permissionRowProps"
                  size="small"
                  @update:checked-row-keys="onCheckPermissionRow"
                />
              </NSpace>
            </NGi>
            <NGi>
              <NDivider class="!mt-0 !mb-12px">
                <span class="text-12px uppercase opacity-70">{{ $t('page.system.group.permissions') }}</span>
              </NDivider>
              <div class="h-420px overflow-auto">
                <NTree
                  block-line
                  cascade
                  checkable
                  check-strategy="all"
                  :checked-keys="activePermissionNames"
                  :data="permissionTree"
                  :disabled="activePermissionRowId == null"
                  :expanded-keys="expandedKeys"
                  :selectable="false"
                  @update:checked-keys="onTreeChecked"
                  @update:expanded-keys="keys => (expandedKeys = keys)"
                />
              </div>
            </NGi>
          </NGrid>
        </NTabPane>
      </NTabs>
    </NSpin>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="loading" @click="handleSubmit">{{ $t('common.save') }}</NButton>
      </NSpace>
    </template>
  </NModal>

  <NModal v-model:show="userModalVisible" preset="card" :title="$t('page.system.group.selectUsers')" style="width: 720px">
    <NDataTable
      v-model:checked-row-keys="userPickerKeys"
      :columns="pickerColumns"
      :data="allUsers"
      :row-key="(row: SysUser) => String(row.pk ?? '')"
      :max-height="420"
      size="small"
    />
    <template #footer>
      <NSpace justify="end">
        <NButton @click="userModalVisible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="applyUserSelection">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.permission-row--active :deep(td) {
  background-color: var(--n-merged-color-table-color-hover, #f3f3f5);
}
</style>
