<script setup lang="ts">
import TabEDocs from '../../shipment/modules/tab-edocs.vue';

defineProps<{
  inputData: Record<string, any>;
  relatedKey?: string | number;
  consolNo?: string | number;
  activedTab?: number;
  tabName?: number;
}>();
</script>

<template>
  <TabEDocs
    parent-table="CON"
    :input-data="inputData"
    :related-key="relatedKey || inputData?.pk || inputData?.jk_pk"
    :ship-no="consolNo || inputData?.jk_uniqueconsignref"
    :actived-tab="activedTab"
    :tab-name="tabName ?? 5"
  />
</template>
