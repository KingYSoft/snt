<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import RemoteTableMenu from '@/components/business/remote-table-menu.vue';
import { queryCompanyPage } from '@/service/api/maintain/company';
import type { Company } from '@/service/api/maintain/company';
import { useCompanyColumns } from '../modules/companyColumns';

defineOptions({ name: 'CompanySelector' });

const { t } = useI18n();

interface Props {
  modelValue?: string;
}

interface CompanyOption {
  label: string;
  value: string;
  data?: Company;
}

withDefaults(defineProps<Props>(), {
  modelValue: ''
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  select: [company: CompanyOption];
  clear: [];
}>();

const { columns } = useCompanyColumns();

type CompanyRow = Company & {
  nameEnglish: string;
  abbreviation: string;
  __raw: Company;
};

async function fetchCompanies(payload: Record<string, any>) {
  const query = String(payload.query ?? '').trim();

  if (!query) {
    return {
      data: {
        items: [],
        totalCount: 0
      }
    };
  }

  const page = Number(payload.page ?? 1);
  const pageSize = Number(payload.page_size ?? 10);
  const skipCount = (page - 1) * pageSize;
  const result = (await queryCompanyPage({
    skipCount,
    maxResultCount: pageSize,
    filters: [{ key: 'name', op: 'Contain', val: query }]
  })) as any;

  const items = (result?.data?.items || result?.items || []).map((item: Company) => ({
    ...item,
    nameEnglish: item.nameEnglish || item.name,
    abbreviation: item.abbreviation || item.name?.slice(0, 20) || '',
    __raw: item
  }));

  const totalCount = result?.data?.totalCount || result?.totalCount || 0;

  return {
    data: {
      items,
      totalCount
    }
  };
}

function handleSelectCompany(row: Record<string, any>) {
  const normalizedRow = row as CompanyRow;
  const raw = normalizedRow.__raw || normalizedRow;

  emit('update:modelValue', raw.name);
  emit('select', {
    label: raw.name,
    value: raw.pk || String(raw.id),
    data: raw
  });
}
</script>

<template>
  <RemoteTableMenu
    :model-value="modelValue"
    :fetch-method="fetchCompanies"
    :headers="columns"
    display-key="name"
    item-value="pk"
    :label="t('page.settlement.writeoff.create.selectCompany')"
    :empty-text="t('page.settlement.writeoff.create.searchCompany')"
    @update:model-value="value => emit('update:modelValue', value)"
    @row-select="handleSelectCompany"
    @clear="emit('clear')"
  />
</template>
