<template>
    <div class="d-flex flex-column flex-wrap ga-2" >
        <div>
            <v-icon v-if="getDaysDiffTo(cycle.date) > 0" :color="'secondary'">mdi-clock </v-icon>
            <v-icon v-else-if="cycle.invoice_id" :color="(cycle.completion_date) ? 'success' : 'info'">{{ (cycle.payment_date) ? 'mdi-check' : 'mdi-invoice'}} </v-icon>
            <v-icon class="mr-1" :color="(cycle.completion_date) ? 'success' : 'primary'">{{ cycle.payment_date ? 'mdi-cash' : 'mdi-water-outline'}}</v-icon>
            <b>{{ toDateString(cycle.date) }}</b> <b v-if="cycle.time"> - {{ (cycle.time) }}</b>
        </div>
        <div class="d-flex ga-2 flex-wrap ">
        <v-chip :color="(cycle.completion_date) ? 'success' : 'primary'" v-for="workId in cycle.items">
            {{ items!.find(item=>item.uuid === workId)?.title }}
        </v-chip>
        </div>
    </div>
</template>

<script setup lang="ts">
import { getDaysDiffTo, toDateString } from '@shared/helpers';
import { JobCycle, JobItem } from '@shared/schema';

defineProps<{
    cycle: JobCycle,
    items: JobItem[]
}>()
</script>