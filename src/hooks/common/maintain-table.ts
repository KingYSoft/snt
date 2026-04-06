import { ref } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { useNaivePaginatedTable, useTableOperate } from './table';
import { sjcTransform, buildSjcPaginationParams } from '@/utils/maintain/transform';
import { $t } from '@/locales';

/**
 * Wrapper hook for maintain CRUD pages.
 * Handles the circular type inference between api→pagination and columns→handleEdit→data
 * by using refs for callbacks and pagination state.
 */
export function useMaintainTable<T = any>(options: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryFn: (params: any) => Promise<any>;
  deleteFn: (id: number) => Promise<any>;
  getColumns: (handleEdit: (id: any) => void, handleDelete: (row: any) => void) => DataTableColumns<T>;
  filters?: () => Array<{ key: string; op: string; val: string }>;
  defaultSearchKey?: string;
}) {
  const { queryFn, deleteFn, getColumns, filters, defaultSearchKey } = options;

  // Search state
  const searchKey = ref(defaultSearchKey || '');
  const searchOp = ref('Contain');
  const searchVal = ref('');
  const currentFilters = ref<Array<{ key: string; op: string; val: string }>>([]);

  function handleSearch() {
    currentFilters.value = searchVal.value ? [{ key: searchKey.value, op: searchOp.value, val: searchVal.value }] : [];
    pageRef.value = 1;
    pagination.page = 1;
    getData();
  }

  function handleReset() {
    searchVal.value = '';
    searchOp.value = 'Contain';
    currentFilters.value = [];
    pageRef.value = 1;
    pagination.page = 1;
    getData();
  }

  // Use refs to break circular type inference
  const editRef = ref<(id: any) => void>(() => {});
  const deleteRef = ref<(row: any) => void>(() => {});
  const pageRef = ref(1);
  const pageSizeRef = ref(100);
  const deleteLoading = ref(false);

  const { data, loading, columns, pagination, getData } = useNaivePaginatedTable<any, any>({
    api: async () => {
      const result = await queryFn({
        ...buildSjcPaginationParams(pageRef.value, pageSizeRef.value),
        filters: filters ? filters() : currentFilters.value
      });
      return result;
    },
    columns: () =>
      getColumns(
        (id: any) => editRef.value(id),
        (row: any) => deleteRef.value(row)
      ),

    transform: response =>
      sjcTransform(response, {
        page: pageRef.value,
        pageSize: pageSizeRef.value
      }),
    paginationProps: {
      pageSizes: [10, 20, 50, 100]
    },
    onPaginationParamsChange: params => {
      pageRef.value = params.page ?? 1;
      pageSizeRef.value = params.pageSize ?? 100;
    }
  });

  const { drawerVisible, operateType, editingData, handleAdd, handleEdit, onDeleted } = useTableOperate<any>(
    data as any,
    'id' as any,
    getData
  );

  async function handleDelete(row: any) {
    deleteLoading.value = true;
    try {
      await deleteFn(row.id);
      window.$message?.success($t('common.deleteSuccess'));
      await onDeleted();
    } finally {
      deleteLoading.value = false;
    }
  }

  // Wire up callbacks after hooks are initialized
  editRef.value = handleEdit;
  deleteRef.value = handleDelete;

  return {
    data,
    loading,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: columns as any,
    pagination,
    getData,
    drawerVisible,
    operateType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editingData: editingData as any,
    handleAdd,
    handleEdit,
    handleDelete,
    deleteLoading,
    searchKey,
    searchOp,
    searchVal,
    handleSearch,
    handleReset
  };
}
