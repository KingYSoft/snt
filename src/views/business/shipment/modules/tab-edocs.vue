<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { DataTableColumns, UploadFileInfo } from 'naive-ui';
import {
  NButton,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NUpload,
  NUploadDragger
} from 'naive-ui';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { edocSave, edocSearch, type EdocItem } from '@/service/api/business/edoc';

/** 与 appComboboxConfig.docType 保持一致（接口无数据时兜底） */
const FALLBACK_DOC_TYPES = [
  { code: 'AGI', desc: 'Agents Invoice', id: 1 },
  { code: 'AID', desc: 'Asbestos and ACM Importers Declaration (Published)', id: 2 },
  { code: 'ARN', desc: 'Arrival Notice', id: 3 },
  { code: 'AUD', desc: 'An NSPLIT Document Pack', id: 4 },
  { code: 'AWB', desc: 'Airway Bill', id: 5 },
  { code: 'BKC', desc: 'Booking Confirmation', id: 6 },
  { code: 'CIN', desc: 'Cartage Invoice', id: 7 },
  { code: 'CIV', desc: 'Proforma Invoice', id: 8 },
  { code: 'CLS', desc: 'Container Liability Statement', id: 9 },
  { code: 'COM', desc: 'Commercial Invoice', id: 10 },
  { code: 'COO', desc: 'Certificate of Origin', id: 11 },
  { code: 'DAL', desc: 'Delay Alert', id: 12 },
  { code: 'DBL', desc: 'Draft Bill of Lading', id: 13 },
  { code: 'DEL', desc: 'Delivery Instructions', id: 14 },
  { code: 'DGF', desc: 'Dangerous Goods Form', id: 15 },
  { code: 'FTA', desc: 'Free Trade Agreement', id: 16 },
  { code: 'FUM', desc: 'Fumigation Certificate', id: 17 },
  { code: 'HBL', desc: 'House Waybill/Bill of Lading', id: 18 },
  { code: 'MAN', desc: 'Manifest', id: 19 },
  { code: 'MBL', desc: 'Airway Bill/Ocean Bill of Lading', id: 20 },
  { code: 'MDC', desc: "Manufacturer's Declaration", id: 21 },
  { code: 'MSC', desc: 'Miscellaneous Document', id: 22 },
  { code: 'PAL', desc: 'Pre Alert', id: 23 },
  { code: 'PKD', desc: 'Packing Declaration', id: 24 },
  { code: 'PKL', desc: 'Packing List', id: 25 },
  { code: 'POR', desc: 'Purchase Order', id: 26 },
  { code: 'PRE', desc: 'PRE ALERT DOCUMENTS', id: 27 },
  { code: 'QPK', desc: 'Quarantine Packing Declaration', id: 28 },
  { code: 'SAD', desc: 'Shipping Advice', id: 29 },
  { code: 'SIN', desc: 'Shipping Line or Providers Invoice', id: 30 },
  { code: 'SRD', desc: 'Storage and Re-Infestation Declaration', id: 31 },
  { code: 'TLX', desc: 'Telex released House Waybill/Bill of Lading', id: 32 },
  { code: 'UDP', desc: 'UNSPLIT Doc Pack (Non-Published)', id: 33 }
];

const props = withDefaults(
  defineProps<{
    inputData: Record<string, any>;
    /** SHP / CON，与 front edoc parent_table 一致 */
    parentTable?: 'SHP' | 'CON' | string;
    relatedKey?: string | number;
    shipNo?: string | number;
    activedTab?: number;
    tabName?: number;
  }>(),
  {
    parentTable: 'SHP',
    relatedKey: '',
    shipNo: '',
    activedTab: 5,
    tabName: 5
  }
);

const appStore = useAppStore();

const loading = ref(false);
const uploading = ref(false);
const rows = ref<EdocItem[]>([]);

const showUpload = ref(false);
const uploadFiles = ref<UploadFileInfo[]>([]);
const uploadDocType = ref<string | null>(null);

const parentTable = computed(
  () =>
    String(props.parentTable || 'SHP')
      .trim()
      .toUpperCase() || 'SHP'
);

const relatedKey = computed(() =>
  String(props.relatedKey || props.inputData?.pk || props.inputData?.jk_pk || props.inputData?.js_pk || '').trim()
);
const refNo = computed(() =>
  String(
    props.shipNo ||
      props.inputData?.shp_consign_no ||
      props.inputData?.jk_uniqueconsignref ||
      props.inputData?.js_uniqueconsignref ||
      ''
  ).trim()
);

const docTypeOptions = computed(() => {
  // Front: appStore.appCombobox.getCombobox('docType') ← custom.appComboboxConfig.docType
  const list = appStore.appConfig?.custom?.appComboboxConfig?.docType;
  const source = Array.isArray(list) && list.length ? list : FALLBACK_DOC_TYPES;
  return source
    .map((item: any) => {
      const code = String(item.code ?? item.value ?? item.title ?? '').trim();
      const desc = String(item.desc ?? '').trim();
      return {
        label: desc ? `${code} - ${desc}` : code,
        value: code
      };
    })
    .filter((item: { value: string }) => item.value)
    .sort((a: { value: string }, b: { value: string }) => a.value.localeCompare(b.value));
});

