<template>
  <v-container class="pa-4">
    <v-row>
      <v-col ref="scrollTopElement">
        <v-card>
          <v-card-title class="d-flex flex-wrap align-center justify-space-between">
            <div class="d-flex flex-column">
              <h1 class="ml-4">
                <v-icon color="blue">mdi-water</v-icon>Jobs</h1> 
              <v-card-subtitle class="text-wrap">Manage available quotes and ongoing jobs here</v-card-subtitle>
            </div>
            <div class="d-flex flex-wrap flex-md-column  align-end">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn variant="text" v-bind="props" class="text-h6">
                  {{ poolTypeToName(pool.type) }}
                  <v-icon end>mdi-menu-down</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  v-for="status in fetchableJobTypes"
                  :key="status"
                  @click="setJobType(status)"
                >
                  <v-list-item-title>
                    <span class="text-capitalize">{{ fetchableJobTypesToName(status) }}</span>
                  </v-list-item-title>
                </v-list-item>
                <v-divider class="my-1" />
                <v-list-item @click="setJobType(undefined)">
                  <v-list-item-title>
                    <span>All Jobs</span>
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            <ul class="d-flex  ga-2 capitalize text-right">
              <template v-for="state in jobStates">
                <v-chip
                  v-if="jobGroupCounts[state]"
                  class="cursor-pointer"
                  :color="
                    (state === 'fresh' && 'info') ||
                    (state === 'planning' && 'warning') ||
                    (state === 'active' && 'success') ||
                    ''
                  "
                  @click="setJobType(state)"
                >
                  {{ jobGroupCounts[state] }} {{ state }}
                </v-chip>
              </template>
            </ul>
          </div>
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-if="pool.data.items?.length"
        v-for="job in pool.data.items"
        :key="job.id + job.updated_at"
        cols="12"
        lg="6"
      >
        <SlideIn v-slot="animProps" :skip="highlightedJob === job.id ">
          <v-card
            class="mb-6"
            elevation="1"
            :prepend-icon="!job.site_residential ? 'mdi-office-building' : 'mdi-account'"
            :id="`job_card_${job.id}`"
            @click="cardClick(job)"
            :class="[
              animProps.class,
              highlightedJob === job.id && 'show-change',
              ['new','postponed','reviewing'].includes(job.status) && 'fresh-job'
            ]"
            :style="{
              border: job?.metadata?.imported && 'dashed lightblue 2px',
            }"
            :color="isScheduledJob(job) && !getScheduledJob(job)?.invoice_id ? 'primary' : undefined"
            :variant="isScheduledJob(job) && !getScheduledJob(job)?.invoice_id ? 'tonal' : undefined"
          >
            <template v-slot:title>
              <div class="d-flex align-center flex-wrap justify-space-between">
                <div class="d-flex flex-column ga-2">
                  <span>{{ job.site_line_one }}</span>
                  <v-card-subtitle>
                    <strong>{{ job.client_name }}</strong>
                    <br />
                    {{ job.site_city }} - {{ !job.site_residential ? 'Commercial' : 'Residential' }}
                  </v-card-subtitle>
                </div>
                <v-spacer />
                <div class="mb-2 d-flex flex-grow-1 flex-column align-end ga-2">
                  <v-chip v-if="job.status === 'concluded'" color="error" class="mt-2">
                    <v-icon class="mr-2">mdi-cancel</v-icon>
                    Job Ended
                  </v-chip>

                  <template v-else>
                    <v-chip v-if="job.status === 'reviewing'" color="warning" class="mt-2">
                      <v-icon left>mdi-book</v-icon>
                      Unfinished Review
                    </v-chip>

                    <v-chip v-if="job.status === 'confirmed'" color="purple" class="text-center">
                      Awaiting Job Start day: <b class="ml-1">{{ toDateString(job.dates.cycle_start!) }}</b>
                    </v-chip>
                    <template v-else-if="job.status === 'ongoing'">
                      <v-chip v-if="isScheduledJob(job) && !getScheduledJob(job)?.invoice_id" color="purple" class="text-center">
                        Awaiting Next Cycle
                      </v-chip>
                      <!-- <v-chip color="success" class="text-center">
                        Cycles confirmed on: <b class="ml-1">{{ toDateString(job.dates.cycle_start!) }}</b>
                      </v-chip> -->
                    </template>
                    <template v-else>
                      <v-chip v-if="job.status === 'arranged'" :color="'blue-darken-4'" small>
                        <v-icon small class="mr-1">mdi-calendar</v-icon>
                        <span>Contacted: <b class="ml-1">{{ toDateString(job.updated_at) }}</b></span>
                      </v-chip>
                      <v-chip v-else :color="'orange-darken-4'" small>
                        <v-icon small class="mr-1">mdi-calendar</v-icon>
                        <span>Requested: <b class="ml-1">{{ toDateString(job.updated_at) }}</b></span>
                      </v-chip>
                    </template>
                    <v-label class="ml-2">{{ getReferenceNumber(job.id, ['arranged', 'ready', 'ongoing', 'complete'].includes(job.status) ? 'job' : 'quote') }}</v-label>
                  </template>
                </div>
              </div>
            </template>

            <v-card-text v-if="!['concluded'].includes(job.status)">
              <div v-if="job?.metadata?.imported" class="text-center">
                <h3>Imported Job</h3>
              </div>
              <JobCycleSummary
                v-if="getUpcomingCycles(job).length"
                :cycles="getUpcomingCycles(job)"
                :items="(job.items as JobItem[])"
              ></JobCycleSummary>
              <v-stepper
                v-else-if="!job?.metadata?.imported && !['rejected'].includes(job.status)"
                elevation="0"
                :model-value="getTimelineConfig(job).currentStep + 1"
              >
                <v-stepper-header>
                  <template v-for="(step, index) in timelineSteps" :key="step">
                    <v-stepper-item
                      :value="index + 1"
                      :complete="getTimelineConfig(job).isStepComplete(index)"
                      :color="getTimelineConfig(job).getStepColor(index)"
                    >
                      <div class="d-flex flex-column align-center">
                        <p class="capitalize">
                          {{ getTimelineConfig(job).getStepLabel(step) }}
                        </p>
                        <div class="d-flex">
                          <v-icon
                            v-if="job.contacted.email[getTimelineConfig(job).getCommsLabel(step)]"
                            color="green"
                            class="mr-2"
                          >
                            mdi-email-check
                          </v-icon>
                          <v-icon v-else color="grey" class="mr-2">
                            mdi-email-outline
                          </v-icon>
                          <v-icon
                            v-if="job.contacted.sms[getTimelineConfig(job).getCommsLabel(step)]"
                            color="green"
                          >
                            mdi-message-check
                          </v-icon>
                          <v-icon v-else color="grey">
                            mdi-message-outline
                          </v-icon>
                          <v-icon
                            v-if="job.contacted.other[getTimelineConfig(job).getCommsLabel(step)]"
                            color="green"
                          >
                            mdi-phone
                          </v-icon>
                        </div>
                      </div>
                    </v-stepper-item>
                    <v-divider v-if="index < timelineSteps.length - 1" :key="`divider-${index}`" />
                  </template>
                </v-stepper-header>
              </v-stepper>

              <div class="d-flex justify-center mt-2">
                <v-chip
                  v-if="['postponed', 'rejected'].includes(job.status)"
                  :color="job.status === 'rejected' ? 'error' : 'warning'"
                  class="mt-2"
                >
                  <v-icon left>{{ job.status === 'rejected' ? 'mdi-alert-circle' : 'mdi-clock' }}</v-icon>
                  {{ job.status === 'rejected' ? 'Rejected' : 'Postponed' }}
                </v-chip>
                <v-chip v-else-if="job.status === 'arranged'" color="blue">
                  Planned for
                  <b class="ml-1 mr-1">{{ toDateString(job.dates.cycles[0]! as Date) }}</b>
                  {{ job.dates.cycles?.[1] && ' -or- ' }}
                  <b v-if="job.dates.cycles?.[1]" class="ml-1 mr-1">{{ toDateString(job.dates.cycles[1] as Date) }}</b>
                </v-chip>
              </div>
            </v-card-text>
            <v-card-actions class="justify-end">
              <v-label>
                <v-icon class="mr-2">mdi-pencil-box-outline</v-icon> {{ toDateString(job.updated_at) }} ({{ getDaysAgoText(job.updated_at) }})
              </v-label>

              <v-spacer />
              <v-btn v-if="job.status === 'reviewing'" variant="tonal" color="primary" @click.stop.prevent="reviewJob(job)">
                Review Quote
                <v-icon end icon="mdi-magnify"></v-icon>
              </v-btn>
              <v-btn v-else-if="job.status === 'rejected'" color="error" variant="plain" @click.stop.prevent="endJob(job)">
                <v-icon icon="mdi-delete-outline"></v-icon>Delete Customer Details
              </v-btn>

              <template v-else-if="job.status === 'reviewed'">
                <v-btn @click.stop="reviewJob(job)">
                  Review
                  <v-icon end icon="mdi-pencil-plus-outline"></v-icon>
                </v-btn>
                <v-dialog max-width="600px">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" variant="tonal" color="warning">
                      Plan
                      <v-icon end icon="mdi-clock-outline"></v-icon>
                    </v-btn>
                  </template>
                  <template #default="{ isActive }">
                    <ArrangeJob
                      :job-summary="job"
                      @complete="(updatedJob) => onJobStatusComplete(job, updatedJob)"
                      @update:contact="(flags) => onJobFlagsUpdate(job, 'arranged', flags)"
                      @close="isActive.value = false"
                    />
                  </template>
                </v-dialog>
              </template>

              <v-dialog v-else-if="job.status === 'arranged'" max-width="600px">
                <template #activator="{ props }">
                  <v-btn v-bind="props" variant="tonal" color="success">
                    Start
                    <v-icon end icon="mdi-check"></v-icon>
                  </v-btn>
                </template>
                <template #default="{ isActive }">
                  <ActivateJob
                    :job-summary="job"
                    @complete="(updatedJob) => onJobStatusComplete(job, updatedJob)"
                    @update:contact="(flags) => onJobFlagsUpdate(job, 'confirmed', flags)"
                    @close="isActive.value = false"
                  />
                </template>
              </v-dialog>

              <v-icon v-if="['new','postponed'].includes(job.status)" size="x-large" color="warning">mdi-new-box</v-icon>
            </v-card-actions>
          </v-card>
        </SlideIn>
      </v-col>
      <v-col v-else>
        No jobs found matching the current filter.
      </v-col>
    </v-row>
    <v-row v-if="pool.data.pagination.totalPages >= 2">
      <v-col>
        <v-card>
          <v-pagination
            :total-visible="1"
            v-model="currentPage"
            :length="pool.data.pagination.totalPages"
            @update:model-value="onPageChange"
          ></v-pagination>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { JobController } from "@shared/api";
