<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';
import { NButton, NInput } from 'naive-ui';
import { $t } from '@/locales';
import {
  getUserDetail,
  saveUser,
  type SysUser,
  type SysUserGroupRow,
  type SysUserOwnerGroupRow
} from '@/service/api/system/user';
import { queryBranchPage } from '@/service/api/system/branch';

const props = defineProps<{
  operateType: 'add' | 'edit';
  editingData: SysUser | null;
}>();

const emit = defineEmits<{ (e: 'submitted'): void }>();
const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const activeTab = ref('detail');
const branchOptions = ref<Array<{ label: string; value: string; code: string }>>([]);
const memberGroups = ref<SysUserGroupRow[]>([]);
const ownerGroups = ref<SysUserOwnerGroupRow[]>([]);
let nextGroupId = 1;

const title = computed(() => {
  if (props.operateType === 'add') return 'USER';
  const loginName = String(formData.value.login_name || props.editingData?.login_name || '').trim();
  return loginName ? `USER-${loginName}` : $t('common.edit');
});

const defaultFormData = (): SysUser => ({
  pk: '',
  code: '',
  login_name: '',
  password: '',
  password_hash: '',
  full_name: '',
  email_address: '',
  work_phone: '',
  mobile_phone: '',
  home_branch: null as any,
  home_department: '',
  country_code: '',
  baiwang_digital_account: '',
  short_code: '',
  last_logon_date: '',
  fax: '',
  current_status: '',
  current_task: '',
  is_active: 1,
  is_valid: 1,
  can_login: 1
});

const formData = ref(defaultFormData());

const rules = computed<FormRules>(() => ({
  login_name: { required: true, message: $t('form.required'), trigger: ['blur', 'input'] },
  password:
    props.operateType === 'add'
      ? { required: true, message: $t('form.required'), trigger: ['blur', 'input'] }
      : { required: false }
}));

function resolveHomeBranch(value: string | null | undefined) {
  if (!value) return null;
  const raw = String(value);
  const byValue = branchOptions.value.find(item => item.value === raw);
  if (byValue) return byValue.value;
  const byCode = branchOptions.value.find(item => item.code === raw);
  return byCode?.value ?? raw;
}

function normalizeUser(data: Partial<SysUser> = {}): SysUser {
  const next = { ...defaultFormData(), ...data };
  next.last_logon_date = data.last_logon_date || data.last_login_date || '';
  next.password = '';
  next.password_hash = '';
  next.home_branch = resolveHomeBranch(data.home_branch) as any;
  return next;
}

async function loadBranches() {
  try {
    const { data } = await queryBranchPage({ skipCount: 0, maxResultCount: 9999, filters: [] });
    branchOptions.value = (data?.items ?? [])
      .map(item => ({
        label: String(item.code || ''),
        value: String(item.pk ?? ''),
        code: String(item.code || '')
      }))
      .filter(item => item.value)
      .sort((a, b) => a.code.localeCompare(b.code, 'en', { sensitivity: 'base' }));
  } catch {
    branchOptions.value = [];
  }
}

async function fillForm() {
  formData.value = defaultFormData();
  memberGroups.value = [];
  ownerGroups.value = [];
  nextGroupId = 1;
  activeTab.value = 'detail';
  if (props.operateType !== 'edit') return;
  const pk = String(props.editingData?.pk ?? '').trim();
  if (!pk) {
    formData.value = normalizeUser(props.editingData ?? {});
    return;
  }
  try {
    const { data } = await getUserDetail(pk);
    const source = (data ?? props.editingData ?? {}) as SysUser & {
      groups?: SysUserGroupRow[];
      ownerGroups?: SysUserOwnerGroupRow[];
      owner_groups?: SysUserOwnerGroupRow[];
    };
    formData.value = normalizeUser(source);
    memberGroups.value = (source.groups ?? []).map(row => ({ ...row, id: row.id ?? nextGroupId++ }));
    ownerGroups.value = (source.ownerGroups ?? source.owner_groups ?? []).map(row => ({
      ...row,
      id: row.id ?? nextGroupId++
    }));
  } catch {
    formData.value = normalizeUser(props.editingData ?? {});
  }
}

