<script setup lang="ts">
import { useRoute } from 'vue-router';
import { $t } from '@/locales';
import GeneralInfoForm from '../organization/modules/general-info-form.vue';
import AddressSection from '../organization/modules/address-section.vue';
import ContactsSection from '../organization/modules/contacts-section.vue';
import { NButton } from 'naive-ui';
import { useOrganizationForm } from '@/composables/useOrganizationForm';

defineOptions({ name: 'PageMaintainOrganizationEdit' });

const route = useRoute();

const {
  loading,
  skeletonLoading,
  cardLoading,
  activedTab,
  inputData,
  inputDataRules,
  tabTitle,
  queryData,
  onSaveHandle,
  registerFormRefs
} = useOrganizationForm();

const pk = route.params.pk;
const id = route.query.id;

queryData(pk, id);
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header with title and save button -->
    <div class="flex items-center justify-between p-4 border-b">
      <h2 class="text-xl font-semibold">{{ tabTitle }}</h2>
      <NButton type="primary" :disabled="cardLoading" size="small" @click.stop="onSaveHandle">
        {{ $t('common.save') }}
      </NButton>
    </div>

    <!-- Main content -->
    <div class="flex-1 overflow-y-auto p-4">
      <NSpin :show="loading || skeletonLoading">
        <NTabs v-model:value="activedTab" type="line" animated>
          <NTabPane name="1" :tab="$t('page.maintain.organization.generalInfo')">
            <GeneralInfoForm
              v-model:form-data="inputData"
              :rules="inputDataRules"
              @register-form-refs="registerFormRefs"
            />
          </NTabPane>
          <NTabPane name="2" :tab="$t('page.maintain.organization.address')">
            <AddressSection v-model:addresses="inputData.addresses_list" />
          </NTabPane>
          <NTabPane name="3" :tab="$t('page.maintain.organization.contacts')">
            <ContactsSection v-model:contacts="inputData.contacts_list" />
          </NTabPane>
          <NTabPane name="4" tab="AR">
            <!-- AR content -->
          </NTabPane>
          <NTabPane name="5" tab="AP">
            <!-- AP content -->
          </NTabPane>
          <NTabPane name="6" tab="Staff Assignments">
            <!-- Staff Assignments content -->
          </NTabPane>
          <NTabPane name="9" tab="Logs">
            <!-- Logs content -->
          </NTabPane>
        </NTabs>
      </NSpin>
    </div>
  </div>
</template>

<style scoped>
.overflow-y-auto {
  overflow-y: auto;
}
</style>