import { capitalizeWords, getDaysAgoText, getDaysDiffTo, toDateString } from '@shared/helpers';
import { getReferenceNumber, JobItem, JobSummary, SchemaCollection } from '@shared/schema';
import ActivateJob from "@/modal-pages/ActivateJob.vue"
import ArrangeJob from '@/modal-pages/ArrangeJob.vue';
import { ContactStatusFlags } from './MessagingDataBar.vue';
import { getScheduledJob, isScheduledJob } from '@/hooks';
import SlideIn from '@/wrappers/SlideIn.vue';
import JobCycleSummary from './JobCycleSummary.vue';

const router = useRouter();
const route = useRoute();

// --- Constants ---
const pageSize = 5;
const fetchableJobTypes = ['fresh', 'planning', 'active'] as const;
const jobStates = ['fresh', 'planning', 'active'] as const;

type FilterStatus = typeof fetchableJobTypes[number] | undefined;

// --- Reactive State ---
const pool = reactive({
  data: {
    items: [],
    pagination: {
      currentPage: 1,
      pageSize: pageSize,
      totalItems: 0,
      totalPages: 0
    }
  } as SchemaCollection<JobSummary>,
  type: undefined as FilterStatus,
});

const jobGroupCounts = reactive({
  fresh: 0,
  planning: 0,
  active: 0,
});

