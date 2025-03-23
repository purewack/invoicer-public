<template>
    <v-card :loading="job === null">
      <v-window v-if="job.status" v-model="step" @vue:before-unmount="finish(false)">
        <!-- Step 1: Date Selection -->
        <v-window-item :value="1">
          <v-card-title class="headline d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-calendar</v-icon>
            Schedule Start of Job
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols=12>
                <p class="text-subtitle-1 mb-4">Select a start date for the job:</p>
              </v-col>
              <v-col cols="12">
                <v-radio-group v-model="selectedDateOption">
                  <v-radio v-if="mainDate"
                    :label="`Main Date - ${mainDate}`"
                    :value="'main'"
                    :disabled="mainDate && isDaysPast(mainDate) || false"
                  ></v-radio>
                  <v-radio
                    v-if="altDate"
                    :label="`Alt. Date - ${altDate}`"
                    :value="'alt'"
                    :disabled="altDate && isDaysPast(altDate) || false"
                  ></v-radio>
                  <v-radio
                    label="Custom Date"
                    :value="'custom'"
                  ></v-radio>
                </v-radio-group>
                <DatePicker 
                  v-if="selectedDateOption === 'custom'" 
                  v-model="customDate" 
                  @update:modelValue="onNewAltDate" 
                  allow-new
                />
              </v-col>
              <v-col cols="12">
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
            </v-row>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn variant="text" @click="$emit('close')">Cancel</v-btn>
            <v-spacer></v-spacer>
            <v-btn 
              color="primary" 
              variant="flat" 
              :disabled="!isDateValid"
              @click="toMessaging"
            >
              Continue
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </v-card-actions>
        </v-window-item>
  
        <!-- Step 2: Messaging -->
        <v-window-item :value="2">
          <v-card-title class="headline d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-message-text</v-icon>
            Send Notifications
          </v-card-title>
          <v-card-text>
            <p class="text-subtitle-1 mb-4">
              Job will start on: <strong>{{ selectedDateFormatted }}</strong>
              <strong v-if="includeTime"> at: {{ nextJobTime }}</strong>
            </p>
            <p>Please send confirmation to the customer:</p>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn variant="text" @click="step--" v-if="!(jobSummary.contacted.email.confirmed || jobSummary.contacted.sms.confirmed)">
              <v-icon start>mdi-arrow-left</v-icon>
              Back
            </v-btn>
            <v-spacer></v-spacer>
            
            <v-btn color="success" variant="tonal">
              Continue
              <MessagingDataBar 
                :template="'quote-activate'"
                :target="computedJob" 
                @complete="onUpdateContactComplete"
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
  
        <!-- Step 3: Success -->
        <v-window-item :value="3">
          <v-card-text class="text-center pa-8">
            <p style="font-size: 5rem;" class="ok-icon">🥳</p>
            <h2 class="text-h4 mb-4">All Ready !</h2>
            <p class="text-subtitle-1">
              The job has been successfully marked as confirmed.
            </p>
            <p class="text-body-1 mb-6">
              Customer has been notified and the job start date is:<br/>  
              <strong>{{ selectedDateFormatted }}</strong>
              <strong v-if="includeTime"> at: {{ nextJobTime }}</strong>
            </p>
            <v-btn 
              color="primary" 
              variant="flat" 
              block 
              @click="finish"
            >
              Done
            </v-btn>
          </v-card-text>
        </v-window-item>
      </v-window>
    </v-card>
  </template>

<script setup lang="ts">
import { ref, defineProps, inject, computed, watch, onMounted, reactive, toRaw, nextTick } from "vue";
import { Job, JobCycle, JobSummary, QuoteJob} from "@shared/schema"
import { getUID, isDaysPast, isDaysPastWithToday, isDaysToCome, toDateString } from "@shared/helpers";
import { JobController } from "@shared/api";
import { saveQuote } from "@/hooks";
import DatePicker from "@/components/DatePicker.vue";
import MessagingDataBar, { ContactStatusFlags } from "@/components/MessagingDataBar.vue";

const showSnackbar = inject('snackbar') as (message:string, color:string)=>void

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'complete', job: QuoteJob): void;
  (event: 'update:contact', flags: ContactStatusFlags): void;
}>();

const step = ref(1);

const nextJobTime = ref('09:00');
const includeTime = ref(true);

const job = reactive({} as QuoteJob)
const props = defineProps<{jobSummary: JobSummary}>()

JobController.getJobById(props.jobSummary.id).then(j => {
  Object.assign(job, {...j,
      dates: {... j.dates,
          cycles: [],
          cycle_start: j.dates.cycles![0]
      }
  } as Partial<Job>)
})

if(!props.jobSummary?.dates || !props.jobSummary.dates?.cycles?.length){
    showSnackbar('Error with arrangement dates','error')
    emit('close')
}