function formatYn(value: unknown) {
  if (value === true || value === 1 || value === 'Y') return 'Y';
  if (value === false || value === 0 || value === 'N') return 'N';
  return '';
}

function formatTime(value: unknown) {
  if (!value) return '';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

async function fetchData() {
  if (!relatedKey.value) {
    rows.value = [];
    return;
  }
  loading.value = true;
  try {
    const { data, error } = await edocSearch({
      parent_table: parentTable.value,
      related_key: relatedKey.value
    });
    if (error) return;
    rows.value = Array.isArray(data?.list) ? data.list : [];
  } finally {
    loading.value = false;
  }
}

async function handleUpload() {
  if (!uploadFiles.value.length || !uploadFiles.value[0]?.file) {
    window.$message?.warning($t('page.business.shipment.edoc.selectFile'));
    return;
  }
  if (!uploadDocType.value) {
    window.$message?.warning($t('page.business.shipment.edoc.selectDocType'));
    return;
  }

  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', uploadFiles.value[0].file as File);
    formData.append('parent_table', parentTable.value);
    formData.append('file_type', uploadDocType.value);
    formData.append('ref_no', refNo.value || relatedKey.value);

    const { error } = await edocSave(formData);
    if (error) {
      window.$message?.error($t('page.business.shipment.edoc.uploadFailed'));
      return;
    }
    window.$message?.success($t('page.business.shipment.edoc.uploadSuccess'));
    showUpload.value = false;
    uploadFiles.value = [];
    uploadDocType.value = null;
    await fetchData();
  } catch {
    window.$message?.error($t('page.business.shipment.edoc.uploadFailed'));
  } finally {
    uploading.value = false;
  }
}

const columns = computed<DataTableColumns<EdocItem>>(() => [
  {
    title: $t('page.business.shipment.edoc.fileName'),
    key: 'file_name',
    minWidth: 160,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.business.shipment.edoc.fileType'),
    key: 'file_type',
    minWidth: 120,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.business.shipment.edoc.refNo'),
    key: 'ref_no',
    minWidth: 140,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.business.shipment.edoc.remarks'),
    key: 'remarks',
    minWidth: 140,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.business.shipment.edoc.publish'),
    key: 'is_publish',
    width: 90,
    render: row => formatYn(row.is_publish)
  },
  {
    title: $t('page.business.shipment.edoc.publishedBy'),
    key: 'published_by',
    minWidth: 120,
    ellipsis: { tooltip: true }
  },
  {
    title: $t('page.business.shipment.edoc.publishedTime'),
    key: 'published_time',
    minWidth: 160,
    render: row => formatTime(row.published_time)
  },
  {
    title: $t('page.business.shipment.edoc.receivedTime'),
    key: 'received_time',
    minWidth: 160,
    render: row => formatTime(row.received_time)
  }
]);

watch(
  () => [props.activedTab, relatedKey.value] as const,
  ([tab]) => {
    if (Number(tab) === Number(props.tabName)) {
      fetchData();
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="p-4">
    <NSpace class="mb-12px" justify="end">
      <NButton type="primary" :disabled="!relatedKey || loading" @click="showUpload = true">
        <template #icon>
          <icon-mdi-upload />
        </template>
        {{ $t('page.business.shipment.edoc.upload') }}
      </NButton>
    </NSpace>

    <NDataTable
      :columns="columns"
      :data="rows"
      :loading="loading"
      :row-key="row => String(row.id ?? row.pk ?? row.file_name)"
      :scroll-x="1400"
      size="small"
      striped
    />

    <NModal
      v-model:show="showUpload"
      preset="card"
      :title="$t('page.business.shipment.edoc.uploadTitle')"
      style="width: 720px"
      :mask-closable="false"
    >
      <NForm label-placement="left" label-width="120">
        <NFormItem :label="parentTable">
          <NInput :value="refNo" disabled />
        </NFormItem>
        <NFormItem :label="$t('page.business.shipment.edoc.docType')" required>
          <NSelect
            v-model:value="uploadDocType"
            :options="docTypeOptions"
            filterable
            clearable
            :placeholder="$t('page.business.shipment.edoc.selectDocType')"
          />
        </NFormItem>
        <NFormItem :label="$t('page.business.shipment.edoc.file')" required>
          <NUpload v-model:file-list="uploadFiles" :max="1" :default-upload="false">
            <NUploadDragger>
              <div class="flex-col-center gap-8px py-24px text-#666">
                <icon-mdi-folder-open class="text-36px text-primary" />
                <div>{{ $t('page.business.shipment.edoc.dropOrClick') }}</div>
              </div>
            </NUploadDragger>
          </NUpload>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showUpload = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="uploading" @click="handleUpload">
            {{ $t('common.confirm') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