const currentPage = ref(1);
const highlightedJob = ref<string | null>(null);

// --- Computed Properties ---
const hasJobs = computed(() => pool.data.items && pool.data.items.length > 0);

// --- Methods ---
const fetchableJobTypesToName = (status?: FilterStatus) => {
  if (status === 'fresh') return 'To Be Reviewed';
  else if (status === 'planning') return 'Need Planning';
  else if (status === 'active') return "Ready";
  return 'All Jobs';
};

const setJobType = async (status?: FilterStatus) => {
  pool.type = status;
  currentPage.value = 1; // Reset to first page when changing type
  await fetchJobs();
};

const poolTypeToName = (typeStr: FilterStatus)=>{
  return capitalizeWords(typeStr || 'All Jobs')
  // switch(type){
  //   case 'fresh':
  // }
}

const fetchJobs = async (page: number = 1) => {
  currentPage.value = page;
  let query = undefined;

  if (pool.type === 'fresh')
    query = JobController.queryStatusFresh;
  else if (pool.type === 'planning')
    query = JobController.queryStatusPlanning;
  else if (pool.type === 'active')
    query = JobController.queryStatusActive;

  const data = await JobController.getJobs(page, pageSize, query);
  Object.assign(pool.data, data);
};

const reviewJob = (job: JobSummary)=>{
  router.push({
    name: 'quote-review', params: {id: job.id}
  })
}

const editJob = (job: JobSummary)=>{
  router.push({
    name: 'job', params: {id: job.id}
  })
}

const cardClick = (job: JobSummary) => {
  if (['reviewing', 'postponed'].includes(job.status)) {
    reviewJob(job)
  }
  else {
    editJob(job)
  }
};

