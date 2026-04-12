<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

defineOptions({ name: 'PageSettlementWriteoffDetail' });

const route = useRoute();
const router = useRouter();
const loading = ref(false);

const writeoffNo = route.query.writeoffNo as string;

onMounted(() => {
  if (writeoffNo) {
    loadWriteoffDetail();
  }
});

async function loadWriteoffDetail() {
  loading.value = true;
  // TODO: 待实现获取销账详情的 API
  setTimeout(() => {
    loading.value = false;
  }, 500);
}

function handleBack() {
  router.back();
}
</script>

<template>
  <div class="h-full overflow-auto p-16px">
    <NCard :title="`销账详情 - ${writeoffNo || ''}`" :bordered="false">
      <NSpace vertical :size="16">
        <NSpin :show="loading">
          <NEmpty description="销账详情功能待实现" />
        </NSpin>

        <NButton @click="handleBack">返回</NButton>
      </NSpace>
    </NCard>
  </div>
</template>
