<template>

    <v-card :loading="!job?.status">
      <v-window v-if="job.status" v-model="step" @vue:unmounted="finish">
        <!-- Step 1: Date Selection -->
        <v-window-item :value="1">
          <v-card-title class="headline d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-calendar</v-icon>
            Schedule Job Dates
          </v-card-title>
          <v-card-text>
            <v-checkbox v-model="showAlternativeDate" label="Add alternative date"></v-checkbox>
            <v-row>
              <v-col cols="12" :sm="showAlternativeDate && 6">
                <DatePickerField v-model="dateMain" @update:modelValue="onDatePickMain" allow-new />
              </v-col>
              <v-col v-if="showAlternativeDate" cols="12" sm="6">
                <DatePickerField v-model="dateAlt" @update:modelValue="onDatePickAlt" allow-new />
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
              @click="validateAndContinue"
            >
              Continue to Tasks
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </v-card-actions>
        </v-window-item>
  
        <!-- Step 2: Task Selection -->
        <v-window-item :value="2">
          <v-card-title class="headline d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-format-list-checks</v-icon>
            Select Job Tasks
          </v-card-title>
          <v-card-text>
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
                      <div class="d-flex align-center">
                        <v-icon class="mr-2">mdi-spray-bottle</v-icon>
                        <div class="d-flex flex-column">
                          <h2 :style="{ color: item.group_type === 'suggested' ? '#28559e' : 'inherit' }">
                          {{ item.group_type === 'suggested' ? ' ' : '' }}{{ item.title }}
                          </h2>
                          <p v-if="item.group_type === 'suggested'">✨Reccomended by us✨</p>
                        </div>
                        <v-spacer />
                        <v-btn
                        variant="outlined"
                        :color="jobCycles[item.cycle_months].color"
                        @click.stop.prevent="toggleCycle(item)"
                        size="small"
                        >
                        <v-icon>mdi-clock{{ !item.cycle_months ? '-outline' : '' }}</v-icon>
                        {{ jobCycles[item.cycle_months].text }} ({{ item.cycle_months }})
                        </v-btn>
                      </div>
                
                      <div class="mt-2 d-flex">
                      <!-- Unit/Initial Price -->
                      <span class="d-flex align-center">
                        <strong>{{ item.monthly_price !== undefined ? 'Initial:' : 'Price:' }}</strong>
                        <template v-if="editingPrice?.uuid === item.uuid && editingPrice?.field === 'unit_price'">
                            <v-text-field
                            v-model.number="item.unit_price"
                            type="number"
                            label="Price (£) *"
                            :rules="[v => !!v || 'Price is required']"
                            prefix="£"
                            step="5"
                            density="compact"
                            variant="outlined"
                            hide-details
                            class="d-inline-block price-field"
                            style="max-width: 150px;"
                            @blur="checkPrice"
                            @keyup.enter="checkPrice"
                            />
                        </template>
                        <span
                          v-else-if="item.unit_price !== undefined "
                          @click="editingPrice = {uuid: item.uuid, field: 'unit_price'}"
                          style="cursor: pointer"
                        >
                          {{ item.unit_price ? `£${item.unit_price}` : 'Invalid Price' }}
                        </span>
                      </span>

                      <!-- Monthly Price -->
                      <span v-if="item.monthly_price !== null" class="ml-4 d-flex align-center">
                        <strong v-if="item.monthly_price !== undefined">Monthly:</strong>
                        <template v-if="editingPrice?.uuid === item.uuid && editingPrice?.field === 'monthly_price'">
                          <v-text-field
                            v-model.number="item.monthly_price"
                            type="number"
                            label="Price (£) *"
                            :rules="[v => !!v || 'Price is required']"
                            prefix="£"
                            step="5"
                            density="compact"
                            variant="outlined"
                            hide-details
                            class="d-inline-block price-field"
                            style="max-width: 150px;"
                            @blur="checkPrice"
                            @keyup.enter="checkPrice"
                          />
                        </template>
                        <span
                          v-else-if="item.monthly_price !== undefined"
                          @click="editingPrice = {uuid: item.uuid, field: 'monthly_price'}"
                          style="cursor: pointer"
                        >
                          {{ item.monthly_price ? `£${item.monthly_price}` : 'Invalid Price' }}
                        </span>
                      </span>

                      <!-- Bi-Monthly Price -->
                      <span v-if="item.bimonthly_price !== null" class="ml-4 d-flex align-center">
                        <strong v-if="item.bimonthly_price !== undefined">Bi-Monthly:</strong>
                        <template v-if="editingPrice?.uuid === item.uuid && editingPrice?.field === 'bimonthly_price'">
                          <v-text-field
                          v-model.number="item.bimonthly_price"
                            type="number"
                            label="Price (£) *"
                            :rules="[v => !!v || 'Price is required']"
                            prefix="£"
                            step="5"
                            density="compact"
                            variant="outlined"
                            hide-details
                            class="d-inline-block price-field"
                            style="max-width: 150px;"
                            @blur="checkPrice"
                            @keyup.enter="checkPrice"
                          />
                        </template>
                        <span
                          v-else-if="item.bimonthly_price !== undefined"
                          @click="editingPrice = {uuid: item.uuid, field: 'bimonthly_price'}"
                          style="cursor: pointer"
                        >
                          {{ item.bimonthly_price ? `£${item.bimonthly_price}` : 'Invalid Price' }}
                        </span>
                      </span>
                    </div>
                    </template>
                </v-list-item>
            </v-list>
            <v-checkbox
              v-model="applyDiscountToItems"
              :label="`Apply ${job.deal_discount < 0 ? '£'+(-job.deal_discount) : job.deal_discount + '%'} discount`"
              class="ml-4"
              v-if="job.deal_discount && job.items.some((i)=>i.group_type === 'suggested')"
            />
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn variant="text" @click="step--">
              <v-icon start>mdi-arrow-left</v-icon>
              Back
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn 
              color="primary" 
              variant="flat" 
              :disabled="!itemsReady"
              @click="nextStep"
            >
              Continue to Confirm
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </v-card-actions>
        </v-window-item>
  
        <!-- Step 3: Confirmation & Messaging -->
        <v-window-item :value="3">
          <v-card-title class="headline d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-check-circle</v-icon>
            Confirm and Send
          </v-card-title>
          <v-card-text>
            <p class="text-subtitle-1 mb-4">
              Job will be arranged for: 
              <strong>{{ toDateString(dateMain) }}</strong>
              <template v-if="showAlternativeDate">
                <br/>Alternative date: <strong>{{ toDateString(dateAlt) }}</strong>
              </template>
            </p>
            <p class="text-subtitle-2">Selected Tasks: {{ selectedItems.length }}</p>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn v-if="job.status !== 'arranged'" variant="text" @click="step--">
              <v-icon start>mdi-arrow-left</v-icon>
              Back
            </v-btn>
            <v-spacer/>
            <v-btn color="success" variant="tonal">
              Continue
              <MessagingDataBar 
                :template="'quote-arrange'"
                :target="job" 
                @complete="onUpdateContactComplete"
              >       
                <template #sms-title>Send Arrangement SMS</template>
                <template #sms-body>
                  Confirm arrangement details via SMS
                </template>
                <template #email-title>Send Arrangement Email</template>
                <template #email-body>
                  Confirm arrangement details via email
                </template>
              </MessagingDataBar>
            </v-btn>
          </v-card-actions>
        </v-window-item>
  
        <!-- Step 4: Success -->
        <v-window-item :value="4">
          <v-card-text class="text-center pa-8">
            <p style="font-size: 5rem;" class="ok-icon">⏰</p>
            <h2 class="text-h4 mb-4">Job Arranged!</h2>
            <p class="text-subtitle-1">
              The job has been successfully arranged.
            </p>
            <p class="text-body-1 mb-6">
              Customer has been notified of the arrangement for:
              <br/>
              <strong>{{ toDateString(dateMain) }}</strong>
              <strong v-if="showAlternativeDate"><br/>and<br/>{{ toDateString(dateAlt) }}</strong>
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
import DatePickerField from '@/components/DatePicker.vue';
import JobView from '@/components/JobView.vue';
import { saveQuote, useUnsavedChanges } from '@/hooks';
import { JobController } from '@shared/api';
import { ContactLog, Job, jobCycles, JobItem, JobStatus, JobSummary } from '@shared/schema';
import { QuoteJob, JobItem as JobItemSchema } from '@shared/schema';
import { inject, Ref, ref, toRaw, watch, computed, onMounted, nextTick, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MessagingDataBar, { ContactStatusFlags } from '@/components/MessagingDataBar.vue';
import { adjustItemPrices, toDateString } from '@shared/helpers';

const showSnackbar = inject('snackbar') as (message:string, color:string)=>void
const appBarTitle = inject('appBarTitle') as Ref<string>
appBarTitle.value = 'Arrange Job'

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'complete', job: QuoteJob): void;
  (event: 'update:contact', flags: ContactStatusFlags): void;
}>();

