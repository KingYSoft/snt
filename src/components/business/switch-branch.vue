<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { NButton, NForm, NFormItemGi, NGrid, NModal, NSelect, NSpace, NSpin } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';
import { querySwitchTbl, switchBranch } from '@/service/api/user';

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

interface CompanyOption extends SelectOption {
  company_name: string;
  branch_list: BranchOption[];
}

interface BranchOption extends SelectOption {
  branch_name: string;
  dept_list: DeptOption[];
}

interface DeptOption extends SelectOption {
  dept_name: string;
}

const companyItems = ref<CompanyOption[]>([]);
const branchItems = ref<BranchOption[]>([]);
const deptItems = ref<DeptOption[]>([]);

async function querySwitchTblData() {
  try {
    loading.value = true;
    const res = await querySwitchTbl();
    if (res && typeof res === 'object' && 'company_list' in res) {
      const data = res as {
        company_list: Array<{
          company_pk: string;
          company_code: string;
          company_name: string;
          branch_list: Array<{
            branch_pk: string;
            branch_code: string;
            branch_name: string;
            dept_list: Array<{
              dept_pk: string;
              dept_code: string;
              dept_name: string;
            }>;
          }>;
        }>;
      };

      companyItems.value = data.company_list.map(item => ({
        label: `${item.company_code} - ${item.company_name}`,
        value: item.company_pk,
        company_name: item.company_name,
        branch_list: item.branch_list.map(b => ({
          label: `${b.branch_code} - ${b.branch_name}`,
          value: b.branch_pk,
          branch_name: b.branch_name,
          dept_list: b.dept_list.map(d => ({
            label: `${d.dept_code} - ${d.dept_name}`,
            value: d.dept_pk,
            dept_name: d.dept_name
          }))
        }))
      }));

      const currentCompanyPK = appStore.userSession?.currentCompanyPK;
      const idx = companyItems.value.findIndex(a => a.value === currentCompanyPK);
      if (idx >= 0) {
        selectCompanyPK.value = currentCompanyPK;
        branchItems.value = companyItems.value[idx].branch_list;

        const currentBranchPK = appStore.userSession?.currentBranchPK;
        const idx2 = branchItems.value.findIndex(x => x.value === currentBranchPK);
        if (idx2 >= 0) {
          selectBranchPK.value = currentBranchPK;
          deptItems.value = branchItems.value[idx2].dept_list;
        }
      }
    }
  } finally {
    loading.value = false;
  }
}

function onSelectedCompany(val: string | null) {
  branchItems.value = [];
  selectBranchPK.value = null;
  selectDeptPK.value = null;

  if (val) {
    const idx = companyItems.value.findIndex(a => a.value === val);
    if (idx >= 0) {
      branchItems.value = companyItems.value[idx].branch_list;
    }
  }
}

watch(diaVis, val => {
  if (val) {
    querySwitchTblData();
  }
});

async function confirm() {
  if (!selectCompanyPK.value || !selectBranchPK.value) {
    window.$message?.warning('Please select company and branch');
    return;
  }

  try {
    loading.value = true;
    const res = await switchBranch({
      company_pk: selectCompanyPK.value,
      branch_pk: selectBranchPK.value,
      dept_pk: selectDeptPK.value
    });

    if (res) {
      window.$message?.success('Switch branch successfully');
      diaVis.value = false;
      window.location.reload();
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NModal
    v-model:show="diaVis"
    preset="card"
    title="Switch Company / Branch"
    style="width: 440px"
    :mask-closable="false"
  >
    <NSpin :show="loading">
      <NForm label-placement="left" label-width="100">
        <NGrid :cols="1" :x-gap="12">
          <NFormItemGi label="Company">
            <NSelect
              v-model:value="selectCompanyPK"
              :options="companyItems"
              auto-select-first
              filterable
              clearable
              placeholder="Select company"
              @update:value="onSelectedCompany"
            />
          </NFormItemGi>

          <NFormItemGi label="Branch">
            <NSelect
              v-model:value="selectBranchPK"
              :options="branchItems"
              auto-select-first
              filterable
              clearable
              :disabled="!selectCompanyPK"
              placeholder="Select branch"
            />
          </NFormItemGi>

          <NFormItemGi label="Department">
            <NSelect
              v-model:value="selectDeptPK"
              :options="deptItems"
              auto-select-first
              filterable
              clearable
              :disabled="!selectBranchPK"
              placeholder="Select department (optional)"
            />
          </NFormItemGi>
        </NGrid>
      </NForm>
    </NSpin>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="diaVis = false">Close</NButton>
        <NButton type="primary" @click="confirm">OK</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
