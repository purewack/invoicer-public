<script setup lang="ts">
import { Job } from '@shared/schema';
import ContactHistory from './ContactHistory.vue';
import { openEmptyEmail, openEmptyPhonecall, openEmptySMS } from '@/hooks';
defineProps<{job: Job}>()
</script>

<template>
    <v-dialog max-width="700px" activator="parent">
    <template #default="{isActive}">
        <v-card scrollable>
            <template #text>
                <ContactHistory color="secondary" variant="outlined" :contacts="job.contact"/>
            </template>
            <template #actions>
                <v-btn @click="isActive.value = false">Back</v-btn>
                <v-spacer/>
                <template v-if="job.customer?.phone">
                <v-btn @click="openEmptyPhonecall(job.customer.phone)"><v-icon icon="mdi-phone"/>Call</v-btn>
                <v-btn @click="openEmptySMS(job.customer.phone)"><v-icon icon="mdi-message"/>SMS</v-btn>
                </template>
                <v-btn v-if="job.customer?.email" @click="openEmptyEmail(job.customer.email)"><v-icon icon="mdi-email"/>Email</v-btn>
            </template>
        </v-card>
    </template>
    </v-dialog>
</template>