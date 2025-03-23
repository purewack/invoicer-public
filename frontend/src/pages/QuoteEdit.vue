<template>
  <v-container id="start"  v-if="ready" style="max-width: 1000px; padding: 0;">
    <v-row>
      <v-col cols="12">
        <!-- <v-card style="max-width: 1280px;">
          <v-card-title class="headline">
            <h1>{{ complete ? 'Review New Quote' : 'Create New Quote' }}</h1>
          </v-card-title> -->

        <!-- Step 1: Customer Details -->
        <v-expand-transition>
          <div v-show="step + 1 >= 1" id="step-1" class="step-section">
            <v-card-title class="step-title d-flex flex-wrap mt-16">
              <v-icon large color="primary" class="mr-2">mdi-account</v-icon>
              Customer Information
              <v-spacer />
              <v-btn color="primary">
                <v-icon>mdi-account</v-icon>
                Select Existing
                <CustomerPicker @selected="prefillCustomer" />
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-form ref="customerDetailsForm" v-model="valid.customer">
                <!-- Basic Customer Info -->
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field v-model="quote.customer.name" label="Contact Name *" variant="outlined"
                      :rules="[v => !!v || 'Name is required']" required></v-text-field>
                  </v-col>
                  <v-col cols="12" :md="quote.customer.company ? 4 : 6">
                    <v-text-field v-model="quote.customer.company" label="Company (optional)"
                      variant="outlined"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="2" v-if="quote.customer.company">
                    <v-text-field 
                      v-model="quote.customer.billing_reference" 
                      label="Billing Ref." 
                      variant="outlined"
                    >
                    </v-text-field>
                  </v-col>
                </v-row>

                <v-col cols="12">
                    <v-label><i>** Email or phone number can be used, or both</i></v-label>
                  </v-col>

                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field 
                      v-model="quote.customer.email" 
                      label="Email **" 
                      variant="outlined" 
                      type="email"
                      :rules="[v => !!quote.customer.phone?.length || (/.+@.+\..+/.test(v) || 'Email must be valid')]"
           
                    >
                    </v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field 
                      v-model="quote.customer.phone" 
                      label="Phone **" 
                      variant="outlined"
                      :rules="[v => !!quote.customer.email?.length || (/^[\d\s\-()+]+$/.test(v) || 'Phone number is invalid')]"
                 
                    >
                    </v-text-field>
                  </v-col>
                </v-row>

                <v-row>
                  <v-col cols="12">
                    <v-textarea v-model="quote.customer.notes" label="Customer Notes (optional)" rows="4"
                      variant="outlined" placeholder="Any special notes about this customer..."></v-textarea>
                  </v-col>
                </v-row>
              </v-form>
            </v-card-text>
          </div>
        </v-expand-transition>

        <!-- Step 2: Address Information -->
        <v-expand-transition>
          <div v-show="step + 1 >= 1" id="address" class="step-section">
            <v-divider class="my-4"></v-divider>
            <v-card-title class="step-title">
              <v-icon large color="primary" class="mr-2">mdi-map-marker</v-icon>
              Address Information
              <v-spacer/>
              <v-btn color="secondary">
                Preview <v-icon>mdi-magnify</v-icon>
                <MapsPreview :address="quote.site_address.line_one" :city="quote.site_address.city" :postcode="quote.site_address.postcode"/>
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-form ref="addressForm" v-model="valid.address">
                <!-- Site Address -->
                <v-card-subtitle class="px-0 mb-2">
                  <v-icon small class="mr-2">mdi-home</v-icon>
                  Site Address
                </v-card-subtitle>
                <v-row>
                  <v-col cols="12">
                    <v-text-field v-model="quote.site_address.line_one" label="Address Line 1 *" variant="outlined"
                      required :rules="[v => !!v || 'Address must not be empty']"></v-text-field>
                    <v-text-field v-model="quote.site_address.postcode" label="Postcode *" variant="outlined" required
                      :rules="[v => !!v || 'Postcode is required']"></v-text-field>
                    <v-text-field v-model="quote.site_address.city" label="City *" variant="outlined" required
                      :rules="[v => !!v || 'City is required']"></v-text-field>
                    <v-select v-model="quote.site_address.property_type" :items="propertyTypes" label="Property Type"
                      variant="outlined" required :rules="[v => !!v || 'Property type is required']"></v-select>
                    <v-text-field v-model="quote.site_address.property_bedrooms" label="Number of Bedrooms"
                      type="number" variant="outlined" required
                      :rules="[v => v >= 0 || 'Number of bedrooms must be valid']"></v-text-field>
                    <v-select v-model="siteFeatures" :items="propertyFeatures" 
                      label="Property Features" variant="outlined" multiple></v-select>
                  </v-col>

                  <v-col cols="12">
                    <v-textarea v-model="quote.site_address.notes" label="Property Notes (optional)" rows="4"
                      variant="outlined" placeholder="Any additional notes about the property..."></v-textarea>
                  </v-col>
                </v-row>

                <!-- Billing Address -->
                <v-card-subtitle class="px-0 mt-4 d-flex align-center">
                  <v-icon small class="mr-2">mdi-file-document</v-icon>
                  Billing Address
                  <v-checkbox v-model="sameBillingAddress" label="Same as site address" class="ml-4 mt-0"
                    hide-details></v-checkbox>
                  <v-spacer/>
                  <!-- <v-btn v-if="!sameBillingAddress" color="secondary">
                    Preview <v-icon>mdi-magnify</v-icon>
                    <MapsPreview :address="quote.customer.billing_address.line_one" :city="quote.customer.billing_address.city" :postcode="quote.customer.billing_address.postcode"/>
                  </v-btn> -->
                </v-card-subtitle>
                <v-row v-if="!sameBillingAddress">
                  <v-col cols="12" md="12">
                    <v-text-field v-model="quote.customer.billing_address!.line_one" label="Address Line 1"
                      variant="outlined" required
                      :rules="[v => !!v || 'Billing address must not be empty']"></v-text-field>
                    <v-text-field v-model="quote.customer.billing_address!.postcode" label="Postcode" variant="outlined"
                      required :rules="[v => !!v || 'Postcode is required']"></v-text-field>
                    <v-text-field v-model="quote.customer.billing_address!.city" label="City" variant="outlined" required
                      :rules="[v => !!v || 'City is required']"></v-text-field>
                  </v-col>
                </v-row>
              </v-form>
            </v-card-text>
          </div>
        </v-expand-transition>

        <!-- Step 2: Items -->
        <v-expand-transition>
        <div v-show="step + 1 >= 2" id="step-2" class="step-section">
          <v-divider class="my-4"></v-divider>
          <v-card-title id="jobs-title" class="step-title">
            <v-icon large color="primary" class="mr-2">mdi-format-list-checks</v-icon>
            Jobs Tasks
            <v-card-subtitle v-if="quote.requested_service">
              Client requested service: {{ servicesAliases[quote.requested_service] }}
            </v-card-subtitle>
          </v-card-title>
          <v-card-text>
            <!-- Requested Items Group -->
            <v-card  v-if="quote.items.length > 0" class="mb-4">
              <!-- <v-card-title class="d-flex align-center">
                <v-icon color="primary" class="mr-2">mdi-checkbox-marked-circle-outline</v-icon>
                Normal Tasks
              </v-card-title> -->
              <v-card-text>
                <v-card v-for="(item, index) in (quote.items as JobItemSchema[])" :key="item.uuid" class="mb-6" variant="flat">
                  <v-card-text>
                    <div class="d-flex ga-2 mb-2" :class="$vuetify.display.xs ? 'flex-column align-center' : ''">
                      <!-- <div class="d-flex" :class="$vuetify.display.xs ? '' : 'flex-column justify-space-between mb-5'">
                        <v-btn @click="moveItemUp(getOriginalIndex(item))" variant="text" :disabled="getOriginalIndex(item) === 0">
                          <v-icon>mdi-arrow-up</v-icon>
                        </v-btn>
                        <v-btn icon variant="tonal">
                          {{ getOriginalIndex(item) + 1 }}
                        </v-btn>
                        <v-btn @click="moveItemDown(getOriginalIndex(item))" variant="text" :disabled="getOriginalIndex(item) === quote.items.length - 1">
                          <v-icon>mdi-arrow-down</v-icon>
                        </v-btn>
                      </div> -->
                      <JobItem 
                        :value="item" 
                        :is-only-item="quote.items.length <= 1"
                        :available-titles="jobTitlesPool" 
                        :allow-cycles="route.name === 'job-update'"
                        @deleted="jobItemOnDelete" 
                        @changed="jobItemOnChange"
                        @update-title="jobTitleOnUpdateExisting" 
                        @add-title="jobTitleOnSaveNew"
                        @remove-title="jobTitleOnRemove" />
                    </div>
                  </v-card-text>
                </v-card>
              </v-card-text>
            </v-card>

            <v-card v-else variant="flat">
              <v-card-text>
                Please add jobs using the button below
              </v-card-text>
            </v-card>

            <div class="mt-8 d-flex justify-space-between align-start ga-2 flex-wrap">
              <v-btn color="secondary" @click="jobItemAdd">
                <v-icon left>mdi-plus</v-icon>
                Add New Task
              </v-btn>
              <v-spacer />
              <v-text-field v-model.number="quote.deal_discount"  type="number" label="Package Discount"
                :prefix="quote.deal_discount < 0 ? '£' : '%'" step="5" variant="outlined"
                style="max-width: 150px;"></v-text-field>

              <!-- <div class="subtotal-preview d-flex flex-column ga-2 ">
                <v-chip label color="primary" class="d-flex justify-end">
                  <v-icon left>mdi-calculator</v-icon>
                  Current Total: £ {{ total.toFixed(2) }}
                </v-chip>
                <v-chip v-if="canBeDealQuote(quote)" label color="warning" class="d-flex justify-end">
                  <v-icon left>mdi-calculator</v-icon>
                  Deal Total: £ {{ discount.toFixed(2) }}
                </v-chip>
              </div> -->
            </div>

            <v-row class="my-4">
              <v-col cols="12">
                <v-textarea v-model="quote.notes" label="Job Notes (optional)" rows="5" variant="outlined"
                  placeholder="Enter any notes about this job..."
                  :rules="[v => !v || v.length <= 500 || 'Notes must be less than 500 characters']"></v-textarea>
              </v-col>
            </v-row>
          </v-card-text>
        </div>
      </v-expand-transition>

      </v-col>
    </v-row>
    <!-- 
      <v-col cols="12" lg="5" class="relative">
        <v-card style="max-width: 1280px;" class="sticky-0" variant="text">
          <v-expand-transition>
            
          </v-expand-transition>
        </v-card>
      </v-col>
    </v-row> -->

 
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between ga-2 pl-8 pr-8 mb-8">
        
        <v-btn text @click="$router.back()" variant="flat">
          <v-icon left>mdi-arrow-left</v-icon>
          Back
        </v-btn>

        <v-bottom-sheet >
          <template v-slot:activator="{ props: sheetProps }">
          <v-btn v-bind="sheetProps" variant="text" v-if="(route.name === 'quote-review' && quote.status === 'reviewing')">
            Other Options
          </v-btn>
          </template>
          <template v-slot:default="{isActive}">
          <v-sheet>
          <v-card class="text-center">
            
            <v-card-text>
            <p>To decline or postpone quote review, use the buttons below.</p>
            <p>Rejecting the quote will not remove the data. To remove you will have to reject first then delete data.</p>
            <br />
            <div class="d-flex ga-4 justify-center">
              <v-btn @click="isActive.value = false" variant="flat">
                <v-icon left>mdi-arrow-left</v-icon>
                Back
              </v-btn>
              <v-btn variant="tonal" color="success" @click="()=>{isActive.value = false; onJustSave()}">
                <v-icon>mdi-content-save-edit-outline</v-icon>
                Just Save
              </v-btn>
              <v-spacer/>
              <v-btn variant="tonal" color="error">
                <v-icon>mdi-cancel</v-icon>
                Reject
                <MessagingDataBar
                  :template="'quote-reject'"
                  :target="quote" 
                  @save="onRejectSave"
                  @complete="onPostponeRejectComplete"
                >
                </MessagingDataBar>
              </v-btn>

              <v-btn variant="tonal" color="warning">
                <v-icon>mdi-clock-outline</v-icon>
                Review Later
                <MessagingDataBar
                  :template="'quote-postpone'"
                  :target="quote" 
                  @save="onPostponeSave"
                  @complete="onPostponeRejectComplete"
                >
                </MessagingDataBar>
              </v-btn>
            </div>
            </v-card-text>
          </v-card>
          </v-sheet>
          </template>
        </v-bottom-sheet>
           
        <v-dialog max-width="1000" 
        scrollable transition="dialog-bottom-transition">
          <template v-slot:activator="{ props: activatorProps }">
 
            <v-btn color="success" variant="tonal" @click="buttonContinue(activatorProps)">
              {{quote.status === 'new' ? 'Save & Finish' : 'Save & Update'}}
              <v-icon>mdi-arrow-right</v-icon>
            </v-btn>
          </template>

          <template v-slot:default="{isActive}">
          <v-card>
              <v-card-title >
                <v-icon large color="primary" class="mr-2">mdi-eye-outline</v-icon>
                Quote Preview
              </v-card-title>
              <v-card-text>
                <div style="pointer-events: none;">
                  <JobView :job="quote"/>
                </div>
              </v-card-text>
              
              <v-card-actions class="d-flex flex-wrap">
                <v-btn @click="isActive.value = false">Back</v-btn>
                <v-spacer></v-spacer>

                <!-- <v-btn v-if="route.name === 'job-update' && !['new','reviewing'].includes(quote.status)" color="success" variant="tonal"
                @click="buttonSaveQuote">
                  <v-icon>mdi-content-save</v-icon>
                  Update Quote
                </v-btn> -->

                
                <v-btn  variant="plain" v-if="route.name === 'quote-new'">
                  Create as Job
                  <v-icon>mdi-fast-forward</v-icon>
                  <StartEarly 
                    :job="quote"
                    import
                    @save="onQuoteEarlySave"
                    @complete="onQuoteEarlyComplete"
                  />
                </v-btn>
                
                <v-btn color="success" variant="tonal" >
                  <template v-if="route.name === 'job-update'">
                    <v-icon>mdi-content-save</v-icon>
                    Update Quote
                  </template>
                  <template v-else>
                    Create as Quote
                    <v-icon class="mx-2">
                      mdi-send
                    </v-icon>
                  </template>
                  <MessagingDataBar
                    title="Continue"
                    :template="quoteTemplateName"
                    :target="quote" 
                    @save="onMessagingPreSave"
                    @complete="onCompleteContactQuote"
                  >
                    <template #sms-title>SMS Generated</template>
                    <template #sms-body>
                      <b v-if="hasZeroCosts">There are some items with £0 cost!<br/><br/></b>
                      <b v-if="hasUndefinedDeal">There are some suggested items, but no deal amount<br/><br/></b>
                      <!-- <strong v-if="total === 0"><br />The total amount is £0<br/>Is this right ?!<br /><br /><br /></strong> -->
                      A quotation offer sms will open
                    </template>

                    <template #email-title>Email Generated</template>
                    <template #email-body>
                      <b v-if="hasZeroCosts">There are some items with £0 cost!<br/><br/></b>
                      <b v-if="hasUndefinedDeal">There are some suggested items, but no deal amount<br/><br/></b>
                      <!-- <strong v-if="total === 0"><br />The total amount is £0<br/>Is this right ?!<br /><br /><br /></strong> -->
                      A quotation offer email will be automatically sent
                    </template>
                  </MessagingDataBar>
                </v-btn>
              </v-card-actions>

          </v-card>
          </template>
        </v-dialog>
      </v-col>
    </v-row>

  </v-container>

