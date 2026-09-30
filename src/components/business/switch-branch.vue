<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { NButton, NForm, NFormItemGi, NGrid, NModal, NSelect, NSpace, NSpin } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';
import { $t } from '@/locales';
import { switchBranch } from '@/service/api/user';
import { queryCompanyBranchDeptOptions, type BranchOption as ApiBranch, type CompanyOption as ApiCompany, type DeptOption as ApiDept } from '@/service/api/system/group';
import { localStg } from '@/utils/storage';

defineOptions({
  name: 'SwitchBranch'
});

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

const appStore = useAppStore();

const diaVis = computed({
  get: () => props.show,
  set: val => emit('update:show', val)
});

const loading = ref(false);
const selectCompanyPK = ref<string | null>(null);
const selectBranchPK = ref<string | null>(null);
const selectDeptPK = ref<string | null>(null);

interface DeptOption extends SelectOption {
  dept_name: string;
  dept_pks: string[];
}

interface BranchOption extends SelectOption {
  branch_name: string;
  dept_list: DeptOption[];
}

interface CompanyOption extends SelectOption {
  company_name: string;
  branch_list: BranchOption[];
}

const companyItems = ref<CompanyOption[]>([]);
const branchItems = ref<BranchOption[]>([]);
const deptItems = ref<DeptOption[]>([]);

function mapDept(item: ApiDept): DeptOption {
  const pk = String(item.pk || item.dept_pks?.[0] || '');
  const code = item.dept_code || item.code || '';
  const name = item.dept_name || item.name || '';
  return {
    label: [code, name].filter(Boolean).join(' - '),
    value: pk,
    dept_name: name,
    dept_pks: item.dept_pks?.length ? item.dept_pks : pk ? [pk] : []
  };
}

function mapBranch(item: ApiBranch): BranchOption {
  const pk = String(item.pk || item.branch_pks?.[0] || '');
  const code = item.branch_code || item.code || '';
  const name = item.branch_name || item.name || '';
  return {
    label: [code, name].filter(Boolean).join(' - '),
    value: pk,
    branch_name: name,
    dept_list: (item.dept_list ?? []).map(mapDept)
  };
}

function mapCompany(item: ApiCompany): CompanyOption {
  const pk = String(item.pk || item.company_pks?.[0] || '');
  const code = item.company_code || item.code || '';
  const name = item.company_name || item.name || '';
  return {
    label: [code, name].filter(Boolean).join(' - '),
    value: pk,
    company_name: name,
    branch_list: (item.branch_list ?? []).map(mapBranch)
  };
}

async function loadOptions() {
  try {
    loading.value = true;
    const { data } = await queryCompanyBranchDeptOptions();
    companyItems.value = (data?.company_list ?? []).map(mapCompany);

    const session = appStore.userSession;
    const companyPk = String(session?.company_pk ?? '');
    const idx = companyItems.value.findIndex(item => item.value === companyPk);
    if (idx >= 0) {
      selectCompanyPK.value = companyPk;
      branchItems.value = companyItems.value[idx].branch_list;
      const branchPk = String(session?.branch_pk ?? '');
      const idx2 = branchItems.value.findIndex(item => item.value === branchPk);
      if (idx2 >= 0) {
        selectBranchPK.value = branchPk;
        deptItems.value = branchItems.value[idx2].dept_list;
        const deptPk = String(session?.dept_pk ?? '');
        const idx3 = deptItems.value.findIndex(item => item.value === deptPk);
        if (idx3 >= 0) selectDeptPK.value = deptPk;
      }
    }
  } finally {
    loading.value = false;
  }
}

function onSelectedCompany(val: string | null) {
  branchItems.value = [];
  deptItems.value = [];
  selectBranchPK.value = null;
  selectDeptPK.value = null;
  if (!val) return;
  const idx = companyItems.value.findIndex(item => item.value === val);
  if (idx < 0) return;
  branchItems.value = companyItems.value[idx].branch_list;
  if (branchItems.value.length === 1) {
    selectBranchPK.value = String(branchItems.value[0].value);
    onSelectedBranch(selectBranchPK.value);
  }
}

function onSelectedBranch(val: string | null) {
  deptItems.value = [];
  selectDeptPK.value = null;
  if (!val) return;
  const idx = branchItems.value.findIndex(item => item.value === val);
  if (idx < 0) return;
  deptItems.value = branchItems.value[idx].dept_list;
  if (deptItems.value.length === 1) {
    selectDeptPK.value = String(deptItems.value[0].value);
  }
}

watch(diaVis, val => {
  if (val) {
    selectCompanyPK.value = null;
    selectBranchPK.value = null;
    selectDeptPK.value = null;
    branchItems.value = [];
    deptItems.value = [];
    void loadOptions();
  }
});

async function confirm() {
  if (!selectCompanyPK.value || !selectBranchPK.value) {
    window.$message?.warning($t('common.switchBranch.required'));
    return;
  }

  const dept = deptItems.value.find(item => item.value === selectDeptPK.value);
  try {
    loading.value = true;
    const { data } = await switchBranch({
      dept_pks: dept?.dept_pks ?? []
    });
    if (data?.accessToken) {
      sessionStorage.setItem('token', data.accessToken);
      localStg.set('token', data.accessToken);
    }
    window.$message?.success($t('common.switchBranch.success'));
    diaVis.value = false;
    window.location.reload();
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NModal
    v-model:show="diaVis"
    preset="card"
    :title="$t('common.switchBranch.title')"
    style="width: 440px"
    :mask-closable="false"
  >
    <NSpin :show="loading">
      <NForm label-placement="left" label-width="100">
        <NGrid :cols="1" :x-gap="12">
          <NFormItemGi :label="$t('common.company')">
            <NSelect
              v-model:value="selectCompanyPK"
              :options="companyItems"
              auto-select-first
              filterable
              clearable
              :placeholder="$t('common.switchBranch.selectCompany')"
              @update:value="onSelectedCompany"
            />
          </NFormItemGi>

          <NFormItemGi :label="$t('common.branch')">
            <NSelect
              v-model:value="selectBranchPK"
              :options="branchItems"
              auto-select-first
              filterable
              clearable
              :disabled="!selectCompanyPK"
              :placeholder="$t('common.switchBranch.selectBranch')"
              @update:value="onSelectedBranch"
            />
          </NFormItemGi>

          <NFormItemGi :label="$t('common.department')">
            <NSelect
              v-model:value="selectDeptPK"
              :options="deptItems"
              auto-select-first
              filterable
              clearable
              :disabled="!selectBranchPK"
              :placeholder="$t('common.switchBranch.selectDepartment')"
            />
          </NFormItemGi>
        </NGrid>
      </NForm>
    </NSpin>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="diaVis = false">{{ $t('common.close') }}</NButton>
        <NButton type="primary" @click="confirm">{{ $t('common.ok') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
