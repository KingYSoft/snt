<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { DataTableColumns, DataTableRowKey, FormInst, FormRules } from 'naive-ui';
import { $t } from '@/locales';
import { queryBranchPage, type SysBranch } from '@/service/api/system/branch';
import {
  createClosingPeriod,
  formatClosingPeriodDate,
  formatClosingPeriodMonth,
  updateClosingPeriod,
  type ClosingPeriodRecord
} from '@/service/api/settlement/closing-period';

const props = defineProps<{
  operateType: 'add' | 'edit';
  editingData: ClosingPeriodRecord | null;
}>();

const emit = defineEmits<{
  (e: 'submitted'): void;
}>();

const visible = defineModel<boolean>('visible', { required: true });

const formRef = ref<FormInst | null>(null);
const saving = ref(false);
const branchLoading = ref(false);
const branchLoaded = ref(false);
const branchRows = ref<SysBranch[]>([]);
const branchKeyword = ref('');
const branchError = ref('');
const selectedBranchPks = ref<DataTableRowKey[]>([]);

const form = reactive<{ closePeriod: string | null; closingDate: string | null }>({
  closePeriod: null,
  closingDate: null
});

const title = computed(() =>
  props.operateType === 'add'
    ? $t('page.settlement.closingPeriod.dialog.newTitle')
    : $t('page.settlement.closingPeriod.dialog.editTitle')
);

const rules: FormRules = {
  closePeriod: {
    required: true,
    message: $t('page.settlement.closingPeriod.dialog.periodRequired'),
    trigger: ['blur', 'change']
  },
  closingDate: {
    required: true,
    message: $t('page.settlement.closingPeriod.dialog.closingDateRequired'),
    trigger: ['blur', 'change']
  }
};

const branchColumns: DataTableColumns<SysBranch> = [
  { type: 'selection' },
  {
    key: 'code',
    title: $t('page.settlement.closingPeriod.dialog.branchCode'),
    width: 100
  },
  {
    key: 'org_code',
    title: $t('page.settlement.closingPeriod.dialog.orgCode'),
    width: 120
  },
  {
    key: 'branch_name',
    title: $t('page.settlement.closingPeriod.dialog.branchName'),
    ellipsis: { tooltip: true }
  }
];

const filteredBranchRows = computed(() => {
  const keyword = branchKeyword.value.trim().toLowerCase();
  if (!keyword) return branchRows.value;
  return branchRows.value.filter(row =>
    [row.code, row.branch_name].some(value =>
      String(value ?? '')
        .trim()
        .toLowerCase()
        .includes(keyword)
    )
  );
});

async function loadBranches() {
  if (branchLoaded.value) return;
  branchLoading.value = true;
  try {
    const res = await queryBranchPage({ skipCount: 0, maxResultCount: 1000, filters: [] });
    const rows: SysBranch[] = res?.data?.items ?? [];
    branchRows.value = rows.filter(row => row.pk);
    branchLoaded.value = true;
  } catch {
    branchRows.value = [];
  } finally {
    branchLoading.value = false;
  }
}

function applyData() {
  const item = props.editingData;
  if (props.operateType === 'edit' && item) {
    form.closePeriod = formatClosingPeriodMonth(item.close_period) || null;
    form.closingDate = formatClosingPeriodDate(item.closing_date) || null;
    selectedBranchPks.value = item.branch_pk ? [item.branch_pk] : [];
  } else {
    form.closePeriod = null;
    form.closingDate = null;
    selectedBranchPks.value = [];
  }
  branchKeyword.value = '';
  branchError.value = '';
  formRef.value?.restoreValidation();
}

watch(visible, open => {
  if (!open) return;
  void loadBranches();
  applyData();
});

watch(selectedBranchPks, keys => {
  if (props.operateType === 'edit' && keys.length > 1) {
    selectedBranchPks.value = [keys[keys.length - 1]];
    return;
  }
  if (keys.length) {
    branchError.value = '';
  }
});

async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  const branchPks = selectedBranchPks.value.map(key => String(key)).filter(Boolean);
  if (!branchPks.length) {
    branchError.value = $t('page.settlement.closingPeriod.dialog.businessUnitRequired');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      branch_pk_list: branchPks,
      close_period: formatClosingPeriodMonth(form.closePeriod),
      closing_date: formatClosingPeriodDate(form.closingDate)
    };

    if (props.operateType === 'edit') {
      const id = Number(props.editingData?.id ?? 0);
      if (!id) {
        window.$message?.error($t('page.settlement.closingPeriod.dialog.updateFailed'));
        return;
      }
      await updateClosingPeriod({ ...payload, id });
      window.$message?.success($t('page.settlement.closingPeriod.dialog.updateSuccess'));
    } else {
      await createClosingPeriod(payload);
      window.$message?.success($t('page.settlement.closingPeriod.dialog.createSuccess'));
    }

    visible.value = false;
    emit('submitted');
  } catch {
    window.$message?.error(
      $t(
        props.operateType === 'edit'
          ? 'page.settlement.closingPeriod.dialog.updateFailed'
          : 'page.settlement.closingPeriod.dialog.createFailed'
      )
    );
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" :title="title" :style="{ width: '860px' }" :mask-closable="false">
    <NForm ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="110">
      <NGrid :cols="2" :x-gap="16">
        <NGi>
          <NFormItem :label="$t('page.settlement.closingPeriod.dialog.accountingMonth')" path="closePeriod">
            <NDatePicker
              v-model:formatted-value="form.closePeriod"
              type="month"
              value-format="yyyy-MM"
              clearable
              class="w-full"
            />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem :label="$t('page.settlement.closingPeriod.dialog.closingDate')" path="closingDate">
            <NDatePicker
              v-model:formatted-value="form.closingDate"
              type="date"
              value-format="yyyy-MM-dd"
              clearable
              class="w-full"
            />
          </NFormItem>
        </NGi>
      </NGrid>

      <NDivider />

      <div class="mb-8px flex items-center gap-8px">
        <span class="w-110px shrink-0 whitespace-nowrap text-right text-13px">
          {{ $t('page.settlement.closingPeriod.dialog.businessUnit') }}:
        </span>
        <NInput
          v-model:value="branchKeyword"
          :placeholder="$t('page.settlement.closingPeriod.dialog.branchCodePlaceholder')"
          clearable
          class="flex-1"
        />
      </div>

      <NDataTable
        v-model:checked-row-keys="selectedBranchPks"
        :row-key="(row: SysBranch) => String(row.pk)"
        :columns="branchColumns"
        :data="filteredBranchRows"
        :loading="branchLoading"
        :pagination="false"
        :max-height="320"
        size="small"
        striped
      />

      <div v-if="branchError" class="mt-4px text-12px text-error">{{ branchError }}</div>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="saving" @click="handleSubmit">{{ $t('common.save') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
:deep(.n-form-item-label) {
  white-space: nowrap;
}

:deep(.n-data-table-th) {
  white-space: nowrap;
}
</style>
