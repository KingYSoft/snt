<script setup lang="ts">
import { computed, onActivated, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NSkeleton, NSpace, NTabPane, NTabs } from 'naive-ui';
import { $t } from '@/locales';
import { useTabStore } from '@/store/modules/tab';
import {
  consolidationGetById,
  consolidationUpdate,
  consolidationSave,
  consolidationAttachShipments,
  consolidationDetachShipments
} from '@/service/api/business/consolidation';
import TabGeneralInfo from '../consolidation/modules/tab-general-info.vue';
import TabContainer from '../consolidation/modules/tab-container.vue';
import TabRouting from '../consolidation/modules/tab-routing.vue';
import TabBilling from '../consolidation/modules/tab-billing.vue';
import TabEDocs from '../consolidation/modules/tab-edocs.vue';
import TabLogs from '../consolidation/modules/tab-logs.vue';

defineOptions({
  name: 'BusinessConsolidationEdite'
});

const router = useRouter();
const route = useRoute();
const tabStore = useTabStore();

const skeletonLoading = ref(true);
const saving = ref(false);
const activedTab = ref(1);
const loadedPk = ref<string | null>(null);

const refGeneralInfo = ref<InstanceType<typeof TabGeneralInfo> | null>(null);

const inputData = ref<Record<string, any>>({
  id: 0,
  pk: '',
  jk_pk: '',
  jk_uniqueconsignref: '',
  shipper: {},
  consignee: {},
  notify_party: {},
  containers_list: [],
  routing_list: [],
  shipments: [],
  local_agent: {},
  overseas_agent: {}
});

const tabTitle = computed(() => {
  const consolNo = String(route.query.con_unique_consign_ref || inputData.value.jk_uniqueconsignref || '');
  return consolNo ? `${$t('route.business_consolidation')} - ${consolNo}` : $t('route.business_consolidation');
});

async function loadData(forceReload = false) {
  const pk = String(route.params.pk || '');
  const id = route.query.id as string;

  if (!forceReload && loadedPk.value === pk && inputData.value.id > 0) {
    return;
  }

  try {
    loadedPk.value = pk;

    if (pk && id) {
      const response = await consolidationGetById(id);
      const detailData = response.data || null;

      if (detailData) {
        inputData.value = {
          ...detailData,
          shipper: detailData.shipper || {},
          consignee: detailData.consignee || {},
          notify_party: detailData.notify_party || {},
          containers_list: detailData.containers_list || [],
          routing_list: detailData.routing_list || [],
          shipments: detailData.shipments || [],
          pk: detailData.jk_pk || pk,
          jk_pk: detailData.jk_pk || '',
          jk_uniqueconsignref: detailData.jk_uniqueconsignref || '',
          local_agent: detailData.local_agent || {},
          overseas_agent: detailData.overseas_agent || {}
        };

        if (inputData.value.jk_uniqueconsignref) {
          tabStore.setTabLabel(`${$t('route.business_consolidation')} - ${inputData.value.jk_uniqueconsignref}`);
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

onActivated(() => {
  const currentPk = String(route.params.pk || '');
  if (loadedPk.value !== currentPk) {
    loadData();
  }
});

async function handleSave() {
  try {
    saving.value = true;

    const saveData = {
      ...inputData.value,
      shipment_pks: inputData.value.shipments?.map((s: any) => s.pk) || []
    };

    let response;
    if (inputData.value.id && inputData.value.id > 0) {
      response = await consolidationUpdate(saveData);
    } else {
      response = await consolidationSave(saveData);
    }

    const data = response.data;
    if (data) {
      inputData.value.id = data.id ?? inputData.value.id;
      inputData.value.pk = data.pk ?? inputData.value.pk;

      // Handle attach/detach shipments
      if (refGeneralInfo.value) {
        const pendingAttach = refGeneralInfo.value.pendingAttachShipments || [];
        const pendingDetach = refGeneralInfo.value.pendingDetachShipments || [];

        if (pendingAttach.length > 0) {
          await consolidationAttachShipments({
            consol_pk: inputData.value.pk,
            shipment_pks: pendingAttach
          });
        }

        if (pendingDetach.length > 0) {
          await consolidationDetachShipments({
            consol_pk: inputData.value.pk,
            shipment_pks: pendingDetach
          });
        }

        // Clear pending lists
        pendingAttach.length = 0;
        pendingDetach.length = 0;
      }

      window.$message?.success($t('common.saveSuccess'));

      if (inputData.value.id > 0) {
        loadData(true);
      } else {
        router.push({
          name: 'business_consolidation-edite',
          params: { pk: data.pk },
          query: { id: data.id, con_unique_consign_ref: data.jk_uniqueconsignref }
        });
      }
    }
  } catch (error) {
    console.error('Save failed:', error);
    window.$message?.error('Save failed');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="p-16px">
    <NCard :title="tabTitle">
      <template #header-extra>
        <NButton type="primary" :loading="saving" :disabled="saving" @click="handleSave">
          {{ $t('common.save') }}
        </NButton>
      </template>
      <NTabs v-model:value="activedTab" type="line">
        <NTabPane :name="1" :tab="$t('page.business.consolidation.tab.details')">
          <NSkeleton v-if="skeletonLoading" text :row="18" />
          <TabGeneralInfo v-else ref="refGeneralInfo" :input-data="inputData" />
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