</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick, toRaw, watchEffect, inject, Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import JobItem from '@/components/JobItem.vue';
import JobView from '@/components/JobView.vue';
import CustomerPicker from '@/components/PickCustomer.vue';
import { capitalizeWords, hasDealQuote,canBeDealQuote, prepareDisplayJobItems, checkContactLogState, getUID } from '@shared/helpers';
import { JobController } from '@shared/api';
import { Job as JobSchema, JobItem as JobItemSchema, JobItemTitle as JobItemTitleSchema, Address, Customer, JobStatus, _JobRequestTypes, JobRequestTypes, JobItemCategory, servicesAliases, _QuotablejobTypes, _UpdatableJobTypes, ContactLog, getReferenceNumber, EmailTemplateName } from '@shared/schema';
import { repo } from 'remult';
import { useQuoteTotal, useUnsavedChanges, saveQuote } from '@/hooks';
import { QuoteJob } from '@shared/schema';
import MessagingDataBar, { ContactStatusFlags } from '@/components/MessagingDataBar.vue';
import StartEarly from '@/components/StartEarly.vue';
import MapsPreview from '@/components/MapsPreview.vue';

const showSnackbar = inject('snackbar') as (message:string, color:string)=>void
const appBarTitle = inject('appBarTitle') as Ref<string>
appBarTitle.value = 'Create Quote'

