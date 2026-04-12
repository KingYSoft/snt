<script setup lang="ts">
import { NCard, NSpace, NButton } from 'naive-ui';
import { useI18n } from 'vue-i18n';

defineOptions({ name: 'WriteoffFileUploader' });

const { t } = useI18n();

const attachments = defineModel<string[]>({ default: () => [] });

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    attachments.value.push(file.name);
    window.$message?.success(`${t('page.settlement.writeoff.create.uploadSuccess')}: ${file.name}`);
  }
}

function handleRemoveAttachment(index: number) {
  attachments.value.splice(index, 1);
}
</script>

<template>
  <NCard size="small" :bordered="true" :title="t('page.settlement.writeoff.create.bankSlipAttachment')">
    <NSpace vertical :size="12">
      <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" @change="handleFileUpload" />
      <NButton @click="$el.querySelector('input[type=file]')?.click()">
        <template #icon>
          <span>📎</span>
        </template>
        {{ t('page.settlement.writeoff.create.selectFile') }}
      </NButton>
      <div v-if="attachments.length > 0" class="space-y-4px">
        <div
          v-for="(file, index) in attachments"
          :key="index"
          class="flex items-center justify-between p-8px bg-gray-50 rounded"
        >
          <span>{{ file }}</span>
          <NButton text type="error" size="small" @click="handleRemoveAttachment(index)">
            {{ t('page.settlement.writeoff.create.delete') }}
          </NButton>
        </div>
      </div>
    </NSpace>
  </NCard>
</template>
