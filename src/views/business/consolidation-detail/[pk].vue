<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NCard, NSkeleton, NTabPane, NTabs } from 'naive-ui';
import { $t } from '@/locales';
import { useTabStore } from '@/store/modules/tab';
import { consolidationGetById, consolidationQueryPage } from '@/service/api/business/consolidation';
import TabDetails from '../consolidation/modules/tab-details.vue';
import TabContainer from '../consolidation/modules/tab-container.vue';
import TabRouting from '../consolidation/modules/tab-routing.vue';
import TabBilling from '../consolidation/modules/tab-billing.vue';
import TabEDocs from '../consolidation/modules/tab-edocs.vue';
import TabLogs from '../consolidation/modules/tab-logs.vue';

defineOptions({
  name: 'BusinessConsolidationDetail'
});

const router = useRouter();
const route = useRoute();
const tabStore = useTabStore();

const skeletonLoading = ref(true);
const activedTab = ref(1);

const inputData = ref<Record<string, any>>({
  id: 0,
  pk: '',
  con_unique_consign_ref: '',
  shipper: {},
  consignee: {},
  notify_party: {},
  containers_list: [],
  routing_list: [],
  shipments: []
});

const tabTitle = computed(() => {
  const consolNo = String(route.query.con_unique_consign_ref || inputData.value.con_unique_consign_ref || '');
  return consolNo ? `${$t('route.business_consolidation')} - ${consolNo}` : $t('route.business_consolidation');
});

async function loadData() {
  const id = route.query.id;
  const pk = String(route.params.pk || '');

  try {
    let detailData: Record<string, any> | null = null;

    if (id) {
      const response = await consolidationGetById(String(id));
      detailData = response.data || null;
    } else if (pk) {
      const response = await consolidationQueryPage({
        SkipCount: 0,
        MaxResultCount: 1,
        filters: [{ key: 'pk', op: '=', val: pk }]
      });
      detailData = response.data?.items?.[0] || null;
    }

    if (detailData) {
      inputData.value = {
        ...detailData,
        shipper: detailData.shipper || {},
        consignee: detailData.consignee || {},
        notify_party: detailData.notify_party || {},
        containers_list: detailData.containers_list || [],
        routing_list: detailData.routing_list || [],
        shipments: detailData.shipments || [],
        pk: detailData.pk || pk
      };

      if (inputData.value.con_unique_consign_ref) {
        tabStore.setTabLabel(`${$t('route.business_consolidation')} - ${inputData.value.con_unique_consign_ref}`);
      }
    } else {
      window.$dialog?.warning({
        title: $t('page.business.consolidation.dialog.notFoundTitle'),
        content: $t('page.business.consolidation.dialog.notFoundMessage'),
        positiveText: $t('common.close'),
        onPositiveClick: () => {
          router.push({ name: 'business_consolidation' });
        }
      });
    }
  } catch {
    window.$dialog?.warning({
      title: $t('page.business.consolidation.dialog.notFoundTitle'),
      content: $t('page.business.consolidation.dialog.notFoundMessage'),
      positiveText: $t('common.close'),
      onPositiveClick: () => {
        router.push({ name: 'business_consolidation' });
      }
    });
  } finally {
    skeletonLoading.value = false;
  }
}

loadData();
</script>

<template>
  <div class="p-16px">
    <NCard :title="tabTitle">
      <NTabs v-model:value="activedTab" type="line">
        <NTabPane :name="1" :tab="$t('page.business.consolidation.tab.details')">
          <NSkeleton v-if="skeletonLoading" text :row="18" />
          <TabDetails v-else :input-data="inputData" />
        </NTabPane>
        <NTabPane :name="2" :tab="$t('page.business.consolidation.tab.container')">
          <NSkeleton v-if="skeletonLoading" text :row="8" />
          <TabContainer v-else :input-data="inputData" />
        </NTabPane>
        <NTabPane :name="3" :tab="$t('page.business.consolidation.tab.routing')">
          <NSkeleton v-if="skeletonLoading" text :row="8" />
          <TabRouting v-else :input-data="inputData" />
        </NTabPane>
        <NTabPane :name="4" :tab="$t('page.business.consolidation.tab.billing')">
          <NSkeleton v-if="skeletonLoading" text :row="12" />
          <TabBilling v-else :input-data="inputData" />
        </NTabPane>
        <NTabPane :name="5" :tab="$t('page.business.consolidation.tab.eDocs')">
          <NSkeleton v-if="skeletonLoading" text :row="6" />
          <TabEDocs v-else :input-data="inputData" />
        </NTabPane>
        <NTabPane :name="6" :tab="$t('page.business.consolidation.tab.logs')">
          <NSkeleton v-if="skeletonLoading" text :row="6" />
          <TabLogs v-else :input-data="inputData" />
        </NTabPane>
      </NTabs>
    </NCard>
  </div>
</template>