const valid = reactive({
  customer: false,
  address: false,
  tasks: false,
});

const route = useRoute();
const router = useRouter();

const step = ref(0);
const complete = ref(false);
const sameBillingAddress = ref(false);
const propertyTypes = [
  'Detached',
  'Semi-Detached',
  'Terraced',
  'Flat',
  'Bungalow',
  'Apartment',
  'Townhouse',
  'Industrial',
  'Offices',
  'Other',
];
const propertyFeatures = [
  'Extension',
  'Conservatory',
  'Two-Storey',
  'Three-Storey',
  'Garden',
  'Garage',
  'Driveway',
  'Balcony',
];


const quote = reactive<(QuoteJob)>(JobController.blankJob());
const siteFeatures = ref<string[]>([]);

const { hasUnsavedChanges, disable: disableChangesCheck } = useUnsavedChanges()
watch(quote, (nn)=>{
  hasUnsavedChanges.value = true
  console.log("change")
}, {deep:true})
watch(siteFeatures, (nn)=>{
  hasUnsavedChanges.value = true
  console.log("change")
}, {deep:true})


const {total, discount} = useQuoteTotal(quote);

const hasZeroCosts = computed(()=>{
  return quote.items.find(i => i.unit_price === 0)
})
const hasUndefinedDeal = computed(()=>{
  return quote.deal_discount === 0 && hasDealQuote(quote)
})

