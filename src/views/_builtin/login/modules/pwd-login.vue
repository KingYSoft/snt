<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'PwdLogin'
});

const authStore = useAuthStore();
interface FormModel {
  email: string;
  password: string;
}

const model: FormModel = reactive({
  email: 'admin',
  password: ''
});

// Load saved email from localStorage if available
const savedEmail = localStorage.getItem('email');
if (savedEmail) {
  model.email = savedEmail;
}

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  const { formRules, createRequiredRule } = useFormRules();

  return {
    // 密码登录：账号仅必填，不做邮箱格式校验
    email: [createRequiredRule($t('form.email.required'))],
    password: formRules.pwd
  };
});

const { formRef, validate } = useNaiveForm();

const loading = computed(() => authStore.loginLoading);

const loginHandle = async () => {
  await authStore.login(model.email, model.password);
};

async function handleSubmit() {
  try {
    await validate();
    await loginHandle();
  } catch {
    // Naive UI 已展示校验错误
  }
}
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false" @submit.prevent="handleSubmit">
    <NFormItem path="email">
      <NInput v-model:value="model.email" clearable :placeholder="$t('form.email.placeholder')" />
    </NFormItem>
    <NFormItem path="password">
      <NInput
        v-model:value="model.password"
        type="password"
        show-password-on="click"
        :placeholder="$t('form.pwd.placeholder')"
      />
    </NFormItem>
    <NSpace vertical :size="24">
      <NButton type="primary" size="large" round block :loading="loading" @click="handleSubmit">
        {{ $t('common.confirm') }}
      </NButton>
    </NSpace>
  </NForm>
</template>

<style scoped></style>
