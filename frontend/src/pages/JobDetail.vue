<template>
    <v-container max-width="800" v-if="job?.status">
        <v-row>
            <v-col cols="12" v-if="['ongoing','confirmed'].includes(job.status)">
                <v-card>
                    <v-card-title class="d-flex flex-column flex-sm-row ga-4 justify-space-between align-center flex-wrap">
                        <h2><v-icon>mdi-clock</v-icon> Scheduled Work</h2>

                        <v-card :variant="'tonal'" :color="'primary'" @click="()=>{}">
                            <template #prepend>
                                <v-icon class="mr-1">mdi-plus</v-icon>
                            </template>
                            <template #title>
                                New
                                <v-card-subtitle>Plan new cycle</v-card-subtitle>
                            </template>
                            <NextCycle :job="job" @complete="handleNextComplete"/>
                        </v-card>
                    </v-card-title>
                    <v-card-text v-if="isScheduledJob(job)" >
                        <JobCycleList 
                        :job="job"
                        @update:item-delete="deleteCycle"
                        @edit="editCycle"
                        >
                            <template #item="{scheduledItem}" >
                                <v-card v-if="!scheduledItem.invoice_id"
                                variant="tonal" :color="isScheduledJob(job) && !isDaysToComeAfterToday(scheduledItem.date) ? 'primary' : 'secondary'" 
                                @click="()=>$router.push({
                                    name:'invoice-issue', 
                                    params: {
                                        jobId: job.id
                                    },
                                    query: {
                                        items: scheduledItem.items.join(','),
                                        cycle: scheduledItem.id
                                    }
                                })">
                                    <v-card-title>
                                        <v-icon class="mr-1">mdi-cash-100</v-icon>
                                        Mark Complete
                                    </v-card-title>
                                    <v-card-text>
                                        Issue an invoice for this cycle work.
                                        <br/>
                                        This will mark this work as complete.
                                    </v-card-text>
                                </v-card>

                                
                                <v-card v-else-if="job.payments"
                                    @click="()=>{
                                        if(scheduledItem.invoice_id) 
                                            $router.push({
                                                name:'invoice-preview', 
                                                params: {
                                                    invoiceId: scheduledItem.invoice_id
                                                },
                                                query: {
                                                    cycle: scheduledItem.id
                                                }
                                            })
                                    }"
                                    variant="tonal"
                                    :color="job.payments.find(i => i.id === scheduledItem.invoice_id)?.paid ? 'success' 
                                    : job.payments.find(i => i.id === scheduledItem.invoice_id)?.overdue ? 'error' : 'warning'"
                                    >
                                    <v-card-title>
                                        <v-icon class="mr-1">mdi-cash-100</v-icon>
                                        Work Done
                                    </v-card-title>
                                    <v-card-text>
                                        This invoice {{ job.payments.find(i => i.id === scheduledItem.invoice_id)?.paid ? 'is' : 'is not' }} paid
                                    </v-card-text>
                                    
                                </v-card>
                            </template>
                        </JobCycleList>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-card>
                    <v-card-title>
                        <h2 ><v-icon color="primary">mdi-tune</v-icon> {{ job.site_address.line_one }} </h2>
                    </v-card-title>
                    <v-card-text>
                        <p class="mb-8">
                            This Job is for {{ job.customer.name }} at {{ job.site_address.line_one }} (#{{ getReferenceNumber(job.id,'job') }})
                            <span v-if="job.dates.cycle_start">originally confirmed on {{ toDateString(job.dates.cycle_start) }}</span>
                        </p>
                        <div class="d-flex flex-wrap flex-column-reverse flex-sm-row  justify-space-around ga-2 align-stretch">
                          
                            <v-card v-if="job.status === 'concluded'" :variant="'tonal'" color="error" @click="()=>{}">
                                <v-card-title>
                                    <v-icon class="mr-1">mdi-delete</v-icon>
                                    Delete
                                </v-card-title>
                                <v-card-text>
                                    Delete this file completely
                                    
                                </v-card-text>

                                <v-dialog  max-width="500px" activator="parent">
                                    <template #default="{ isActive }">
                                        <v-card>
                                        <v-window v-model="modalStep">
                                            <!-- Step 1: Confirm Cancel -->
                                            <v-window-item :value="1">
                                            <v-card-title class="d-flex align-center">
                                                <v-icon color="error" class="mr-2">mdi-delete-outline</v-icon>
                                                Confirm Deletion
                                            </v-card-title>
                                            <v-card-text>
                                                <p class="text-body-1">Are you sure you want to delete this job? This action cannot be undone.</p>
                                            </v-card-text>
                                            <v-card-actions>
                                                <v-spacer></v-spacer>
                                                <v-btn text @click="isActive.value = false">Back</v-btn>
                                               
                                                <v-btn variant="tonal" color="error" @click="deleteJob">
                                                    Delete <v-icon class="ml-2">mdi-delete</v-icon>
                                                </v-btn>
                                            </v-card-actions>
                                            </v-window-item>
                                        </v-window>
                                        </v-card>
                                    </template>
                                </v-dialog>
                            </v-card>

                            <v-card  v-if="_EarlyJobTypes.includes(job.status)"  color="warning" variant="tonal" @click="()=>{}">
                                <v-card-title>
                                    <v-icon>
                                        mdi-flag
                                    </v-icon>
                                    Start Early
                                </v-card-title>
                                <v-card-text>
                                    Change the start date or,<br/>
                                    start job now
                                </v-card-text>
                                <StartEarly 
                                    v-if="true || ['confirmed','arranged'].includes(job.status)"
                                    :job="job"
                                    :import="false"
                                    @update:contact="handleEarlyContact"
                                    @complete="handleEarlyComplete"
                                />
                            </v-card>

                            <v-card  v-if="_QuotablejobTypes.includes(job.status)"  color="success" variant="tonal"
                            :to="{name:'quote-review', params:{id: job.id}}">
                                <v-card-title>
                                    <v-icon>
                                        mdi-magnify
                                    </v-icon>
                                    Review Quote
                                </v-card-title>
                                <v-card-text>
                                    Review this quote
                                </v-card-text>
                            </v-card>

                            <v-card color="warning" variant="tonal" @click="()=>{}">
                                <v-card-title>
                                    <v-icon>
                                        mdi-history
                                    </v-icon>
                                    History
                                </v-card-title>
                                <v-card-text>See the edits log.</v-card-text>
                                <v-dialog max-width="700px" activator="parent">
                                    <template #default="{isActive}">
                                        <v-card>
                                            <v-card-text>
                                                <v-list v-if="job.history?.length">
                                                    <h1>Edit History</h1>
                                                    <template v-for="(item, index) in (job.history as HistoryJobItem[]).sort((a, b) => (new Date(b.date)).getTime() - (new Date(a.date)).getTime())" :key="index">
                                                    <v-list-item class="my-1">
                                                    <v-list-item-title><v-chip color="success" class="mb-2">{{ toDateString(item.date) }}</v-chip>  </v-list-item-title>
                                                    <ul class="ml-6">
                                                        
                                                        <li v-for="change in item.changes">
                                                            <p v-if="change.startsWith('Status')"><v-icon class="mr-1" color="purple">mdi-update</v-icon> {{ change }}</p>
                                                            <p v-else-if="change.startsWith('Number of ')" ><v-icon class="mr-1" color="green">mdi-spray-bottle</v-icon> {{ change }}</p>
                                                            <p v-else ><v-icon class="mr-1" color="blue">mdi-water</v-icon> {{ change }}</p>
                                                        </li>

                                                        <!-- <li v-for="jobItem in item.job_items">
                                                            <v-icon color="blue">mdi-spray-bottle</v-icon> {{ jobItem.title }}
                                                            <br/>
                                                            <v-icon color="green">mdi-cash</v-icon>
                                                            <template v-if="Array.isArray(jobItem.price)">
                                                                Initial: £{{ jobItem.price[0] }}, 
                                                                Monthly: £{{ jobItem.price[1] }}, 
                                                                Bimonthly: £{{ jobItem.price[2] }}
                                                            </template>
                                                            <template v-else>
                                                                £{{ jobItem.price }}
                                                            </template>
                                                        </li> -->
                                                    </ul>
                                                    </v-list-item>
                                                    <v-divider v-if="index !== job.history.length - 1" />
                                                    </template>
                                                </v-list>
                                                <div v-else class="text-center">No history available</div>
                                                
                                            </v-card-text>
                                            <template #actions>
                                                <v-btn @click="isActive.value = false">Back</v-btn>
                                            </template>
                                        </v-card>
                                    </template>
                                </v-dialog>
                            </v-card>
                            
                            <v-card color="info" variant="tonal" @click="()=>{}">
                                <v-card-title>
                                    <v-icon>
                                        mdi-phone
                                    </v-icon>
                                    Contact
                                </v-card-title>
                                <v-card-text>See the contact log.</v-card-text>
                                <ContactLogDialogue :job="job"/>
                            </v-card>
                        </div>
                    </v-card-text>
                    <v-card-actions>
                            <!-- <v-col  cols="6" class="text-right">
                                <v-bottom-sheet v-if="!['new','reviewing','reviewed','concluded'].includes(job.status)">
                                    <template v-slot:activator="{ props: sheetProps }">
                                    <v-btn v-bind="sheetProps" variant="plain" >
                                        Other
                                    </v-btn>
                                    </template>
                                    <template v-slot:default="{isActive: sheetActive}">
                                    <v-sheet>
                                    <v-card class="text-center">
                                    
                                        <v-card-text>
                                        <p>These options have the potential to remove data, be careful and think about if your choice is correct.</p>
                                        <br />
                                        <div class="d-flex ga-4 justify-center">
                                        <v-btn @click="sheetActive.value = false" variant="flat">
                                            <v-icon left>mdi-arrow-left</v-icon>
                                            Back
                                        </v-btn>
                                        </div>
                                        </v-card-text>
                                    </v-card>
                                    </v-sheet>
                                    </template>
                                </v-bottom-sheet>
                            </v-col> -->
                            <v-spacer/>
                            
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-expansion-panels flat>
                    <v-expansion-panel >
                        <template #title>

                            <v-btn variant="flat" @click="$router.back()">
                    <v-icon>mdi-arrow-left</v-icon>
                        Back
                    </v-btn>
                    <v-spacer/>
                    <v-label>
                        Click to see Job Details
                    </v-label>
                        </template>
                        <template #text>
                            <JobView v-if="job" :job="job" editable hide-total
                                @click:item="jobItemClick"
                                @click:customer="jobDetailsClick"
                                @click:address="jobAddressClick"/>

                            <v-card v-if="_UpdatableJobTypes.includes(job.status)" class="mt-4" :variant="'tonal'" color="error" @click="()=>{}">
                                <v-card-title>
                                    <v-icon class="mr-1">mdi-cancel</v-icon>
                                    End
                                </v-card-title>
                                <v-card-text>
                                    Stop working for this client
                                    
                                </v-card-text>

                                <v-dialog  max-width="500px" activator="parent">
                                    <template #default="{ isActive }">
                                        <v-card>
                                        <v-window v-model="modalStep">
                                            <!-- Step 1: Confirm Cancel -->
                                            <v-window-item :value="1">
                                            <v-card-title class="d-flex align-center">
                                                <v-icon color="error" class="mr-2">mdi-delete-outline</v-icon>
                                                Confirm Cancellation
                                            </v-card-title>
                                            <v-card-text>
                                                <p class="text-body-1">Are you sure you want to end this job? This action cannot be undone.</p>
                                                <p class="text-caption mt-4">You can send a notification to the client before the job is concluded.</p>
                                            </v-card-text>
                                            <v-card-actions>
                                                <v-spacer></v-spacer>
                                                <v-btn text @click="isActive.value = false">Close</v-btn>
                                                <v-btn 
                                                color="error" 
                                                variant="tonal" 
                                                @click="modalStep = 2"
                                                >
                                                Continue
                                                <v-icon end>mdi-arrow-right</v-icon>
                                                </v-btn>
                                            </v-card-actions>
                                            </v-window-item>

                                            <!-- Step 2: Notify Client -->
                                            <v-window-item :value="2">
                                            <v-card-title class="d-flex align-center">
                                                <v-icon color="primary" class="mr-2">mdi-bell-outline</v-icon>
                                                Notify Client
                                            </v-card-title>
                                            <v-card-text>
                                                <p class="text-body-1 mb-4">After ending, some information will be stored</p>
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
                                                <v-btn variant="tonal" color="warning">
                                                    Continue <v-icon class="ml-2">mdi-send</v-icon>
                                                    <MessagingDataBar
                                                    :template="'quote-conclude'"
                                                    :target="job" 
                                                    @close="isActive.value = false;"
                                                    @complete="handleCancelComplete(); isActive.value = false;"
                                                    />
                                                </v-btn>
                                            </v-card-actions>
                                            </v-window-item>
                                        </v-window>
                                        </v-card>
                                    </template>
                                </v-dialog>
                            </v-card>

                            </template> 
                        </v-expansion-panel>
                        
                </v-expansion-panels>
                
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import {_EarlyJobTypes, _InvoicableJobTypes, _QuotablejobTypes, _UpdatableJobTypes, ContactLog, getReferenceNumber, HistoryJobItem, Job, JobCycle, JobPayment, QuoteJob} from "@shared/schema"
import {JobController} from "@shared/api"
import JobView from "@/components/JobView.vue"
import { inject, ref, onMounted, Ref, computed, toRaw } from "vue"
import {useRoute, useRouter} from "vue-router"
import { getScheduledJob, getScheduledJobs, isScheduledJob, openEmptyEmail, openEmptyPhonecall, openEmptySMS } from '@/hooks';
import MessagingDataBar from '@/components/MessagingDataBar.vue';
import { isDaysPast, isDaysToCome, isDaysToComeAfterToday, toDateString } from "@shared/helpers"
import StartEarly from "@/components/StartEarly.vue"
import ContactHistory from "@/components/ContactHistory.vue"
import NextCycle from "@/modal-pages/NextCycle.vue"
import JobCycleList from "@/components/JobCycleList.vue"
import ContactLogDialogue from "@/components/ContactLogDialogue.vue"
import { shades } from "vuetify/util/colors"

const appBarTitle = inject('appBarTitle') as Ref<string>
appBarTitle.value = 'Job Details ...'

const showSnackbar = inject('snackbar') as (text:string, color:string)=>void

const router = useRouter()
const route = useRoute()

type PaidJob = Job & {payments: JobPayment[]};
const job = ref<PaidJob>({} as PaidJob)
onMounted(async ()=>{
    try{
        // setTimeout(async () => {
        const j = await JobController.getJobById(route.params?.id as string, true)
        const p = await JobController.getJobPayments(j)
        job.value = {...j, payments: p} as PaidJob
        if(_QuotablejobTypes.includes(job.value.status)){
            showSnackbar('Job Review Required',"warning")
            router.push({name:'quote-review', params:{id: job.value.id}})
        }
        appBarTitle.value = 'Job Details - ' + j.site_address.line_one
        // }, 2000);
    }
    catch(e){
        showSnackbar("error loading job details",'error')
        console.error(e)
    }
})


const modalStep = ref(1);

async function handleCancelComplete(method?: 'email' | 'sms' | 'other', status?: ContactLog) {
  if(status)
    job.value.contact.push(status);
  await endJob(job.value);
  showSnackbar('Job ended successfully', 'success');
}

async function handleEarlyContact(method: 'email' | 'sms' | 'other', status: ContactLog) {
    job.value.contact.push(status);
    console.log("handleEarlyContact")
}

async function handleEarlyComplete() {
    console.log("handleEarlyComplete")
    job.value.status = 'ongoing';
    job.value.dates.cycle_start = new Date();
    await JobController.updateJob(job.value.id, {
        ...job.value
    });
    router.push({path: '/', query: {
        showJob: job.value.id
    }});
    showSnackbar('Job activated successfully', 'success');
}


async function deleteCycle(cycle: Partial<JobCycle>) {
    const cycles = await JobController.deleteCycle(cycle)
    job.value = {
        ...job.value,
        cycles
    }
    showSnackbar('Deleted cycle along with invoices', 'warning')
}


async function editCycle(cycle: Partial<JobCycle>){
    const cycles = await JobController.updateCycle(cycle)
    job.value = {
        ...job.value,
        cycles
    }
}



async function endJob(job: QuoteJob) {
// console.log("would end",job)
// return
  try {
    await JobController.updateJob(job.id, {
      ...job,
      status: 'concluded'
    });
    router.push({
        path: '/',
        query: {
            showJob: job.id
        }
    });
  } catch (error) {
    showSnackbar('Failed to cancel job', 'error');
  }
}

async function deleteJob(){
    await JobController.deleteJob(job.value.id)
    router.push('/')
    showSnackbar('Deleted job succesfully', 'warning')
}

function jobItemClick(item: any){
    if(_UpdatableJobTypes.includes(job.value.status)){
        router.push(`/job/update/${job.value.id}?focus=job-title`)
    }
}

function jobDetailsClick(){
    if(_UpdatableJobTypes.includes(job.value.status)){
        router.push(`/job/update/${job.value.id}`)
    }
}

function jobAddressClick(){
    if(_UpdatableJobTypes.includes(job.value.status)){
        router.push(`/job/update/${job.value.id}?focus=address`)
    }
}

function handleNextComplete(data: JobCycle[]){
    showSnackbar('Scheduled next tasks successfully!', 'success')
    job.value.cycles = data
    // router.push({
    //     path:'/',
    //     query: {
    //         showJob: data.id
    //     }
    // })
}


</script>