watch(
  () => quote?.customer?.company, // Optional chaining
  (newVal) => {
    if (newVal !== undefined) {
      sameBillingAddress.value = !newVal
    }
    if(!newVal){
      quote.customer.billing_reference = ''
    }
  },
  { deep: true }
)

const getQuoteData = (data?: QuoteJob)=>{
  let final = {...(data ? data : toRaw(quote))} as QuoteJob
  if(sameBillingAddress.value){
    final.customer.billing_address!.postcode = final.site_address.postcode
    final.customer.billing_address!.city = final.site_address.city
    final.customer.billing_address!.line_one = final.site_address.line_one
  }
  final.site_address.property_features = siteFeatures.value.join(',');
  final.items = prepareDisplayJobItems(final).map(item => ({
    ...item,
    group_type: item.group_type as 'requested' | 'suggested',
  }));
  return final ;
}

const quoteTemplateName = ref<EmailTemplateName>('quote-initial')

async function prefillForm (){
  const { id } = route.params;

  
  let response;
  try {
    if (!id || id === '0') return;
    response = await JobController.getJobById(id as string);
  }
  catch {
    router.replace({ params: {id: undefined} });
    quote.deal_discount = 20

    nextTick(()=>{
      hasUnsavedChanges.value = false;
      console.log("un")
    })
    return;
  }

  step.value = 3;
  complete.value = true;

  const data = response;
  // console.log("refill info", response)
  hasUnsavedChanges.value = false

  console.log(route.name)

  if(route.name === 'quote' && !_QuotablejobTypes.includes(data.status) 
  || route.name === 'job-update' && !_UpdatableJobTypes.includes(data.status)){
    showSnackbar('Invalid Link','warning')
    
    return router.push('/')
  }



  Object.assign(quote, data);
  console.log("assign",JSON.stringify(quote))

  if (data.items)
    quote.items = data.items.map((item: any) => ({ ...item, uuid: item?.uuid || getUID(), }));

  if (quote.site_address?.property_features.length)
    siteFeatures.value = data.site_address!.property_features.split(',').map((i:string) => capitalizeWords(i))
  


  if(quote.status === 'postponed'){
    appBarTitle.value = 'Review Postponed Quote'
  }
  else if(route.name === 'job-update'){
    appBarTitle.value = 'Update - ' + quote.site_address.line_one
    quoteTemplateName.value = 'quote-update'
  }
  else if(quote.status === 'new'){
    appBarTitle.value = 'New - ' + quote.site_address.line_one
  }
  else{
    appBarTitle.value = 'Unfinished Review Quote: ' + getReferenceNumber(quote.id, 'quote')
    if(quote.status !== 'reviewing')
      quoteTemplateName.value = 'quote-update'
  }


  if(quote.status === 'new'){
    quote.status = 'reviewing'
    quote.deal_discount = 20
  }
  else{
    let itemTitles = (await repo(JobItemTitleSchema).find())
    
    quote.items = quote.items.map(i => ({
      ...i,
      category: itemTitles.find((t:any) => t.title === i.title)?.category || []
    }))
  }
  
  nextTick(() => {

    if (
      quote.site_address.line_one !== quote.customer?.billing_address?.line_one ||
      quote.site_address.postcode !== quote.customer?.billing_address?.postcode ||
      quote.site_address.city !== quote.customer?.billing_address?.city
    ) {
      sameBillingAddress.value = false;
    } else {
      sameBillingAddress.value = !data.customer.company;
    }
    
    const elName = route.query?.focus ? route.query.focus as string : 'start';
    const el = document.getElementById(elName);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  });

};