const selectedItems = ref<string[]>([]);

watch(selectedItems, (_s)=>{
  applyDiscountToItems.value = _s.length === job.items.length
})

const job = reactive({} as QuoteJob)
const props = defineProps<{jobSummary: JobSummary}>()
JobController.getJobById(props.jobSummary.id).then(j => {
  Object.assign(job,j)
  job.dates = {... j.dates,
    cycles: j.dates?.cycles || [],
    cycle_start: j.dates.cycles?.[0] as Date || null, 
  }

  if (['new', 'requested', 'arranged','postponed','rejected'].includes(job.status)) {
      showSnackbar('Invalid job status - this quote cannot be arranged again.', 'warning');
      return emit('close')
  }

  if (job.dates?.cycles?.[0] ) {
      dateMain.value = new Date(job.dates?.cycles?.[0] as Date );
  }
  if (job.dates?.cycles?.[1] ) {
      dateAlt.value = new Date(job.dates?.cycles?.[1] as Date );
  }
  selectedItems.value = job.items
    // .filter(item => !item.omit)
    .map(item => item.uuid);

  console.log(job,selectedItems)
})


const step = ref(1);
onMounted(()=>{
  if(props.jobSummary.status === 'arranged' ){
    step.value = 3
  }
})

const showAlternativeDate = ref(true);
const dateMain = ref(new Date());
const dateAlt = ref(new Date(new Date().setDate(new Date().getDate() + 1)));


