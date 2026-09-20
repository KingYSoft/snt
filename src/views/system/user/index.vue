<script setup lang="ts">
defineOptions({
  name: 'SystemUser'
});
</script>

<template>
  <div class="p-16px">
    <NCard :title="$t('route.system_user')">
      <NEmpty :description="$t('common.lookForward')" />
    </NCard>
  </div>
</template>