const resetForm = () => {
  step.value = 3;
  Object.assign(quote, JobController.blankJob());
  complete.value = false;
  sameBillingAddress.value = true;
};

const prefillCustomer = async (customer: Customer) => {
  console.log("customer",customer)
  if(!quote.customer) return
  if(!customer) return
  Object.assign(quote.customer, customer);
  quote.customer_id = ''
  try {
    const billingAddressId = quote.customer.billing_address_id;
    const billingResponse = await repo(Address).findId(billingAddressId)
    const siteAddressResponse = await repo(JobSchema).findFirst({customer_id: customer.id})
    let siteAddress
    if(siteAddressResponse){
      siteAddress = await repo(Address).findId(siteAddressResponse?.site_address_id)
    }
    else if(billingResponse){
      console.log("using billing for site")
      siteAddress = {...billingResponse, property_type: 'Other', id: ''}
    }

    if(siteAddress){
      Object.assign(quote.customer.billing_address!, billingResponse);
      Object.assign(quote.site_address, siteAddress)
      quote.customer.billing_address_id = billingResponse?.id || ''
      quote.site_address_id = siteAddress.id
      console.log("prefilled customer",JSON.stringify(quote))
      sameBillingAddress.value = quote.customer.billing_address?.line_one === quote.site_address?.line_one
    }
  } catch (error) {
    console.error('Error fetching addresses:', error);
    showSnackbar('Failed to fetch customer addresses', 'error');
  }
};



