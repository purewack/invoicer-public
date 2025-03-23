<template>
    <v-list >
        <v-list-item v-for="cycle in cycles" :key="cycle.id">
        <v-divider v-if="cycles.length > 1" class="mb-2"/>
        <div class="d-flex flex-column flex-sm-row align-stretch align-sm-center ga-6 my-12 my-sm-0" :class="[
            $slots.item ? 'justify-space-between' : 'justify-center',
            $vuetify.display.smAndDown ? 'flex-wrap' : ''
        ]">
            <JobCycleSubView :cycle="cycle" :items="items"/>
        </div>
        </v-list-item>
    </v-list>
</template>

<script setup lang="ts">
import { toDateString } from '@shared/helpers';
import { Invoice, Job, JobCycle, JobItem } from '@shared/schema';
import JobCycleSubView from './JobCycleSubView.vue';

const props = defineProps<{cycles: JobCycle[], items:JobItem[]}>();

</script>