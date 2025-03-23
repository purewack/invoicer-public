<template>
  <v-row>
    <v-col cols="12" class="d-flex align-center">
      <v-text-field
        v-model="searchInput"
        placeholder="Search for invoices or client details / addresses"
        clearable
        @click:clear="isLoading = null"
        append-icon="mdi-magnify"
        @click:append="commitSearch"
        @keydown.enter="commitSearch"
      >
        
      </v-text-field>
    </v-col>
    
    <v-col v-if="isLoading">
      <v-progress-linear color="primary" indeterminate />
    </v-col>
    <v-col v-else-if="isLoading !== null && !isLoading && !searchResults.length">
      No results found
    </v-col>
    <v-col v-else-if="isLoading !== null && !isLoading && searchResults.length" >
      <v-card v-for="selectedItem of searchResults" variant="tonal" class="my-2" :color="cardColor(selectedItem.type)">
        <v-card-text>
          <div v-if="selectedItem.type === 'invoice'">
            <h3>Invoice {{ selectedItem.id }}</h3>
            <p>Work date: {{ toDateString(selectedItem.data.completion_date) }}</p>
            <br/>
            <h4>Customer Details:</h4>
            <p><strong>Name:</strong> {{ selectedItem.data.customer?.name }}</p>
            <p v-if="selectedItem.data.customer?.company"><strong>Company:</strong> {{ selectedItem.data.customer.company }}</p>
            <p><strong>Email:</strong> {{ selectedItem.data.customer?.email }}</p>
            <p><strong>Phone:</strong> {{ selectedItem.data.customer?.phone }}</p>
            <br/>
            <h4>Address Details:</h4>
            <p><strong>Line 1:</strong> {{ selectedItem.data.site.line_one }}</p>
            <p v-if="selectedItem.data.site.line_two"><strong>Line 2:</strong> {{ selectedItem.data.site.line_two }}</p>
            <p><strong>Postcode:</strong> {{ selectedItem.data.site.postcode }}</p>
            <p><strong>City:</strong> {{ selectedItem.data.site.city }}</p>
            <br/>
            <h4>Items Details:</h4>
            <v-list>
              <v-list-item v-for="item in (selectedItem.data.items as InvoiceItem[])">
                {{ item.title }}  £{{ item.unit_price }}
              </v-list-item>
            </v-list>
            
            <v-btn 
              color="primary" 
              @click="useAsInvoice(selectedItem.data)"
            >
              {{ buttonPrefix || 'Use this' }} invoice
            </v-btn>
          </div>

          <div v-else-if="selectedItem.type === 'customer'">
            <h3>Customer Details</h3>
            <p><strong>Name:</strong> {{ selectedItem.data?.name }}</p>
            <p v-if="selectedItem.data?.company"><strong>Company:</strong> {{ selectedItem.data.company }}</p>
            <p><strong>Email:</strong> {{ selectedItem.data?.email }}</p>
            <p><strong>Phone:</strong> {{ selectedItem.data?.phone }}</p>
            
            <v-btn 
              color="primary" 
              @click="useCustomer(selectedItem.data)"
              class="mt-2"
            >
              {{ buttonPrefix || 'Use this' }} customer
            </v-btn>
          </div>

          <div v-else-if="selectedItem.type === 'address'">
            <h3>Address Details</h3>
            <p><strong>Line 1:</strong> {{ selectedItem.data.line_one }}</p>
            <p><strong>Postcode:</strong> {{ selectedItem.data.postcode }}</p>
            <p><strong>City:</strong> {{ selectedItem.data.city }}</p>
            
            <div class="d-flex flex-column ga-2 mt-2">
              <v-btn 
                color="primary" 
                @click="useAsBillingAddress(selectedItem.data)"
              >
                {{ buttonPrefix || 'Use this' }} billing address
              </v-btn>
              <v-btn 
                color="secondary" 
                @click="useAsSiteAddress(selectedItem.data)"
              >
                {{ buttonPrefix || 'Use this' }} site address
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDebounce } from '@vueuse/core'
import { FuzzySearchResult, SearchServiceController } from '@shared/api'
import { toDateString } from '@shared/helpers'
import { InvoiceItem } from '@shared/schema'
import { InvoiceFilter } from '@/hooks'

const {filter = ['invoice' , 'customer' , 'address']} = defineProps<{
  filter?: [InvoiceFilter],
  buttonPrefix?: string
}>()

function cardColor(type: InvoiceFilter){
  switch(type){
    case 'address':
      return 'orange';
    case 'invoice':
      return 'green';
    default:
      return 'primary'
  }
}

const searchInput = ref('')
// const debouncedSearch = useDebounce(searchInput, 500)
const searchResults = ref<FuzzySearchResult[]>([])
const selectedItem = ref<any>(null)
const selectedItemActivator = ref(false);
const isLoading = ref<null | boolean>(null)

watch(selectedItem, (_item)=>{
  selectedItemActivator.value = !!_item
})


// Emits for parent component to handle selections
const emit = defineEmits([
  'pick'
])

// watch(debouncedSearch, async (val) => {
async function commitSearch(){
  if (!searchInput.value) {
    searchResults.value = []
    isLoading.value = null
    return
  }
  await onSearch(searchInput.value)
}
// })

async function onSearch(query: string) {
  isLoading.value = true
  try {
    const results = await SearchServiceController.fuzzySearchJob(query, { limit: 10 })
    console.log(results)
    searchResults.value = results.filter(r => filter.includes(r.type))
  } catch (error) {
    console.error('Search failed:', error)
    searchResults.value = []
  } finally {
    isLoading.value = false
  }
}

function useCustomer(customer: any) {
  emit('pick', customer)
  resetSearch()
}

function useAsBillingAddress(address: any) {
  emit('pick',address,'billing')
  resetSearch()
}

function useAsSiteAddress(address: any) {
  emit('pick',address,'site')
  resetSearch()
}

function useAsInvoice(invoice: any) {
  emit('pick',invoice)
  resetSearch()
}

function resetSearch() {
  searchInput.value = ''
  selectedItem.value = null
  searchResults.value = []
}
</script>