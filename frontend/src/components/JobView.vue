<template>
    <v-row >
      <v-col cols="12" md="6" >
        <v-card >
          <v-card-title class="mb-4 cursor-pointer" @click="$emit('click:customer')">
            <v-icon left>mdi-account-outline</v-icon>
            Customer Details
          </v-card-title>
          <v-card-text>
                <v-row>
                <v-col cols="12" xl="6">
                  <div class="text-subtitle-1">Name</div>
                  <v-btn variant="text" size="small" @click="copyToClipboard(_job.customer.name)">
                  {{ _job.customer.name }}
                  </v-btn>
                </v-col>
                <v-col cols="12" xl="6" v-if="_job.customer.company">
                  <div class="text-subtitle-1">Company</div>
                  <v-btn variant="text" size="small" @click="copyToClipboard(_job.customer.company)">
                  {{ _job.customer.company || 'None' }}
                  </v-btn>
                </v-col>
                </v-row>
                <ContactOptions :email="_job.customer.email" :phone="_job.customer.phone"></ContactOptions>
                <v-row>
                    <v-col cols="12">
                    <div class="text-subtitle-1">
                      Customer Notes
                      <v-btn v-if="!notesState.customer && editable" variant="text" @click="notesState.customer = true">
                        <v-icon>mdi-pencil</v-icon>
                      </v-btn>
                    </div>
                    
                    <div v-if="notesState.customer">
                      <v-textarea
                        v-model="notesContent.customer"
                        rows="3"
                        outlined
                        dense
                      ></v-textarea>
                      <div class="d-flex flex-row-reverse">
                      <v-btn variant="tonal" color="success" size="small" @click="saveNotes('customer')">Save</v-btn>
                      <v-spacer></v-spacer>
                      <v-btn variant="text"  size="small" @click="cancelNotes('customer')">Cancel</v-btn>
                      </div>
                    </div>
                    <pre v-else @click="copyToClipboard(_job.customer.notes || 'None')">{{ _job.customer.notes || ' -' }}</pre>
                  </v-col>
                </v-row>
          </v-card-text>
          </v-card>
      </v-col>

      <v-col cols="12" md="6">
         <v-row>
          <v-col cols="12">
            <v-card outlined class="mb-4">
            <v-card-title class="d-flex align-center ga-2 mb-1">
                <v-icon left>mdi-file-document-outline</v-icon>
                Job Details
                <v-spacer/>
                <v-chip v-if="job?.metadata?.imported" style="text-transform: capitalize;" small color="green">Imported</v-chip>               
            </v-card-title>
            <v-card-text>
                <v-row>
                <!-- <v-col cols="12" sm="4">
                    <div class="text-subtitle-1">Job Cycle</div>
                    <v-chip style="text-transform: capitalize;" small :color="_job.cycle === 'one-off' ? 'secondary' : 'primary'">
                    {{ _job.cycle }}
                    </v-chip>
                </v-col> -->
                <v-col cols="12" sm="6">
                    <div class="text-subtitle-1">Status</div>
                    <v-chip style="text-transform: capitalize;" variant="outlined" small color="info">{{ _job.status }}</v-chip>
                </v-col>
                <v-col cols="12" sm=6 v-if="_job?.id">
                    <div class="text-subtitle-1">Reference</div>
                    <v-chip style="text-transform: capitalize;" variant="outlined" small color="green">{{ getReferenceNumber(_job.id,'job') }}</v-chip>
                </v-col>
                <v-col cols="12" sm="6" v-if="_job?.dates?.cycle_start">
                    <div class="text-subtitle-1">Start Date</div>
                    <v-chip style="text-transform: capitalize;" variant="outlined" small color="purple">
                    {{ toDateString(_job.dates.cycle_start) }}
                    </v-chip>
                </v-col>
                <v-col cols="12" sm="6">
                    <div class="text-subtitle-1">Customer Type</div>
                    <v-chip style="text-transform: capitalize;" variant="outlined" small color="orange">
                    {{_job.customer.company ? 'commercial' : 'residential' }}
                    </v-chip>
                </v-col>
                <v-col cols="12" sm="6">
                    <div class="text-subtitle-1">Discount</div>
                    <v-chip style="text-transform: capitalize;" variant="outlined" small color="purple">
                    {{_job.deal_discount > 0 ? `${_job.deal_discount}%` : `£${-_job.deal_discount}`}}
                    </v-chip>
                </v-col>
                <v-col cols="12">
                  <div class="text-subtitle-1">
                    Job Notes
                    <v-btn v-if="!notesState.job && editable" variant="text" @click="notesState.job = true">
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                  </div>
                  
                  <div v-if="notesState.job">
                    <v-textarea
                      v-model="notesContent.job"
                      rows="3"
                      outlined
                      dense
                    ></v-textarea>
                    <div class="d-flex flex-row-reverse">
                    <v-btn variant="tonal" color="success" size="small" @click="saveNotes('job')">Save</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn variant="text"  size="small" @click="cancelNotes('job')">Cancel</v-btn>
                    </div>
                  </div>
                  <pre v-else @click="copyToClipboard(_job.notes || 'None')">{{ _job.notes || ' -' }}</pre>
                </v-col>
                </v-row>
            </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-card outlined class="mb-4">
            <v-card-title class="cursor-pointer" @click="$emit('click:address')">
              <v-icon left>mdi-map-marker-outline</v-icon>
              Site Address
            </v-card-title>
            <v-card-text>
              <v-row>
              <v-col cols="12">
                <div class="text-subtitle-1">Address</div>
                <v-btn variant="text" size="small" @click="copyToClipboard(_job.site_address.line_one)">
                  <div>{{ _job.site_address.line_one || 'N/A' }}</div>
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="text-subtitle-1">City</div>
                <v-btn variant="text" size="small" @click="copyToClipboard(_job.site_address.city)">
                  <div>{{ _job.site_address.city || 'N/A' }}</div>
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="text-subtitle-1">Postal Code</div>
                <v-btn variant="text" size="small" @click="copyToClipboard(_job.site_address.postcode)">
                  <div>{{ _job.site_address.postcode || 'N/A' }}</div>
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" >
                <div class="text-subtitle-1">Type</div>
                <v-btn variant="text" size="small" @click="copyToClipboard(_job.site_address.property_type)">
                  <div>{{ _job.site_address.property_type || 'N/A' }}</div>
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" >
                <div class="text-subtitle-1">Bedrooms</div>
                <v-btn variant="text" size="small" @click="copyToClipboard(_job.site_address.property_bedrooms + '')">
                  <div>{{ _job.site_address.property_bedrooms || 'N/A' }}</div>
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" v-if="_job.site_address.property_features">
                <div class="text-subtitle-1">Features</div>
                <v-btn variant="text" size="small" @click="copyToClipboard(_job.site_address.property_features)">
                  <div>{{ _job.site_address.property_features || 'N/A' }}</div>
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" v-if="_job.customer.billing_reference">
                <div class="text-subtitle-1">Billing Reference</div>
                <v-btn variant="text" size="small"  @click="copyToClipboard(_job.customer.billing_reference)">{{ _job.customer.billing_reference || 'None' }}</v-btn>
              </v-col>
              <v-col cols="12">
                <div class="text-subtitle-1">
                  Site Notes
                  <v-btn v-if="!notesState.site  && editable" variant="text" @click="notesState.site = true">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                </div>
                
                <div v-if="notesState.site">
                  <v-textarea
                    v-model="notesContent.site"
                    rows="3"
                    outlined
                    dense
                  ></v-textarea>
                  <div class="d-flex flex-row-reverse">
                  <v-btn variant="tonal" color="success" size="small" @click="saveNotes('site')">Save</v-btn>
                  <v-spacer></v-spacer>
                  <v-btn variant="text"  size="small" @click="cancelNotes('site')">Cancel</v-btn>
                  </div>
                </div>
                <pre v-else @click="copyToClipboard(_job.site_address.notes || 'None')">{{ _job.site_address.notes || ' -' }}</pre>
              
              </v-col>
              </v-row>
            </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
      <v-col>
          <v-card>
            <v-card-text>
            <v-list v-if="false && $vuetify.display.mdAndUp" class="d-flex flex-column ga-2">
              <v-list-item
                v-for="(item, index) in (jobItems)"
                :key="item.uuid"
                :value="item.uuid"
                :class="item.group_type === 'suggested' ? 'suggested-item' : 'suggested'"
                class="py-3"
                rounded
                :ripple="false"
              >
                <!-- Prepend slot for the star icon -->
                <template v-slot:prepend>
                  <v-chip class="mr-4">{{ index+1 }}</v-chip>
                  <v-icon v-if="item.group_type === 'suggested'" color="warning">mdi-star</v-icon>
                </template>
  
                <!-- Main content for the item -->
                <v-list-item-title>
                  <p>{{ item.title }}</p>
                </v-list-item-title>
                <v-list-item-subtitle v-if="item.detail" class="d-flex">
                    ({{ item.detail }})
                </v-list-item-subtitle>
  
                <!-- Append slot for quantity, unit price, and total -->
                <template v-slot:append>
                  <v-list-item-action class="flex-column ">
                    <div>{{ `£ ${ item.unit_price.toFixed(2) }`}} </div>
                    
                    <div class="d-flex flex-column ga-2 align-end">
                      <v-chip  color="green">Cost: £{{ ( item.unit_price).toFixed(2) }}</v-chip>
                      <!-- <v-chip :color="cycles[item.cycle_months].color">Cycle: {{ cycles[item.cycle_months].text }}</v-chip> -->
                    </div>
                  </v-list-item-action>
                </template>
  
              </v-list-item>
            </v-list>

            <v-list v-else class="d-flex flex-column ga-2">
              <v-list-item 
                v-for="(item, index) in (jobItems)"
                :key="index"
                :value="item.uuid"
                :class="item.group_type === 'suggested' ? 'suggested-item' : 'suggested'"
                class="py-3"
                rounded
                :active="false"
                @click="$emit('click:item', item)"
              >
                <!-- Prepend slot for the star icon -->
                <template v-slot:prepend>
                  <div class="d-flex flex-column align-center mr-2 ga-2">
                  <v-chip class="">{{ index+1 }}</v-chip>
                  <v-icon v-if="item.group_type === 'suggested'" color="warning">mdi-star</v-icon>
                  </div>
                </template>
  
                <!-- Main content for the item -->
                <v-list-item-title class="text-wrap">
                  <p>{{ item.title }} </p>
                  
                </v-list-item-title>
                <v-list-item-subtitle class="d-flex">
                  £{{ ( item.unit_price).toFixed(2)  }} 
                  {{ item.monthly_price && `(£${item.monthly_price} / 4-5 weeks)` }}
                  {{ item.bimonthly_price && `(£${item.bimonthly_price} / 8-9 weeks)` }}
                  <!--  -{{ cycles[item.cycle_months].text }} -->
                  {{ item.detail ? ` - (${item.detail})`: ''}}
                </v-list-item-subtitle>
  
              </v-list-item>
            </v-list>
            </v-card-text>
            
            <!-- <v-card-actions>
            <div class="w-100 d-flex justify-end text-right ga-8">
              <p>
                Requested
                <br/>
                £ {{
                  _job.items.reduce(
                    (subtotal, item) =>
                      subtotal + ((item.quantity) || 0) * ((item.group_type === 'requested' ? item.unit_price : 0) || 0),
                    0
                  ).toFixed(2)
                }}
              </p>
              <p>
                Suggested
                <br/>
                £ {{
                  _job.items.reduce(
                    (subtotal, item) =>
                      subtotal + ((item.quantity) || 0) * ((item.group_type === 'suggested' ? item.unit_price : 0) || 0),
                    0
                  ).toFixed(2)
                }}
              </p>
            </div>

            </v-card-actions> -->
          </v-card>
        </v-col>

      <v-col cols="12" v-if="false && !hideTotal">
        <v-card>

          <v-card-text>
            <div class="text-right d-flex ga-2 flex-column">
              <h2>Total: £{{total.toFixed(2)}}</h2>
              <h3 v-if="hasDealQuote(job)">Deal: £{{discount.toFixed(2) }}</h3>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </template>
  
