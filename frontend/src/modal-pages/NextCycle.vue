<template>
    <v-dialog activator="parent" max-width="800">
        <template #default="{isActive}">
            <v-card >
        <v-window  v-model="step" @vue:unmounted="finish" @vue:mounted="step = 0">
            <!-- Step 1: Date Selection -->
            <v-window-item :value="1">
            <v-card-title class="headline d-flex align-center">
                <v-icon color="primary" class="mr-2">mdi-calendar</v-icon>
                Schedule Next Job Date
            </v-card-title>
            <v-card-text>
                <v-row>
                <v-col cols="12" sm="6">
                    <h2>Arrangement</h2>
                    <DatePickerField allow-new v-model="nextJobDate" @update:modelValue="onJobTimePick" />
                    <v-checkbox
                      v-model="includeTime"
                      label="Include specific time"
                      class="mt-4"
                    ></v-checkbox>
                    <v-text-field
                      v-if="includeTime"
                      v-model="nextJobTime"
                      type="time"
                      label="Time"
                      class="mt-2"
                      :rules="[
                      (value: string) => {
                          if (!value) return true;
                          const [hours, minutes] = value.split(':').map(Number);
                          if (hours < 6 || hours > 18) {
                          return 'Time must be between 06:00 and 18:00';
                          }
                          return true;
                      },
                      ]"
                    ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <h2>Items</h2>
                <v-list>
                <v-list-item
                        v-for="(item, index) in job.items"
                        :key="item.uuid"
                        :value="item.uuid"
                        class="mb-2 py-4 job-item"
                        :ripple="false"
                    >
                        <template #prepend>
                        <v-checkbox
                            v-model="selectedItems"
                            :value="item.uuid"
                            color="primary"
                            hide-details
                            class="mr-2"
                            @click.stop
                        />
                        </template>
                        <template #default>
                        <div class="d-flex align-center" >
                            <v-icon class="mr-2">mdi-spray-bottle</v-icon>
                            <p>
                            {{ item.title }}
                            </p>
                            <v-spacer/>
                            <v-chip color="primary" >
                            <v-icon>mdi-clock{{ !item.cycle_months ? '-outline' : '' }}</v-icon>
                            <!-- <span class="mr-2" v-if="$vuetify.display.mdAndUp">{{ jobCycles[item.cycle_months].text }} </span> -->
                            <span>({{ item.cycle_months }})</span>
                            </v-chip>
                        </div>
                        </template>
                    </v-list-item>
                </v-list>
                </v-col>
                </v-row>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-btn variant="text" @click="isActive.value = false">Cancel</v-btn>
                <v-spacer></v-spacer>
                <v-btn 
                color="primary" 
                variant="flat" 
                @click="validateAndContinue"
                :disabled="!itemsReady"
                >
                Next
                <v-icon end>mdi-arrow-right</v-icon>
                </v-btn>
            </v-card-actions>
            </v-window-item>
    
            <!-- Step 2: Confirmation -->
            <v-window-item :value="2">
            <v-card-title class="headline d-flex align-center">
                <v-icon color="primary" class="mr-2">mdi-check-circle</v-icon>
                Confirm Next Job
            </v-card-title>
            <v-card-text>
                <p class="text-subtitle-1 mb-4">
                Next job will be scheduled for: 
                <strong>{{ formattedNextJobDate }}</strong>
                </p>
                <p class="text-subtitle-2">Selected Tasks: {{ selectedItems.length }}</p>
                <v-list v-if="selectedItems.length > 0" class="mt-4">
                    <v-list-item
                        v-for="item in selectedJobItems"
                        :key="item.uuid"
                        class="mb-2"
                    >
                        <template #prepend>
                            <v-icon>mdi-check</v-icon>
                        </template>
                        <v-list-item-title>{{ item.title }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-btn variant="text" @click="step--">
                <v-icon start>mdi-arrow-left</v-icon>
                Back
                </v-btn>
                <v-spacer/>
                <v-btn 
                    color="success" 
                    variant="tonal"
                    @click="finaliseJob"
                    >
                    Confirm
                    <MessagingDataBar 
                        :template="'quote-work-notify'"
                        :target="computedJob" 
                        @complete="confirmNextJob"
                    >       
                        <template #sms-title>SMS Generated</template>
                        <template #sms-body>
                        An arrangement offer <b>sms</b> will open
                        </template>
                        <template #email-title>Email Generated</template>
                        <template #email-body>
                        An arrangement offer <b>email</b> will be automatically sent
                        </template>
                    </MessagingDataBar>
                </v-btn>
            </v-card-actions>
            </v-window-item>
    
            <!-- Step 4: Success -->
            <v-window-item :value="3">
            <v-card-text class="text-center pa-8">
                <p style="font-size: 5rem;" class="ok-icon">⏰</p>
                <h2 class="text-h4 mb-4">Next Job Scheduled!</h2>
                <p class="text-subtitle-1">
                The next job has been successfully scheduled.
                </p>
                <p class="text-body-1 mb-6">
                Scheduled for:
                <br/>
                <strong>{{ formattedNextJobDate }}</strong>
                </p>
                <v-btn 
                color="primary" 
                variant="flat" 
                block 
                @click="finish(); isActive.value = false"
                >
                Done
                </v-btn>
            </v-card-text>
            </v-window-item>
        </v-window>
        </v-card>
        </template>
    </v-dialog>
</template>

<script setup lang="ts">
import DatePickerField from '@/components/DatePicker.vue';
import { JobController } from '@shared/api';
import { Job, JobCycle, jobCycles, JobItem } from '@shared/schema';
import { inject, Ref, ref, toRaw, computed, onMounted, watchEffect } from 'vue';
import { getUID, toDateString } from '@shared/helpers';
import MessagingDataBar from '@/components/MessagingDataBar.vue';

const showSnackbar = inject('snackbar') as (message:string, color:string)=>void
const appBarTitle = inject('appBarTitle') as Ref<string>
appBarTitle.value = 'Schedule Next Job'

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'complete', cycles: JobCycle[]): void;
}>();

