<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';
import { $t } from '@/locales';
import UserDropdown from './user-dropdown.vue';

defineOptions({
  name: 'UserAvatar'
});

const authStore = useAuthStore();
const { toLogin } = useRouterPush();

const isLoggedIn = computed(() => authStore.isLogin);

function loginOrRegister() {
  toLogin();
}
</script>

<template>
  <NButton v-if="!isLoggedIn" quaternary @click="loginOrRegister">
    {{ $t('page.login.common.loginOrRegister') }}
  </NButton>
  <UserDropdown v-else />
</template>

<style scoped></style>
