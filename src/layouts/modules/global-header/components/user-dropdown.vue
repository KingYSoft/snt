<script setup lang="ts">
import { ref } from 'vue';
import { useAppStore } from '@/store/modules/app';
import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import SwitchBranch from '@/components/business/switch-branch.vue';

defineOptions({
  name: 'UserDropdown'
});

const appStore = useAppStore();
const authStore = useAuthStore();

const showSwitchDialog = ref(false);

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
  window.$message?.info('Change password feature will be implemented soon');
}
</script>

<template>
  <NPopover placement="bottom-end" trigger="click" :width="300">
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
            {{ appStore.userSession.full_name }}
          </div>
          <div class="user-info-subtitle">
            {{ appStore.userSession.branch_code }} -
            {{ appStore.userSession.branch_name }}
          </div>
        </div>
      </div>

      <NDivider style="margin: 0" />

      <!-- Company info — matches sjc_vuetify default.vue -->
      <div class="dropdown-info-row">
        <SvgIcon icon="ph:building" class="info-icon" />
        <div>
          <div class="info-label">Company</div>
          <div class="info-value">
            {{ appStore.userSession.company_code }} -
            {{ appStore.userSession.company_name }}
          </div>
        </div>
      </div>

      <!-- Email info — matches sjc_vuetify default.vue -->
      <div class="dropdown-info-row">
        <SvgIcon icon="ph:envelope" class="info-icon" />
        <div>
          <div class="info-label">Email</div>
          <div class="info-value">
            {{ appStore.userSession.email_address }}
          </div>
        </div>
      </div>
      <!-- Actions -->
      <div class="dropdown-actions">
        <div class="dropdown-action-item" @click="showSwitchDialog = true">
          <SvgIcon icon="ph:building" class="info-icon" />
          <span>Switch Company / Branch</span>
        </div>
        <div class="dropdown-action-item" @click="changePassword">
          <SvgIcon icon="ph:lock" class="info-icon" />
          <span>Change Password</span>
        </div>
        <div class="dropdown-action-item logout-item" @click="logout">
          <SvgIcon icon="ph:sign-out" class="info-icon logout-icon" />
          <span>{{ $t('common.logout') }}</span>
        </div>
      </div>

      <SwitchBranch v-model:show="showSwitchDialog" />
    </div>
  </NPopover>
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

.dropdown-info-row {
  display: flex;
  align-items: flex-start;
  padding: 8px 16px;
  gap: 12px;
}

.info-icon {
  font-size: 18px;
  color: var(--n-text-color-3, #999);
  flex-shrink: 0;
  margin-top: 2px;
}

.info-label {
  font-size: 12px;
  color: var(--n-text-color-3, #bbb);
  margin-bottom: 2px;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
}

.dropdown-actions {
  padding: 4px 8px;
}

.dropdown-action-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
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