watch(visible, async show => {
  if (!show) return;
  loading.value = true;
  try {
    await loadBranches();
    await fillForm();
  } finally {
    loading.value = false;
  }
});

function addMemberGroup() {
  memberGroups.value.push({
    id: Date.now() + nextGroupId++,
    group_code: '',
    group_description: '',
    domain_name: '',
    type: ''
  });
}

function removeMemberGroup(id: number | string | undefined) {
  memberGroups.value = memberGroups.value.filter(item => item.id !== id);
}

function addOwnerGroup() {
  ownerGroups.value.push({
    id: Date.now() + nextGroupId++,
    group_code: '',
    group_description: '',
    domain_name: '',
    parent_code: '',
    parent_type: ''
  });
}

function removeOwnerGroup(id: number | string | undefined) {
  ownerGroups.value = ownerGroups.value.filter(item => item.id !== id);
}

function renderTextCell(row: Record<string, any>, key: string) {
  return h(NInput, {
    value: row[key] ?? '',
    size: 'small',
    onUpdateValue: (val: string) => {
      row[key] = val;
    }
  });
}

const memberGroupColumns = computed<DataTableColumns<SysUserGroupRow>>(() => [
  {
    key: 'actions',
    title: () =>
      h(
        NButton,
        { size: 'tiny', type: 'primary', text: true, onClick: addMemberGroup },
        { default: () => $t('common.add') }
      ),
    width: 70,
    align: 'center',
    render: row =>
      h(
        NButton,
        { size: 'tiny', type: 'error', text: true, onClick: () => removeMemberGroup(row.id) },
        { default: () => $t('common.delete') }
      )
  },
  {
    key: 'group_code',
    title: $t('page.system.user.groupCode'),
    minWidth: 140,
    render: row => renderTextCell(row, 'group_code')
  },
  {
    key: 'group_description',
    title: $t('page.system.user.groupDescription'),
    minWidth: 180,
    render: row => renderTextCell(row, 'group_description')
  },
  {
    key: 'domain_name',
    title: $t('page.system.user.domainName'),
    minWidth: 140,
    render: row => renderTextCell(row, 'domain_name')
  },
  {
    key: 'type',
    title: $t('page.system.user.type'),
    minWidth: 120,
    render: row => renderTextCell(row, 'type')
  }
]);

const ownerGroupColumns = computed<DataTableColumns<SysUserOwnerGroupRow>>(() => [
  {
    key: 'actions',
    title: () =>
      h(
        NButton,
        { size: 'tiny', type: 'primary', text: true, onClick: addOwnerGroup },
        { default: () => $t('common.add') }
      ),
    width: 70,
    align: 'center',
    render: row =>
      h(
        NButton,
        { size: 'tiny', type: 'error', text: true, onClick: () => removeOwnerGroup(row.id) },
        { default: () => $t('common.delete') }
      )
  },
  {
    key: 'group_code',
    title: $t('page.system.user.groupCode'),
    minWidth: 140,
    render: row => renderTextCell(row, 'group_code')
  },
  {
    key: 'group_description',
    title: $t('page.system.user.groupDescription'),
    minWidth: 180,
    render: row => renderTextCell(row, 'group_description')
  },
  {
    key: 'domain_name',
    title: $t('page.system.user.domainName'),
    minWidth: 140,
    render: row => renderTextCell(row, 'domain_name')
  },
  {
    key: 'parent_code',
    title: $t('page.system.user.parentCode'),
    minWidth: 140,
    render: row => renderTextCell(row, 'parent_code')
  },
  {
    key: 'parent_type',
    title: $t('page.system.user.parentType'),
    minWidth: 140,
    render: row => renderTextCell(row, 'parent_type')
  }
]);

