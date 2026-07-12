<script setup lang="ts">
defineProps<{ inputData: Record<string, any> }>();
</script>

<template>
  <div class="p-4" :data-record-pk="inputData?.pk ?? ''" />
</template>
