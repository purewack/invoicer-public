<template>
    <v-row>
    <v-col cols="12" xl="6" v-if="email">
        <div class="text-subtitle-1">Email</div>
        <v-btn variant="text" size="small" @click="copyToClipboard(email, showSnackbar)">
        {{ email }}
        </v-btn>
        <v-btn variant="text" size="small" @click="openEmptyEmail(email)">
        <v-icon>mdi-email</v-icon>
        </v-btn>
    </v-col>
    <v-col cols="12" xl="6" v-if="phone">
        <div class="text-subtitle-1">Phone</div>
        <v-btn variant="text" size="small"  @click="copyToClipboard(phone, showSnackbar)">{{ phone || 'None' }}</v-btn>
        <v-btn variant="text" size="small" @click="openEmptySMS(phone)">
        <v-icon>mdi-message</v-icon>
        </v-btn>
        <v-btn variant="text" size="small" @click="openEmptyPhonecall(phone)">
        <v-icon>mdi-phone</v-icon>
        </v-btn>
    </v-col>
    </v-row>
</template>

<script setup lang="ts">
import { openEmptyEmail, openEmptyPhonecall, openEmptySMS } from '@/hooks';
import { copyToClipboard } from '@/hooks';
import { inject } from 'vue';

const showSnackbar = inject('snackbar') as (text: string, color: string)=>void;

defineProps<{
    email?: string,
    phone?: string
}>()
</script>