async function handleSubmit() {
  await formRef.value?.validate();
  loading.value = true;
  try {
    const payload: SysUser = {
      ...formData.value,
      groups: memberGroups.value,
      ownerGroups: ownerGroups.value
    };
    const password = String(payload.password || payload.password_hash || '').trim();
    if (props.operateType === 'add') {
      payload.password = password;
      payload.password_hash = password;
    } else {
      delete payload.password;
      delete payload.password_hash;
    }
    await saveUser(payload);
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
    style="width: 960px"
    content-style="max-height: 76vh; overflow: auto;"
  >
    <NSpin :show="loading">
      <NTabs v-model:value="activeTab" type="line">
        <NTabPane name="detail" :tab="$t('page.system.user.detail')">
          <NForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-placement="left"
            label-width="160"
            require-mark-placement="left"
            :show-feedback="false"
            class="pt-8px"
          >
            <NDivider class="!mt-4px !mb-12px">
              <span class="text-12px uppercase opacity-70">{{ $t('page.system.user.sectionLoginInfo') }}</span>
            </NDivider>
            <NGrid :cols="2" :x-gap="16" :y-gap="12">
              <NFormItemGi :label="$t('page.system.user.loginName')" path="login_name">
                <NInput v-model:value="formData.login_name" :disabled="operateType === 'edit'" />
              </NFormItemGi>
              <NFormItemGi v-if="operateType === 'add'" :label="$t('page.system.user.password')" path="password">
                <NInput v-model:value="formData.password" type="password" show-password-on="click" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.user.homeBranch')">
                <NSelect
                  v-model:value="formData.home_branch"
                  :options="branchOptions"
                  clearable
                  filterable
                  :placeholder="$t('common.pleaseSelect')"
                />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.user.baiwangDigitalAccount')">
                <NInput v-model:value="formData.baiwang_digital_account" />
              </NFormItemGi>
            </NGrid>

            <NDivider class="!mt-16px !mb-12px">
              <span class="text-12px uppercase opacity-70">{{ $t('page.system.user.sectionEmployeeDetails') }}</span>
            </NDivider>
            <NGrid :cols="2" :x-gap="16" :y-gap="12">
              <NFormItemGi :label="$t('page.system.user.fullName')">
                <NInput v-model:value="formData.full_name" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.user.shortCode')">
                <NInput v-model:value="formData.short_code" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.user.email')">
                <NInput v-model:value="formData.email_address" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.user.mobilePhone')">
                <NInput v-model:value="formData.mobile_phone" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.user.canLogin')">
                <NSwitch v-model:value="formData.can_login" :checked-value="1" :unchecked-value="0" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.user.lastLogonDate')">
                <NInput :value="formData.last_logon_date" readonly />
              </NFormItemGi>
            </NGrid>

            <NDivider class="!mt-16px !mb-12px">
              <span class="text-12px uppercase opacity-70">{{ $t('page.system.user.sectionContactNumbers') }}</span>
            </NDivider>
            <NGrid :cols="2" :x-gap="16" :y-gap="12">
              <NFormItemGi :label="$t('page.system.user.workPhone')">
                <NInput v-model:value="formData.work_phone" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.user.fax')">
                <NInput v-model:value="formData.fax" />
              </NFormItemGi>
            </NGrid>

            <NDivider class="!mt-16px !mb-12px">
              <span class="text-12px uppercase opacity-70">{{ $t('page.system.user.sectionEmployeeStatus') }}</span>
            </NDivider>
            <NGrid :cols="2" :x-gap="16" :y-gap="12">
              <NFormItemGi :label="$t('page.system.user.currentStatus')">
                <NInput v-model:value="formData.current_status" />
              </NFormItemGi>
              <NFormItemGi :label="$t('page.system.user.currentOnTask')">
                <NInput v-model:value="formData.current_task" />
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NTabPane>

        <NTabPane name="group" :tab="$t('page.system.user.group')">
          <NSpace vertical :size="16">
            <div>
              <div class="mb-8px text-14px font-medium">{{ $t('page.system.user.memberGroups') }}</div>
              <NDataTable
                :columns="memberGroupColumns"
                :data="memberGroups"
                :row-key="(row: SysUserGroupRow) => String(row.id ?? '')"
                :pagination="false"
                size="small"
              />
            </div>
            <div>
              <div class="mb-8px text-14px font-medium">{{ $t('page.system.user.ownerGroups') }}</div>
              <NDataTable
                :columns="ownerGroupColumns"
                :data="ownerGroups"
                :row-key="(row: SysUserOwnerGroupRow) => String(row.id ?? '')"
                :pagination="false"
                size="small"
              />
            </div>
          </NSpace>
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
</template>
