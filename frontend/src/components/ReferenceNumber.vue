<template>
   <span>{{ getReferenceNumber(id, type) }}</span>
</template>

<script setup lang="ts">
import { getReferenceNumber, Job } from '@shared/schema';
const props = defineProps<{type: 'quote'|'invoice', id: string | Job}>();
</script>