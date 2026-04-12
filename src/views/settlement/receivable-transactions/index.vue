<script setup lang="ts">
import TransactionListPage from '../modules/transaction-list-page.vue';

defineOptions({ name: 'PageSettlementReceivableTransactions' });
</script>

<template>
  <TransactionListPage type="receivable" />
</template>