<script setup lang="ts">
import { hasDealQuote, prepareDisplayJobItems, toDateString } from '@shared/helpers';
import { useQuoteTotal, openEmptySMS, openEmptyEmail, openEmptyPhonecall, copyToClipboard as hookCopyToCliboard } from '@/hooks';
import { getReferenceNumber, QuoteJob } from '@shared/schema';
import { JobController } from '@shared/api';
import { watch, inject, ref, reactive, toRaw } from 'vue';
import ContactOptions from './ContactOptions.vue';


const showSnackbar = inject('snackbar') as (text: string, color: string)=>void;

function copyToClipboard(text: string){
  hookCopyToCliboard(text, showSnackbar)
}

const props = defineProps<{
  job: QuoteJob
  editable?: boolean,
  hideTotal?: boolean
}>();
const jobItems = (props.job.items)
const _job = reactive({...props.job})

const cycles = {
  0:{ text: 'One-Time', color: ''},
  1:{ text: 'Monthly', color: 'green'},
  2:{ text: 'Bi-Monthly', color: 'warning'},
  12:{ text: 'Annually', color: 'blue'},
} as {[key:number]: {text:string, color: string}}

const {total, discount} = useQuoteTotal(props.job);



const notesState = reactive({
  customer: false,
  site: false,
  job: false,
})
const notesContent = reactive({
  customer: _job.customer.notes,
  site: _job.site_address.notes,
  job: _job.notes,
})

async function saveNotes(type: 'customer'|'site'|'job'){
  if(type === 'customer'){
    _job.customer.notes = notesContent.customer
  }
  else if(type === 'site'){
    _job.site_address.notes = notesContent.site
  }
  else if(type === 'job'){
    _job.notes = notesContent.job
  }
  
  await JobController.updateJob(_job.id, _job)
  showSnackbar('Saved ok!',"success")
  notesState[type] = false
}

function cancelNotes(type: 'customer'|'site'|'job'){
  notesState[type] = false
  if(type === 'customer'){
    notesContent.customer = _job.customer.notes
  }
  else if(type === 'site'){
    notesContent.site = _job.site_address.notes
  }
  else if(type === 'job'){
    notesContent.job = _job.notes
  }
}
</script>
  
<style scoped>
.suggested-item {
  background-color: #ffd50028;
}
</style>