function toggleItemSelection(uuid: string) {
    if (selectedItems.value.includes(uuid)) {
        selectedItems.value = selectedItems.value.filter(item => item !== uuid);
    } else {
        selectedItems.value.push(uuid);
    }
}

// Toggle cycle function
function toggleCycle(item: JobItem) {
    if (item.monthly_price && item.bimonthly_price) {
        const cycleOptions = [1, 2];
        const currentIndex = cycleOptions.indexOf(item.cycle_months);
        const nextIndex = (currentIndex + 1) % cycleOptions.length;
        item.cycle_months = cycleOptions[nextIndex];
        return
    }
    const cycleOptions = [0, 1, 2, 6, 12];
    const currentIndex = cycleOptions.indexOf(item.cycle_months);
    const nextIndex = (currentIndex + 1) % cycleOptions.length;
    item.cycle_months = cycleOptions[nextIndex];
}




function onDatePickMain(value: Date) {
    job!.dates.cycles![0]  = value
}
function onDatePickAlt(value: Date) {
    job!.dates.cycles![1]  = value
}

function validateAndContinue() {
  const mainDate = new Date(dateMain.value);
  const altDate = new Date(dateAlt.value);

  mainDate.setHours(0, 0, 0, 0);
  altDate.setHours(0, 0, 0, 0);

  if (showAlternativeDate.value && mainDate.getTime() === altDate.getTime()) {
    showSnackbar('The main and alternative dates cannot be the same.', 'error');
    return;
  }

  step.value++;
}

function nextStep(){
  preFill()
  step.value += 1
}


function preFill(){
  let cycles: Date[] = []
  if(dateMain.value)
    cycles.push(dateMain.value)
  if(showAlternativeDate.value && dateAlt.value)
    cycles.push(dateAlt.value)

  Object.assign(job,{
      ...toRaw(job),
      dates: { 
        cycles,
        cycle_start: null
      },
  } as QuoteJob);
}

const previewJob = computed(()=>{
  return {...job, items: job.items.map(i => selectedItems.value.includes(i.uuid) ? i : null).filter(i => i !== null)}
})


async function onUpdateContactComplete(flags: ContactStatusFlags){
  preFill()
  nextTick(async ()=>{
    job.status = 'arranged'
    job.items = job.items.filter(i => selectedItems.value.includes(i.uuid))
    job.metadata.discount_applied = applyDiscountToItems.value
    await saveQuote(job!)
    emit('update:contact', flags)
    nextStep()
  })
}

function finish(){
  console.log("ending")  
  if(job.status === 'arranged') {
    emit('complete', job)
  }
  emit('close')  
}

const editingPrice = ref<{uuid: string, field: 'unit_price' | 'monthly_price' | 'bimonthly_price'} | null>(null);

const checkPrice = (item: JobItem) => {
  editingPrice.value = null;
};

const itemsReady = computed(() => {
  return selectedItems.value.length > 0 && selectedItems.value.every(uuid => {
    const item = job.items.find(item => item.uuid === uuid);
    return item && 
      !isNaN(item.unit_price) && item.unit_price > 0 &&
      (item.monthly_price === null || item.monthly_price === undefined || (!isNaN(item.monthly_price) && item.monthly_price > 0)) &&
      (item.bimonthly_price === null || item.bimonthly_price === undefined || (!isNaN(item.bimonthly_price) && item.bimonthly_price > 0));
  });
}); 


const applyDiscountToItems = ref(false);

// Watch for changes and update item prices accordingly
watch(applyDiscountToItems, (_v) => {
  if (_v) {
    // Apply discount to items
    const adjusted = adjustItemPrices(job);
    job.items = adjusted
    console.log({adjusted})
  } else {
    // Restore original prices (if you store them)
    const restore = job.items.map(i => ({
      ...i,
      unit_price: i.original_price ?? i.unit_price
    }));
    job.items = restore
  }
}, { deep: true });
</script>

<style scoped>
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