const endJob = (job: JobSummary) => {
  console.warn("will delete", job);
};

const scrollToJob = async (jobId: string) => {
  highlightedJob.value = jobId;
  await nextTick();

  const element = document.getElementById(`job_card_${jobId}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

const onPageChange = async (page: number) => {
  await fetchJobs(page);
};


function onJobStatusComplete(job: JobSummary, updates: any) {
  job.status = updates.status;
  job.dates = updates.dates;
  console.log("updated");
}

function onJobFlagsUpdate(job: JobSummary, status: 'reviewed' | 'arranged' | 'confirmed', flags: ContactStatusFlags) {
  job.contacted.email[status] = flags.email !== 'skip';
  job.contacted.sms[status] = flags.sms !== 'skip';
  job.contacted.other[status] = flags.other !== 'skip';
}

const timelineSteps = ['reviewed', 'arranged', 'ongoing'] as const;
const getTimelineConfig = (job: JobSummary) => {
  // Map status to step index
  const statusToIndex = {
    'postponed': 0,
    'reviewing': 0,
    'reviewed': 1,
    'arranging': 1,
    'arranged': 2,
    'starting': 2,
    'confirmed': 2,
    'ongoing': 2
  } as const;

  const stepIndex = statusToIndex[job.status as keyof typeof statusToIndex] ?? 0;

  // Get the dynamic label based on status
  const getStepLabel = (step: string) => {
    switch (step) {
      case 'reviewed':
        if (job.status === 'postponed') return 'postponed';
        return job.status === 'reviewing' ? 'reviewing' : 'reviewed';
      case 'arranged':
        if (job.status === 'reviewed')
          return 'planning'
        return 'planned';
      case 'ongoing':
        if (job.status === 'arranged')
          return 'time to start'
        return 'ongoing';
      case 'concluded':
        if (job.status === 'arranged')
          return 'completed'
        return 'ongoing';
      default:
        return step;
    }
  };

  // Get the dynamic label based on status
  const getCommsLabel = (step: string) => {
    switch (step) {
      case 'reviewing':
      case 'reviewed':
        return 'reviewed'
      case 'ongoing':
      case 'confirmed':
        return 'confirmed'
      case 'arranged':
        return 'arranged'
      default:
        return 'reviewed';
    }
  };

  // Get step color
  const getStepColor = (index: number) => {
    // if (job.status === 'postponed') return 'warning';
    // if (job.status === 'reviewing' && id >= 0) return 'secondary';
    if (job.status === 'confirmed' && index === 2) return 'primary';
    if (job.status === 'ongoing' && index === 2) return 'success';
    if (stepIndex <= index) return 'secondary';
    return 'success';
  };

  // Determine if a step is complete based on status
  const isStepComplete = (index: number) => {
    if (job.status === 'ongoing' && index === 2) return true;
    return index <= stepIndex - 1;
  };

  return {
    currentStep: stepIndex,
    getStepColor,
    getStepLabel,
    getCommsLabel,
    isStepComplete
  };
};

function getUpcomingCycles(job: JobSummary){
  return job.cycles.filter(c => getDaysDiffTo(c.date) <= 4)
}

// --- Lifecycle Hooks ---
onMounted(async () => {
  // Fetch initial data
  await fetchJobs();

  // Fetch job counts
  const counts = await JobController.countJobStates();
  Object.assign(jobGroupCounts, counts);

  // Check for showJob in route params
  const showJob = route.query.showJob as string;
  if (showJob) {
    // Find the page containing the job
    let page = 1;
    while (page <= pool.data.pagination.totalPages) {
      const tempJobs = await JobController.getJobs(page, pageSize);
      if (tempJobs.items.find((job) => job.id === showJob)) {
        break; // Found the page
      }
      page++;
    }

    // Navigate to the correct page and scroll
    await fetchJobs(page);
    scrollToJob(showJob);
  }
});


watch(()=>route.query, (_q)=>{
  if(_q?.filter && ['fresh','planning','active'].includes(_q.filter as string) && _q.tab === 'jobs'){
    pool.type = _q.filter as 'fresh' | 'planning'|'active'
    fetchJobs()
  }
  if(_q?.highlight?.includes('JOB')){
    const id = _q?.highlight as string
    router.replace({query: {
      highlight: undefined,
    }})
    highlightedJob.value = id
    setTimeout(()=>{
      highlightedJob.value = null
    },2000)
    console.log("HIGHLIGh", id)
  }
},{deep: true, immediate:true})

</script>

<style scoped>
.v-card {
  margin-bottom: 24px;
}

.fresh-job {
  border: 2px gold solid;
}
</style>