const jobTitlesPool = ref<JobItemTitleSchema[]>([])

repo(JobItemTitleSchema).liveQuery({ orderBy: { id: 'asc' } })
  .subscribe((data:any) => {
    // console.log('new items', data)
    jobTitlesPool.value = data.items
  })


const jobTitleOnSaveNew = async (data: { title: string, detail: string }) => {
  const newData = await repo(JobItemTitleSchema).insert(data)
  const index = quote.items.findIndex(i => i.title === data.title);
  if (index !== -1) {
    Object.assign(quote.items[index], newData);
  }
}

const jobTitleOnUpdateExisting = async (data: { id: any, title: string, detail: string }) => {
  let newData = await repo(JobItemTitleSchema).update(data.id, data)
  const index = quote.items.findIndex(i => i.title === data.title);
  if (index !== -1) {
    Object.assign(quote.items[index], {...newData, id:undefined});
  }
}

const undoTitleRemove = ref();
const jobTitleOnRemove = (data: { id: any, title: string, detail: string }) => {
  undoTitleRemove.value = async () => {
    repo(JobItemTitleSchema).insert(data);
  }
  repo(JobItemTitleSchema).delete(data.id);
}

const jobItemAdd = () => {
  const i = {
    uuid: getUID(),
    unit_price: 0,
    title: '',
    detail: null,
    cycle_months: 0,
    completed: false,
    category: [],
    group_type: quote.id ? 'suggested' : 'requested'
  } as JobItemSchema;
  quote.items.push(i);
  // console.log('new i', i)
  return i;
};

