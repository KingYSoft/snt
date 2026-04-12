import { ref } from 'vue';
import { queryCompanyPage } from '@/service/api/maintain/company';
import type { Company } from '@/service/api/maintain/company';

export interface CompanyOption {
  label: string;
  value: string;
  data?: Company;
}

export function useCompanySearch() {
  const companyOptions = ref<CompanyOption[]>([]);
  const companyLoading = ref(false);
  const companySearchQuery = ref('');
  const companyPagination = ref({
    page: 1,
    pageSize: 10,
    itemCount: 0
  });

  /**
   * 搜索公司
   */
  async function searchCompany(query: string, page = 1) {
    companySearchQuery.value = query;
    if (!query) {
      companyOptions.value = [];
      companyPagination.value.page = 1;
      companyPagination.value.itemCount = 0;
      return;
    }

    companyLoading.value = true;
    try {
      const skipCount = (page - 1) * companyPagination.value.pageSize;
      const result = (await queryCompanyPage({
        skipCount,
        maxResultCount: companyPagination.value.pageSize,
        filters: [{ key: 'name', op: 'Contain', val: query }]
      })) as any;

      // 处理 API 响应格式: { data: { items, totalCount }, success, errCode, msg }
      const items = result?.data?.items || result?.items || [];
      const totalCount = result?.data?.totalCount || result?.totalCount || 0;

      companyOptions.value = items.map((item: Company) => ({
        label: item.name,
        value: item.pk || String(item.id),
        data: {
          ...item,
          nameEnglish: item.name,
          abbreviation: item.name?.length > 20 ? item.name.substring(0, 20) + '...' : item.name
        }
      }));

      // 更新分页信息
      companyPagination.value.page = page;
      companyPagination.value.itemCount = totalCount;
    } finally {
      companyLoading.value = false;
    }
  }

  /**
   * 处理公司分页变化
   */
  function handlePageChange(page: number) {
    searchCompany(companySearchQuery.value, page);
  }

  return {
    companyOptions,
    companyLoading,
    companySearchQuery,
    companyPagination,
    searchCompany,
    handlePageChange
  };
}
