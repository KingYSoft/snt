<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { FormInst, FormItemRule } from 'naive-ui';
import { NButton, NForm, NFormItem, NInput, NModal, NSpace, NSpin } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { changePassword } from '@/service/api/user';
import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';

defineOptions({
  name: 'ChangePassword'
});

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

const authStore = useAuthStore();

const diaVis = computed({
  get: () => props.show,
  set: val => emit('update:show', val)
});

const formRef = ref<FormInst | null>(null);
const loading = ref(false);

const emptyForm = () => ({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const form = ref(emptyForm());

function requiredMin6(): FormItemRule {
  return {
    trigger: ['blur', 'input'],
    validator(_rule, value: string) {
      const v = String(value ?? '');
      if (!v) return new Error($t('form.pwd.required'));
      if (v.length < 6) return new Error($t('common.changePassword.minLength'));
      return true;
    }
  };
}

const rules = computed(() => ({
  oldPassword: requiredMin6(),
  newPassword: requiredMin6(),
  confirmPassword: {
    trigger: ['blur', 'input'],
    validator(_rule: unknown, value: string) {
      const v = String(value ?? '');
      if (!v) return new Error($t('form.confirmPwd.required'));
      if (v.length < 6) return new Error($t('common.changePassword.minLength'));
      if (v !== form.value.newPassword) return new Error($t('common.changePassword.mismatch'));
      return true;
    }
  } satisfies FormItemRule
}));

watch(diaVis, val => {
  if (val) {
    form.value = emptyForm();
    formRef.value?.restoreValidation();
  }
});

async function handleSave() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  loading.value = true;
  try {
    const { error } = await changePassword({
      oldPassword: form.value.oldPassword,
      newPassword: form.value.newPassword,
      confirmPassword: form.value.confirmPassword
    });
    if (error) return;
    window.$message?.success($t('common.changePassword.success'));
    diaVis.value = false;
    await authStore.resetStore();
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NModal
    v-model:show="diaVis"
    preset="card"
    style="width: 420px"
    :mask-closable="false"
    :auto-focus="false"
  >
    <template #header>
      <div class="flex items-center gap-8px">
        <SvgIcon icon="ph:lock" class="text-18px" />
        <span>{{ $t('common.changePassword.title') }}</span>
      </div>
    </template>

    <NSpin :show="loading">
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        :show-label="false"
        :show-require-mark="false"
      >
        <NFormItem path="oldPassword">
          <NInput
            v-model:value="form.oldPassword"
            type="password"
            show-password-on="click"
            :placeholder="$t('common.changePassword.oldPassword')"
            :input-props="{ autocomplete: 'current-password' }"
          />
        </NFormItem>
        <NFormItem path="newPassword">
          <NInput
            v-model:value="form.newPassword"
            type="password"
            show-password-on="click"
            :placeholder="$t('common.changePassword.newPassword')"
            :input-props="{ autocomplete: 'new-password' }"
          />
        </NFormItem>
        <NFormItem path="confirmPassword">
          <NInput
            v-model:value="form.confirmPassword"
            type="password"
            show-password-on="click"
            :placeholder="$t('common.changePassword.confirmNewPassword')"
            :input-props="{ autocomplete: 'new-password' }"
            @keydown.enter="handleSave"
          />
        </NFormItem>
      </NForm>
    </NSpin>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="diaVis = false">{{ $t('common.close') }}</NButton>
        <NButton type="primary" :loading="loading" @click="handleSave">{{ $t('common.save') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
