<script setup lang="ts">
import { ref, watch, h } from 'vue';
import { NDataTable, NButton, NForm, NFormItem, NSelect, NUpload } from 'naive-ui';
import { edocSearch, edocSave } from '@/service/api/business/shipment';
import { $t } from '@/locales';

const props = defineProps<{ inputData: Record<string, any> }>();

const docList = ref<any[]>([]);
const loading = ref(false);

const docTypeOptions = [
  { label: 'BL', value: 'BL' },
  { label: 'Invoice', value: 'Invoice' },
  { label: 'Packing List', value: 'Packing List' },
  { label: 'CI', value: 'CI' },
  { label: 'PL', value: 'PL' },
  { label: 'Others', value: 'Others' }
];

const columns = [
  { title: 'File Name', key: 'file_name', minWidth: 200 },
  { title: 'File Type', key: 'file_type', width: 120 },
  { title: 'Ref No.', key: 'ref_no', width: 150 },
  { title: 'Received Time', key: 'received_time', width: 180 }
];

async function loadDocs() {
  if (!props.inputData.pk) return;
  try {
    loading.value = true;
    const { data } = await edocSearch({
      parent_table: 'shipment',
      related_key: props.inputData.pk
    });
    if (data) {
      docList.value = data.items ?? data.list ?? [];
    }
  } catch {
    // ignore
  } finally {
    loading.value = false;
  }
}

function openUploadDialog() {
  if (!props.inputData.pk) {
    window.$message?.warning('Please save shipment first.');
    return;
  }

  const uploadFileType = ref('');
  const uploadedFile = ref<File | null>(null);

  window.$dialog?.create({
    title: $t('page.business.shipment.tab.eDocs'),
    content: () =>
      h(NForm, { labelPlacement: 'left', labelWidth: '100px' }, () => [
        h(NFormItem, { label: 'Doc Type', path: 'fileType' }, () =>
          h(NSelect, {
            value: uploadFileType.value,
            options: docTypeOptions,
            placeholder: 'Select document type',
            style: { width: '100%' },
            onUpdateValue: (v: string) => {
              uploadFileType.value = v;
            }
          })
        ),
        h(NFormItem, { label: 'File', path: 'file' }, () =>
          h(
            NUpload,
            {
              max: 1,
              showFileList: false,
              onUpdateFileList: (fileList: any[]) => {
                if (fileList.length > 0) {
                  uploadedFile.value = fileList[0].file || null;
                }
              }
            },
            () => h(NButton, {}, () => 'Select File')
          )
        )
      ]),
    positiveText: 'Upload',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      if (!uploadFileType.value) {
        window.$message?.warning($t('page.business.shipment.edoc.selectDocType'));
        return false;
      }
      if (!uploadedFile.value) {
        window.$message?.warning('Please select a file.');
        return false;
      }

      try {
        const formData = new FormData();
        formData.append('file', uploadedFile.value);
        formData.append('parent_table', 'shipment');
        formData.append('related_key', props.inputData.pk);
        formData.append('file_type', uploadFileType.value);
        formData.append('ref_no', '');
        await edocSave(formData);
        window.$message?.success($t('page.business.shipment.edoc.uploadSuccess'));
        loadDocs();
      } catch {
        window.$message?.error($t('page.business.shipment.edoc.uploadFailed'));
        return false;
      }
      return true;
    }
  });
}

watch(
  () => props.inputData.pk,
  pk => {
    if (pk) loadDocs();
  },
  { immediate: true }
);
</script>

<template>
  <div class="p-4">
    <div class="mb-12px">
      <NButton type="primary" size="small" @click="openUploadDialog">Upload</NButton>
      <NButton size="small" class="ml-8px" @click="loadDocs">Refresh</NButton>
    </div>

    <NDataTable
      :columns="columns"
      :data="docList"
      :bordered="true"
      size="small"
      :loading="loading"
      :row-key="(row: any) => row.id"
    />
  </div>
</template>