let startDayOption = 'custom'
console.log(props.jobSummary.dates.cycles)
if(props.jobSummary.dates?.cycles?.[0] && isDaysToCome(props.jobSummary.dates.cycles[0] as string) )
  startDayOption = 'main'
else if(props.jobSummary.dates?.cycles?.[1] && isDaysToCome(props.jobSummary.dates.cycles[1] as string) )
  startDayOption = 'alt'

let startDayValue = new Date()
if(startDayOption === 'main')
  startDayValue = (props.jobSummary.dates!.cycles[0] as Date)
if(startDayOption === 'alt')
  startDayValue = (props.jobSummary.dates!.cycles[1] as Date)

const selectedDateOption = ref(startDayOption);
const customDate = ref<Date>(new Date());
const mainDate = ref(props.jobSummary.dates?.cycles?.[0] ? toDateString(props.jobSummary.dates.cycles[0] as Date ) : '')
const altDate = ref(props.jobSummary.dates?.cycles?.[1]  ? toDateString(props.jobSummary.dates.cycles[1] as Date) : '')
const selectedDate = ref<Date>(startDayValue)

console.log(mainDate,altDate)

function selectDate(){
  let cycleStartDate: Date | null = null;
  if (selectedDateOption.value === "main") {
      cycleStartDate = props.jobSummary.dates.cycles?.[0]! as Date;
  } else if (selectedDateOption.value === "alt") {
      cycleStartDate = props.jobSummary.dates.cycles?.[1]! as Date;
  } else if (selectedDateOption.value === "custom") {
      cycleStartDate = customDate.value;
  }

  if (!cycleStartDate) {
      showSnackbar('Please select a valid date','warning')
      return;
  }
  selectedDate.value = cycleStartDate
}

function onNewAltDate(date: Date){
    customDate.value = date
    selectDate()
}

watch(selectedDateOption, (opt)=>{
  selectDate()
})

const isDateValid = computed(() => {
  if (selectedDateOption.value === 'custom') {
    return customDate.value !== null;
  }
  return true;
});

const selectedDateFormatted = computed(() => {
  if (!selectedDate.value) return '';
  return toDateString(selectedDate.value);
});

function toMessaging(){
  step.value = 2;
  job.dates.cycle_start = selectedDate.value
}

async function endCommsSection(){
  step.value = 3
  job.status = 'confirmed'
}

onMounted(()=>{
  if(props.jobSummary.dates?.cycle_start){
    step.value = 2
  }
})

const computedCycle = computed(()=>{
  return {
    date: selectedDate.value,
    time: includeTime.value ? nextJobTime.value : undefined,
    items: job.items.map(i => i.uuid),
    job_id: job.id
  } as Partial<JobCycle>
})

const computedJob = computed(()=>{
  let start = new Date(selectedDate.value)
  const time = includeTime.value ? nextJobTime.value.split(':') : ['0','0']
  start.setHours(parseInt(time[0]),parseInt(time[1]))
  return {
    ...job,
    cycles: [computedCycle.value]
  } as Job
})

function preFill(){
  let cycleStartDate: Date | null = null;
  if (selectedDateOption.value === "main") {
      cycleStartDate = props.jobSummary.dates.cycles?.[0]! as Date;
  } else if (selectedDateOption.value === "alt") {
      cycleStartDate = props.jobSummary.dates.cycles?.[1]! as Date;
  } else if (selectedDateOption.value === "custom") {
      cycleStartDate = customDate.value;
  }

  if (!cycleStartDate) {
      showSnackbar('Please select a valid date','warning')
      return;
  }

  Object.assign(job,{
    ...toRaw(job),
    dates: { 
      ...job.dates,
      cycle_start: cycleStartDate
    }
  } as QuoteJob);
}



async function onUpdateContactComplete(flags: ContactStatusFlags){
  preFill()
  nextTick(async ()=>{
    const newCycle = computedCycle.value
    const c = await JobController.addCycle(newCycle)
    
    job.status = isDaysPastWithToday(selectedDate.value) ? 'ongoing' : 'confirmed'
    job.cycles = [c]
    await saveQuote(job!)
    emit('update:contact', flags)
    showSnackbar('Saved ok','success')
    step.value = 3
  })
}

function finish(complete=true){
  console.log("ending")  
  if(complete)
    emit('complete', job)
  emit('close')  
}
</script>

<style scoped>
.v-window {
  border-radius: inherit;
}
.v-window-item {
  padding: 16px;
}

.ok-icon{
    position: relative;
    animation: rotatePulse 1.5s alternate infinite ease-in-out;
    transform-origin: bottom;
}

@keyframes rotatePulse {
    0%{
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
