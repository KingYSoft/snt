<script setup lang="ts">
import TransactionListPage from '../modules/transaction-list-page.vue';

defineOptions({ name: 'PageSettlementPayableTransactions' });
</script>

<template>
  <TransactionListPage type="payable" />
</template>
