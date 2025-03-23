<template>
    <v-dialog activator="parent" max-width="500px">
        
        <template #default="{ isActive }">
            <v-card>
            <v-window v-model="modalStep">
                <!-- Step 1: Confirm Cancel -->
                <v-window-item :value="1">
                <v-card-title class="d-flex align-center">
                    <v-icon color="warning" class="mr-2">mdi-flag</v-icon>
                    Confirm Start
                </v-card-title>
                <v-card-text>
                    <p class="text-body-1">Are you sure you want to start this job early?</p>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="isActive.value = false">Close</v-btn>
                    <v-btn 
                    color="warning" 
                    variant="tonal" 
                    @click="()=>{
                        if(!job.dates?.cycle_start || !job.dates?.cycles?.length){
                            job.dates!.cycle_start = new Date()
                        }
                        if(!job.dates?.cycles || !job.dates?.cycles?.length){
                            job.dates!.cycles = [] 
                        }
                        modalStep = 2;
                    }"
                    >
                    Continue
                    <v-icon end>mdi-arrow-right</v-icon>
                    </v-btn>
                </v-card-actions>
                </v-window-item>

                <v-window-item :value="2" >
                <v-card-title class="d-flex align-center">
                    <v-icon color="primary" class="mr-2">mdi-calendar</v-icon>
                    Start Date
                </v-card-title>
                <v-card-text>
                    <p class="text-body-1 mb-4">Pick a date when the job {{props.import ? 'was' : 'will be'}} confirmed</p>
                    <DatePicker :model-value="startDate" :allow-old="props.import" :allow-new="!props.import"
                    @update:model-value="(v:any)=>{
                        startDate = v; 
                    }"/>
                </v-card-text>
                <v-card-actions>
                    <v-btn 
                    text 
                    @click="modalStep = 1"
                    >
                    <v-icon start>mdi-arrow-left</v-icon>
                    Back
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn 
                    color="primary" 
                    variant="tonal" 
                    @click="()=>{
                        modalStep = 3;
                    }"
                    >
                    Continue
                    <v-icon end>mdi-arrow-right</v-icon>
                    </v-btn>
                </v-card-actions>
                </v-window-item>

                <!-- Step 2: Notify Client -->
                <v-window-item :value="3">
                <v-card-title class="d-flex align-center">
                    <v-icon color="primary" class="mr-2">mdi-bell-outline</v-icon>
                    Notify Client
                </v-card-title>
                <v-card-text>
                    <p class="text-body-1 mb-4">Notify client about starting early</p>
                </v-card-text>
                <v-card-actions>
                    <v-btn 
                    text 
                    @click="modalStep = 1"
                    >
                    <v-icon start>mdi-arrow-left</v-icon>
                    Back
                    </v-btn>
                    <v-spacer></v-spacer>

                    <v-spacer/>
                    <v-btn v-if="isDaysToComeAfterToday(startDate)"
                        variant="tonal"
                        color="success"
                    >
                        Contact
                        <v-icon >mdi-arrow-right</v-icon>
                        <MessagingDataBar
                            :template="'quote-early'"
                            :target="job"
                            @save="$emit('save', startDate)" 
                            @complete="$emit('complete', $event);"
                        />
                        
                    </v-btn>

                    <v-btn v-else
                        variant="tonal"
                        color="warning"
                        @click="$emit('save', startDate); $emit('complete', {email: 'skip', sms:'skip', other:'skip'}); isActive.value = false;"
                    >
                        <v-icon >mdi-content-save</v-icon>
                        Save
                    </v-btn>
                </v-card-actions>
                </v-window-item>

            </v-window>
            </v-card>
        </template>
    </v-dialog>
</template>

<script setup lang="ts">
import { Job } from '@shared/schema';
import { ref, watch } from 'vue';
import MessagingDataBar from './MessagingDataBar.vue';
import {ContactStatusFlags} from './MessagingDataBar.vue';
import DatePicker from './DatePicker.vue';
import { getDaysDiffTo, isDaysPast, isDaysToCome, isDaysToComeAfterToday } from '@shared/helpers';

const emit = defineEmits<{
    (e: 'save', date: Date): void
    (e: 'complete', flags: ContactStatusFlags): void
}>();

const startDate = ref(new Date())

const props = defineProps<{
    job: Partial<Job>,
    import: boolean
}>()

const modalStep = ref(1)
</script>