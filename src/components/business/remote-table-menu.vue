<script setup lang="ts">
import { h, ref, watch, nextTick, computed } from 'vue';
import { NInput, NPopover, NDataTable, NButton, NSpace, NProgress } from 'naive-ui';

export interface RemoteTableMenuProps {
  /** Remote query function: (payload) => Promise<{ data: any }> */
  fetchMethod: (payload: Record<string, any>) => Promise<{ data: any }>;
  /** NDataTable column definitions */
  headers: Array<Record<string, any>>;
  /** The field name in the request payload for the search text */
  queryKey?: string;
  /** Extra static params merged into every request */
  queryExtra?: Record<string, any>;
  /** The row field whose value is displayed in the input after selection */
  displayKey?: string;
  /** The row field used as unique key for the data table */
  itemValue?: string;
  /** Debounce delay in ms */
  debounceMs?: number;
  /** v-model: display text in the input */
  modelValue?: string;
  /** Whether the input is required (shows red asterisk via label) */
  label?: string;
  /** Whether to show the "New" button */
  showNew?: boolean;
}

const props = withDefaults(defineProps<RemoteTableMenuProps>(), {
  queryKey: 'query',
  queryExtra: () => ({}),
  displayKey: 'name',
  itemValue: 'pk',
  debounceMs: 300,
  modelValue: '',
  label: '',
  showNew: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void;
  (e: 'rowSelect', row: Record<string, any>): void;
  (e: 'newHandle'): void;
}>();

const showPopover = ref(false);
const inputText = ref(props.modelValue);
const tableData = ref<Record<string, any>[]>([]);
const loading = ref(false);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let requestId = 0;

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);

// Sync external modelValue changes
watch(
  () => props.modelValue,
  val => {
    inputText.value = val;
  }
);

// Snapshot for cancel/clear restore
let snapshotText = '';

function openMenu() {
  snapshotText = inputText.value;
  currentPage.value = 1;
  showPopover.value = true;
  runQuery('');
}

function handleClear() {
  inputText.value = '';
  emit('update:modelValue', '');
  snapshotText = '';
}

function handleInput(val: string) {
  inputText.value = val;
  emit('update:modelValue', val);
  currentPage.value = 1;
  scheduleQuery(val);
}

function scheduleQuery(search: string) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    runQuery(search);
  }, props.debounceMs);
}

function handlePageChange(page: number) {
  currentPage.value = page;
  runQuery(inputText.value);
}

async function runQuery(search: string) {
  const currentRequestId = ++requestId;
  loading.value = true;
  try {
    const payload = {
      ...props.queryExtra,
      [props.queryKey]: search,
      page: currentPage.value,
      page_size: pageSize.value
    };
    const { data } = await props.fetchMethod(payload);
    // Stale check
    if (currentRequestId !== requestId) return;
    if (data) {
      const list = data.list ?? data.items ?? (Array.isArray(data) ? data : []);
      tableData.value = Array.isArray(list) ? list : [];
      totalCount.value = data.total ?? data.totalCount ?? tableData.value.length;
    } else {
      tableData.value = [];
      totalCount.value = 0;
    }
  } catch {
    if (currentRequestId === requestId) {
      tableData.value = [];
      totalCount.value = 0;
    }
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false;
    }
  }
}

function handleRowClick(row: Record<string, any>) {
  emit('rowSelect', row);
  const displayVal = row[props.displayKey] || '';
  inputText.value = displayVal;
  emit('update:modelValue', displayVal);
  snapshotText = displayVal;
  nextTick(() => {
    showPopover.value = false;
  });
}

function handleCancel() {
  inputText.value = snapshotText;
  emit('update:modelValue', snapshotText);
  showPopover.value = false;
}

function handleNew() {
  emit('newHandle');
  showPopover.value = false;
}

// Table row key
function rowKey(row: Record<string, any>): string {
  return String(row[props.itemValue] ?? row.id ?? Math.random());
}

// Pagination config
const pagination = computed(() => ({
  page: currentPage.value,
  pageSize: pageSize.value,
  itemCount: totalCount.value,
  pageSizes: [10, 20, 50],
  showSizePicker: false,
  showQuickJumper: false,
  prefix: (info: { itemCount: number | undefined }) => `${info.itemCount ?? 0} items`
}));

// Table columns with click selection via first column wrapper
const tableColumns = computed(() => {
  return [
    {
      title: '',
      key: '__row_selector',
      width: 0,
      render(row: Record<string, any>) {
        return h('div', {
          style: 'display:contents',
          onDblclick: () => handleRowClick(row)
        });
      }
    },
    ...props.headers.map((col: any) => ({
      ...col,
      ellipsis: col.ellipsis ?? { tooltip: true }
    }))
  ];
});
</script>

<template>
  <NPopover
    v-model:show="showPopover"
    trigger="click"
    placement="bottom-start"
    :show-arrow="false"
    style="width: 620px"
    raw
  >
    <template #trigger>
      <NInput
        :value="inputText"
        clearable
        size="small"
        :placeholder="label || 'Search...'"
        @focus="openMenu"
        @clear="handleClear"
        @update:value="handleInput"
      />
    </template>

    <div class="remote-table-menu">
      <NProgress
        v-if="loading"
        type="line"
        :percentage="100"
        :show-indicator="false"
        status="info"
        processing
        :height="2"
        style="margin-bottom: 4px"
      />

      <NDataTable
        :columns="tableColumns"
        :data="tableData"
        :row-key="rowKey"
        :row-class-name="
          (row: Record<string, any>) => (row[displayKey] === modelValue ? 'remote-table-menu__row--active' : '')
        "
        :row-props="
          (row: Record<string, any>) => ({
            style: 'cursor: pointer',
            onDblclick: () => handleRowClick(row)
          })
        "
        :pagination="pagination"
        :paginate-single-page="false"
        remote
        size="small"
        :max-height="340"
        :bordered="false"
        :scroll-x="700"
        striped
        :single-line="false"
        style="width: 100%"
        @update:page="handlePageChange"
      />

      <div class="remote-table-menu__footer">
        <NSpace>
          <NButton v-if="showNew" type="primary" size="tiny" @click="handleNew">New</NButton>
          <NButton size="tiny" @click="handleCancel">Cancel</NButton>
        </NSpace>
      </div>
    </div>
  </NPopover>
</template>

<style scoped>
.remote-table-menu {
  width: 620px;
  background-color: #ffffff;
}

.remote-table-menu__row {
  cursor: pointer;
  transition: background-color 0.15s;
}

.remote-table-menu__row:hover {
  background-color: var(--n-color-hover, rgba(0, 0, 0, 0.04));
}

.remote-table-menu__row--active {
  border-left: 3px solid var(--n-color-primary, #18a058);
  background-color: var(--n-color-primary-hover, rgba(24, 160, 88, 0.08));
}

.remote-table-menu__cell {
  padding: 4px 12px;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.remote-table-menu__footer {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px;
  border-top: 1px solid var(--n-border-color, #efeff5);
}
</style>