const jobItemOnChange = (item: any) => {
  const index = quote.items.findIndex(i => i.uuid === item.uuid);
  if (index !== -1) {
    Object.assign(quote.items[index], item);
  }
};

const jobItemOnDelete = (item: any) => {
  const index = quote.items.findIndex(i => i.uuid === item.uuid);
  if (index !== -1) {
    quote.items.splice(index, 1);
  }
};




async function preValidate(){
  try{  
    if(quote.items.length === 0){
      showSnackbar('Please add job items','error')
      return false
    }
    if(!route.query?.debug){
      try{
        let data = getQuoteData() as QuoteJob
        if(data.status === 'postponed')
          data.status = 'reviewing'
        const state = await JobController.validateJob(data)
        return state
      }
      catch(e: any){
        showSnackbar(e.message,'error')
        return false
      }
    }
  }
  catch(e:any){
    console.error(e)
    showSnackbar(e.message, 'error')
  }
}

async function buttonContinue(activatorProps: any){
  const p = await preValidate()
  console.log("preval",p)
  if(p === false) return 

  if(activatorProps)
    activatorProps.onClick(new Event('click'))
}


// const moveItemUp = (index: number) => {
//   if (index > 0) {
//     const temp = quote.items[index];
//     quote.items.splice(index, 1);
//     quote.items.splice(index - 1, 0, temp);
//   }
//   quote.items = quote.items.map((i,v) => ({...i}))
// };

// const moveItemDown = (index: number) => {
//   if (index < quote.items.length - 1) {
//     const temp = quote.items[index];
//     quote.items.splice(index, 1);
//     quote.items.splice(index + 1, 0, temp);
//   }
//   quote.items = quote.items.map((i,v) => ({...i}))
// };



async function onJustSave(){
  if(!hasUnsavedChanges.value) return
  
  try{
    const q = await saveQuote({...quote})
    showSnackbar('Saved ok','success')
    if(q){
      route.params.id = q
      hasUnsavedChanges.value = false
    }
  }
  catch(e: any){
    showSnackbar(`Can't save: ${e.message}`,'error')
  }
}


function onMessagingPreSave(){
  console.log("onMessagingPreSave")
  hasUnsavedChanges.value = true
  saveQuoted()
}

