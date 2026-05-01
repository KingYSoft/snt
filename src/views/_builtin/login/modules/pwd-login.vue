<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { useFormRules } from '@/hooks/common/form';
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
  const { formRules } = useFormRules();

  return {
    email: formRules.email,
    password: formRules.pwd
  };
});

const formRef = ref(null);

const loading = computed(() => authStore.loginLoading);

const loginHandle = async () => {
  await authStore.login(model.email, model.password);
};

async function handleSubmit() {
  if (formRef.value) {
    const valid = true;
    if (valid) {
      await loginHandle();
    }
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
