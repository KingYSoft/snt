<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { NButton, NForm, NFormItemGi, NGrid, NModal, NSelect, NSpace, NSpin } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';
import { $t } from '@/locales';
import { switchBranch } from '@/service/api/user';
import {
  queryCompanyBranchOptions,
  type BranchOption as ApiBranch,
  type CompanyOption as ApiCompany
} from '@/service/api/system/group';
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

interface BranchOption extends SelectOption {
  branch_name: string;
  branch_pks: string[];
}

interface CompanyOption extends SelectOption {
  company_name: string;
  branch_list: BranchOption[];
}

const companyItems = ref<CompanyOption[]>([]);
const branchItems = ref<BranchOption[]>([]);

function mapBranch(item: ApiBranch): BranchOption {
  const pk = String(item.pk || item.branch_pks?.[0] || '');
  const code = item.branch_code || item.code || '';
  const name = item.branch_name || item.name || '';
  return {
    label: [code, name].filter(Boolean).join(' - '),
    value: pk,
    branch_name: name,
    branch_pks: item.branch_pks?.length ? item.branch_pks : pk ? [pk] : []
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
    const { data } = await queryCompanyBranchOptions();
    companyItems.value = (data?.company_list ?? []).map(mapCompany);

    const session = appStore.userSession;
    const companyPk = String(session?.company_pk ?? '');
    const idx = companyItems.value.findIndex(item => item.value === companyPk);
    if (idx >= 0) {
      selectCompanyPK.value = companyPk;
      branchItems.value = companyItems.value[idx].branch_list;
      const branchPk = String(session?.branch_pk ?? '');
      const idx2 = branchItems.value.findIndex(item => item.value === branchPk);
      if (idx2 >= 0) selectBranchPK.value = branchPk;
    }
  } finally {
    loading.value = false;
  }
}

function onSelectedCompany(val: string | null) {
  branchItems.value = [];
  selectBranchPK.value = null;
  if (!val) return;
  const idx = companyItems.value.findIndex(item => item.value === val);
  if (idx < 0) return;
  branchItems.value = companyItems.value[idx].branch_list;
  if (branchItems.value.length === 1) {
    selectBranchPK.value = String(branchItems.value[0].value);
  }
}

watch(diaVis, val => {
  if (val) {
    selectCompanyPK.value = null;
    selectBranchPK.value = null;
    branchItems.value = [];
    void loadOptions();
  }
});

async function confirm() {
  if (!selectCompanyPK.value || !selectBranchPK.value) {
    window.$message?.warning($t('common.switchBranch.required'));
    return;
  }

  const branch = branchItems.value.find(item => item.value === selectBranchPK.value);
  try {
    loading.value = true;
    const { data } = await switchBranch({
      branch_pks: branch?.branch_pks ?? []
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
