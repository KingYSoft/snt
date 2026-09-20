<script setup lang="ts">
defineOptions({
  name: 'SystemBranch'
});
</script>

<template>
  <div class="p-16px">
    <NCard :title="$t('route.system_branch')">
      <NEmpty :description="$t('common.lookForward')" />
    </NCard>
  </div>
</template>
