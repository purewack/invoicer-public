<template>
    <v-card>
    <v-card-title>
        Select Categories for:
        {{ title }}
    </v-card-title>
    <v-card-text>
        <v-container>
        <v-row>
            <v-col cols="12">
            <v-checkbox
                v-for="category in _JobItemCategory"
                :key="category"
                v-model="selectedCategories"
                :label="capitalizeWords(category)"
                :value="category"
                color="primary"
            ></v-checkbox>
            </v-col>
        </v-row>
        </v-container>
    </v-card-text>
    <v-card-actions>
        <v-btn color="error" variant="text" @click="()=>{selectedCategories = []; $emit('close')}">Cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn 
        color="primary" 
        variant="flat"
        :disabled="!selectedCategories.length"
        @click.stop="()=>{$emit('select',selectedCategories)}"
        >
        Save
        </v-btn>
    </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
import { capitalizeWords } from '@shared/helpers';
import { _JobItemCategory, JobItemCategory } from '@shared/schema';
import { ref } from 'vue';

const {categories} = defineProps<{
    title: string,
    categories: JobItemCategory[]
}>()

const selectedCategories = ref([...categories]);

</script>