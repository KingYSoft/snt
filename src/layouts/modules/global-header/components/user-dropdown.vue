<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppStore } from '@/store/modules/app';
import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import SwitchBranch from '@/components/business/switch-branch.vue';
import ChangePassword from '@/components/business/change-password.vue';

defineOptions({
  name: 'UserDropdown'
});

const appStore = useAppStore();
const authStore = useAuthStore();

const showSwitchDialog = ref(false);
const showChangePasswordDialog = ref(false);
const showPopover = ref(false);

const session = computed(() => appStore.userSession);
const displayName = computed(() => session.value.full_name || session.value.login_name || '');
const branchText = computed(() =>
  [session.value.branch_code, session.value.branch_name].filter(Boolean).join(' - ')
);
const companyText = computed(() =>
  [session.value.company_code, session.value.company_name].filter(Boolean).join(' - ')
);
const emailText = computed(() => session.value.email_address || '');

function logout() {
  window.$dialog?.info({
    title: $t('common.tip'),
    content: $t('common.logoutConfirm'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      await authStore.resetStore();
    }
  });
}

function changePassword() {
  showPopover.value = false;
  showChangePasswordDialog.value = true;
}

function openSwitchDialog() {
  showPopover.value = false;
  showSwitchDialog.value = true;
}
</script>

<template>
  <NPopover v-model:show="showPopover" placement="bottom-end" trigger="click" :width="300">
    <template #trigger>
      <div class="cursor-pointer">
        <NAvatar :style="{ backgroundColor: '#074684', color: 'white' }" :size="32" class="user-avatar">
          <span class="user-avatar-text">{{ appStore.userInitials }}</span>
        </NAvatar>
      </div>
    </template>

    <div class="user-dropdown-panel">
      <!-- User info: name + branch — matches sjc_vuetify default.vue -->
      <div class="dropdown-user-section">
        <NAvatar :style="{ backgroundColor: '#074684', color: 'white' }" :size="40">
          <span class="user-avatar-text-large">{{ appStore.userInitials }}</span>
        </NAvatar>
        <div class="user-info-content">
          <div class="user-info-title">
            {{ displayName }}
          </div>
          <div v-if="branchText" class="user-info-subtitle">
            {{ branchText }}
          </div>
        </div>
      </div>

      <NDivider style="margin: 0" />

      <div class="dropdown-actions">
        <div class="dropdown-info-item">
          <SvgIcon icon="ph:building" class="info-icon" />
          <span class="info-text">{{ $t('common.company') }} {{ companyText || '—' }}</span>
        </div>
        <div class="dropdown-info-item">
          <SvgIcon icon="ph:envelope" class="info-icon" />
          <span class="info-text">{{ $t('page.system.user.email') }} {{ emailText || '—' }}</span>
        </div>

        <NDivider style="margin: 4px 0" />

        <div class="dropdown-action-item" @click="openSwitchDialog">
          <SvgIcon icon="ph:building" class="info-icon" />
          <span>{{ $t('common.switchBranch.title') }}</span>
        </div>
        <div class="dropdown-action-item" @click="changePassword">
          <SvgIcon icon="ph:lock" class="info-icon" />
          <span>{{ $t('common.changePassword.title') }}</span>
        </div>
        <div class="dropdown-action-item logout-item" @click="logout">
          <SvgIcon icon="ph:sign-out" class="info-icon logout-icon" />
          <span>{{ $t('common.logout') }}</span>
        </div>
      </div>
    </div>
  </NPopover>
  <SwitchBranch v-model:show="showSwitchDialog" />
  <ChangePassword v-model:show="showChangePasswordDialog" />
</template>

<style scoped>
.user-avatar {
  transition: transform 0.2s ease;
}

.user-avatar:hover {
  transform: scale(1.05);
}

.user-avatar-text {
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

.user-avatar-text-large {
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
}

.user-dropdown-panel {
  padding: 4px 0;
}

.dropdown-user-section {
  display: flex;
  align-items: center;
  padding: 12px 16px;
}

.user-info-content {
  flex: 1;
  margin-left: 12px;
  overflow: hidden;
}

.user-info-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-info-subtitle {
  font-size: 13px;
  color: var(--n-text-color-3, #999);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-actions {
  padding: 4px 8px;
}

.dropdown-info-item,
.dropdown-action-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
}

.info-icon {
  font-size: 18px;
  color: var(--n-text-color-3, #999);
  flex-shrink: 0;
}

.info-text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-action-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dropdown-action-item:hover {
  background-color: var(--n-color-hover, rgba(0, 0, 0, 0.04));
}

.logout-item {
  color: #ef4444;
}

.logout-icon {
  color: #ef4444;
}
</style>