const props = defineProps<{
  job: Job
}>();

const step = ref(1);
const nextJobDate = ref(new Date());
const nextJobTime = ref('09:00');
const includeTime = ref(true);
const selectedItems = ref<string[]>(props.job.items.filter(i => i.cycle_months).map(item => item.uuid));


const formattedNextJobDate = computed(() => {
  if (!nextJobDate.value) return '';
  
  const dateStr = toDateString(nextJobDate.value);
  if (includeTime.value && nextJobTime.value) {
    return `${dateStr} at ${nextJobTime.value}`;
  }
  return dateStr;
});

const selectedJobItems = computed(() => {
  return props.job.items?.filter(item => selectedItems.value.includes(item.uuid)) || [];
});

const itemsReady = computed(() => {
  return selectedItems.value.length > 0;
});

function onJobTimePick(value: Date) {
  nextJobDate.value = value;
}

function validateAndContinue() {
  if (!nextJobDate.value) {
    showSnackbar('Please select a date for the next job', 'error');
    return;
  }
  
  step.value++;
}

function nextStep() {
  step.value++;
}

async function confirmNextJob() {
  try {
    // Create the cycle entry
    const cycleEntry = {
      date: nextJobDate.value,
      time: includeTime.value ? nextJobTime.value : undefined,
      items: selectedItems.value,
      job_id: props.job.id
    } as Partial<JobCycle>;
    // Update the job with the new cycle
    const c = await JobController.addCycle(cycleEntry);
    
    step.value++;
    emit('complete',[...props.job.cycles, c].sort((a,b)=>(new Date(a.date)).getTime() - (new Date(b.date)).getTime()))
  } catch (error:any) {
    showSnackbar('Failed to schedule next job: ' + error.message, 'error');
  }
}

const computedJob = ref(JSON.parse(JSON.stringify({...props.job})))
const finaliseJob = ()=>{
  const newCycle = {
    date: nextJobDate.value,
    time: includeTime.value ? nextJobTime.value : undefined,
    items: selectedItems.value
  }
  const newData = {
      ...props.job,
      newCycle
  } as Partial<Job>
  computedJob.value = newData
  console.log("COMP",newData)
}

function finish() {
  emit('close');
}
</script>

<style scoped>
/* Keep your existing styles */
.v-window {
  border-radius: inherit;
}
.v-window-item {
  padding: 16px;
}

.ok-icon {
  position: relative;
  animation: rotatePulse 1.5s alternate infinite ease-in-out;
  transform-origin: bottom;
}

@keyframes rotatePulse {
  0% {
    transform: scale(1) rotate(-5deg);
  }
  50% {
    transform: scale(1.1) rotate(0);
  }
  100% {
    transform: scale(1) rotate(5deg);
  }
}
</style>