async function onCompleteContactQuote(results: ContactStatusFlags){
  console.log("onCompleteContactQuote")
  hasUnsavedChanges.value = false
  
  nextTick(()=>{
    router.push({path: '/', query: {
      highlight: quote.id
    }})
  })
}

async function saveQuoted(finish = false){
  if(!hasUnsavedChanges.value ) return
  if(finish || route.name === 'quote-new' || quote.status === 'reviewing' || quote.status === 'postponed') {
    quote.status = 'reviewed'
  }
  hasUnsavedChanges.value = false
  
  try{
    const id = await saveQuote({...quote, items: quote.items.map(i => ({...i, category: undefined}))})
    showSnackbar('Saved ok','success')
    console.log("saved ",hasUnsavedChanges.value)
    if(!id){
      hasUnsavedChanges.value = true
      // nextTick(()=>{
      //   quote.id = id
      //   route.params.id = id
      // })
    }
    else{
      quote.id = id
    }
  }
  catch(e: any){
    showSnackbar(`Can't save: ${e.message}`,'error')
    hasUnsavedChanges.value = true
  }
}



async function onQuoteEarlySave(startDate: Date){
  if(!startDate) {
    showSnackbar('Unknown date error when starting early', 'error')
    return
  }

  console.log("quote early")

  const changes = {
    dates: {
      cycle_start: startDate,
      cycles: []
    },
    status: Date.now() >= quote.dates!.cycle_start!.getTime() ? 'ongoing' : 'confirmed' as JobStatus,
    metadata: {
      imported: true
    }
  }

  try{
    const id = await saveQuote({...quote, ...changes, items: quote.items.map(i => ({...i, category: undefined}))})
    showSnackbar('Saved ok','success')
    if(id){
      Object.assign(quote, {
        ...quote, 
        ...changes,
        id
      })
      route.params.id = id
      nextTick(()=>{
        hasUnsavedChanges.value = false
      })
    }
  }
  catch(e: any){
    showSnackbar(`Can't save: ${e.message}`,'error')
  }
}

function onQuoteEarlyComplete( results: ContactStatusFlags){
  console.log("want to leave pre")
  hasUnsavedChanges.value = false
  nextTick(()=>{
    router.push({path: '/', query: {
      highlight: quote.id
    }})
  })
}

function onPostponeSave(){
  quote.status = 'postponed'
  onPostponeRejectSave()
}

function onRejectSave(){
  quote.status = 'rejected'
  onPostponeRejectSave()
}

async function onPostponeRejectSave(){
  try {
    await saveQuote({...quote, items: quote.items.map(i => ({...i, category: undefined}))})
    showSnackbar('Quote was updated succesfully','warning')
  }
  catch(e:any){
    console.error(e)
    showSnackbar('Failed sending email','error')
  }
}


function onPostponeRejectComplete( results: ContactStatusFlags){
  console.log("want to leave pre")
  hasUnsavedChanges.value = false
  nextTick(()=>{
    router.push({path: '/', query: {
      highlight: quote.id
    }})
  })
}




const ready = ref(false);
onMounted(async () => {
  resetForm();
  ready.value = true;
  await prefillForm();

  nextTick(()=>{
    hasUnsavedChanges.value = false;
    console.log("un")
  })
});

//console.log(router, route)
</script>

<style scoped>
.step-section {
  padding: 0 24px 24px;
}

.step-title {
  padding-left: 0;
  margin-bottom: 2rem;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
}

.subtotal-preview {
  display: flex;
  justify-content: flex-end;
}

.v-stepper {
  box-shadow: none;
}

.v-stepper__header {
  box-shadow: none;
  border-bottom: 1px solid #eee;
  padding-bottom: 16px;
}

.text-subtitle-1 {
  font-size: 1rem;
  font-weight: 500;
}

.text-subtitle-2 {
  font-size: 0.875rem;
  font-weight: 500;
}

.relative {
  position: relative;
}

.sticky-0 {
  position: sticky;
  top: 6.5rem;
}

.alter-list {
  background-color: rgba(19, 226, 192, 0.151);
}
</style>