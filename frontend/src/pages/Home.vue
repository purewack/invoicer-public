<script setup lang="ts">
import UserIcon from '@/components/User.vue'
import { computed, inject, nextTick, onMounted, reactive, ref, Ref, watch } from 'vue';
import CountUp from '@/components/CountUp.vue';
import { User } from 'firebase/auth';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from "vuetify";
import SearchBar from '@/components/SearchBar.vue';
import { capitalizeWords, formatCurrency, getDaysAgoText, getDaysDiffTo, isDaysPast, toDateString } from '@shared/helpers';
import { InvoiceController } from '@shared/api';
import { Defaults, getReferenceNumber, InvoiceSummary, SchemaCollection } from '@shared/schema';
import SlideIn from '@/wrappers/SlideIn.vue';
import { InvoiceFilter } from '@/hooks';
import { repo } from 'remult';
import { useWindowSize } from '@vueuse/core';
import logo from "../logo-comp.jpeg"

const router = useRouter()
const windowsSize = useWindowSize()
const isMobile = computed(()=>windowsSize.width.value < 600)

const isDev = (import.meta.env.MODE === 'development')
const appBarTitle = inject('appBarTitle') as Ref<string>
appBarTitle.value = ''


const defs = ref()
onMounted(async () => {
  defs.value = await repo(Defaults).findFirst({ platform: import.meta.env.VITE_PLATFORM })
})

const user = inject('user') as User
const logout = inject('logout') as () => void
const toggleTheme = inject('theme') as () => void
const display = useDisplay()
const drawer = ref(false)
const tab = ref(router.currentRoute.value.query?.tab || 'overview')

const route = useRoute()
watch(() => route.query, (_q) => {
  if (_q?.tab) tab.value = _q.tab

  if (_q?.highlight?.includes('INV')) {
    tab.value = 'invoices'
  }

}, { deep: true, immediate: true })

const searchFilter = ref<null | InvoiceFilter>()



// --- Reactive State ---
const pool = reactive({
  data: {
    items: [],
    pagination: {
      currentPage: 1,
      pageSize: 1,
      totalItems: 0,
      totalPages: 0,
    },
  } as SchemaCollection<InvoiceSummary>,
  type: undefined as 'paid' | 'unpaid' | 'overdue' | undefined,
});

const invoiceGroupCounts = reactive({
  paid: 0,
  unpaid: 0,
  overdue: 0,
  total: 0,
});

const currentPage = ref(1);
const highlightedInvoice = ref<string | null>(null);

const pageSize = 5;
const invoiceTypes = ['paid', 'unpaid', 'overdue'] as const;
const invoiceStates = ['paid', 'unpaid', 'overdue'] as const;

const hasInvoices = computed(() => pool.data.items && pool.data.items.length > 0);

const selectedInvoice = ref<string | null>(null)
const toggleRow = (id: string) => {
  selectedInvoice.value = selectedInvoice.value === id ? null : id
}

const poolTypeToName = (status?: typeof invoiceTypes[number]) => {
  if (status === 'overdue') return 'Overdue';
  if (status === 'paid') return 'Paid';
  if (status === 'unpaid') return 'Unpaid';
  return 'All Invoices';
};

const setInvoiceType = async (status?: typeof invoiceTypes[number]) => {
  pool.type = status;
  currentPage.value = 1; // Reset to first page when changing type
  await fetchInvoices();
};

const fetchInvoices = async (page: number = 1) => {
  currentPage.value = page;
  let data;

  if (pool.type === 'overdue') {
    data = await InvoiceController.getOverdueInvoices(page, pageSize);
  } else {
    const query =
      pool.type === 'unpaid'
        ? InvoiceController.queryStatusUnpaid
        : pool.type === 'paid'
          ? InvoiceController.queryStatusPaid
          : undefined;
    data = await InvoiceController.getInvoices(page, pageSize, query);
  }

  Object.assign(pool.data, data);
};

const navigateToInvoice = (id: string) => {
  router.push({
    name: 'invoice',
    params: { invoiceId: id },
  });
};

const editToInvoice = (id: string) => {
  router.push({
    name: 'invoice-edit',
    params: { invoiceId: id },
  });
};

const cloneFromInvoice = (id: string) => {
  router.push({
    name: 'invoice-clone',
    params: { invoiceId: id },
  });
};


const getDueColor = (date: Date) => {
  const d = new Date(date);
  if (Date.now() >= d.getTime()) return 'error';
  else if (d.getTime() - Date.now() < 1000 * 60 * 60 * 24 * 2) return 'warning';
  return 'success';
};

const getPaymentWindowText = (invoice: InvoiceSummary) => {
  const daysLeft = getDaysDiffTo(invoice.due_date);
  if (invoice.status === 'paid') return '';
  if (daysLeft < 0) return `${Math.abs(daysLeft)} days Overdue`;
  else if (daysLeft === 0) return 'End of Today';
  else if (daysLeft === 1) return 'Tomorrow';
  return `${daysLeft} days Remaining`;
};

const isOverdue = (invoice: InvoiceSummary) => {
  return getDaysDiffTo(invoice.due_date) < 0 && invoice.status === 'unpaid'
}

const scrollToInvoice = async (invoiceId: string) => {
  highlightedInvoice.value = invoiceId;
  await nextTick(); // Wait for DOM to update

  const element = document.getElementById(`invoice_card_${invoiceId}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

const onPageChange = async (page: number) => {
  await fetchInvoices(page);
};

// --- Lifecycle Hooks ---
onMounted(async () => {
  // Fetch initial data
  await fetchInvoices();

  // Fetch invoice counts
  const countsInvoice = await InvoiceController.countInvoiceStates();
  Object.assign(invoiceGroupCounts, countsInvoice);

  // Check for showInvoice in route params
  const showInvoice = route.query.showInvoice as string;
  if (showInvoice) {
    // Find the page containing the invoice
    let page = 1;
    while (page <= pool.data.pagination.totalPages) {
      const tempInvoices = await InvoiceController.getInvoices(page, pageSize);
      if (tempInvoices.items.find((i) => i.id === showInvoice)) {
        break; // Found the page
      }
      page++;
    }

    // Navigate to the correct page and scroll
    await fetchInvoices(page);
    scrollToInvoice(showInvoice);
  }
});



watch(() => route.query, (_q) => {
  if (_q?.filter && ['unpaid', 'overdue'].includes(_q.filter as string) && _q.tab === 'invoices') {
    pool.type = _q.filter as 'unpaid' | 'overdue'
    fetchInvoices()
  }
  else if(_q?.filter === 'paid'){
    setInvoiceType('paid')
  }
  else {
    setInvoiceType(undefined)
  }
  if (_q?.highlight?.includes('INV')) {
    const id = _q?.highlight as string
    router.replace({
      query: {
        highlight: undefined,
      }
    })
    highlightedInvoice.value = id
    setTimeout(() => {
      highlightedInvoice.value = null
    }, 2000)
  }
}, { deep: true })
</script>

<template>
  <v-container class="fill-height">

    <v-app-bar :elevation="2" color="primary" density="prominent">

      <v-app-bar-title>
        <div class="h-100 d-flex flex-column">
          <div class="d-flex align-center justify-space-between">
            <router-link to="/">
              <div class="d-flex ga-4 align-center mt-2">
                <img :src="logo" class="logo" height="70"></img>
                <p>
                  <b class="text-wrap">
                    <span>Invoicer</span>
                  </b><br />
                  <span>Management Panel</span>
                </p>
              </div>
            </router-link>
            <UserIcon class="mr-2" @click="drawer = !drawer" />
          </div>
          <!-- <v-tabs v-model="tab" @update:model-value="$router.replace({query: {tab: $event as string}}); console.log('tab switch',$event)" height="32" class="mt-2" style="align-self: center;">
            <v-tab value="overview">Overview</v-tab>
            <v-tab value="invoices">Invoices</v-tab>
          </v-tabs> -->
        </div>
      </v-app-bar-title>
    </v-app-bar>
    <v-navigation-drawer v-model="drawer" location="right">
      <v-card color="primary" variant="tonal" class="ma-2">
        <v-card-title class="text-center">
          Current User
        </v-card-title>
        <v-card-text class="d-flex ga-2 align-center flex-column">
          <v-dialog max-width="300">
            <template #activator="{ props }">
              <!-- <v-btn v-bind="props" variant="tonal" color="secondary">Log Out</v-btn> -->
            </template>
            <template #default="{ isActive }">
              <v-card>
                <v-card-title>Log out?</v-card-title>
                <v-card-actions>
                  <v-btn @click="logout" class="text-error">
                    <template v-slot:prepend>
                      <v-icon icon="mdi-logout"></v-icon>
                    </template>
                    Yes
                  </v-btn>
                  <v-spacer />
                  <v-btn @click="isActive.value = false">No</v-btn>
                </v-card-actions>
              </v-card>
            </template>
          </v-dialog>
          <br />
          <b>{{ user.displayName }}</b><br />
          {{ user.email }}
        </v-card-text>
      </v-card>

      <!-- <v-list-item :to="{ name: 'invoice-new' }">
        <v-icon color="green">mdi-cash</v-icon> Create invoice
      </v-list-item>
      <v-list-item :to="{ name: 'email-info' }">
        <v-icon>mdi-pencil</v-icon> Change email template
      </v-list-item>
      <v-list-item :to="{ name: 'payment-info' }">
        <v-icon>mdi-bank</v-icon> Change payment options
      </v-list-item>
      <v-list-item :to="{ name: 'image-info' }">
        <v-icon color="primary">mdi-image-multiple</v-icon> Update images
      </v-list-item> -->


      <!-- <template v-slot:append>
        <v-list-item @click="toggleTheme" class="mt-auto">
          <template v-slot:prepend>
            <v-icon icon="mdi-theme-light-dark"></v-icon>
          </template>
          <v-list-item-title>Theme</v-list-item-title>
        </v-list-item>
      </template> -->
    </v-navigation-drawer>

    <v-row>
      <v-col cols="12">
        <SearchBar button-prefix="Show" :filter="['invoice']"
          @pick="router.push({ name: 'invoice', params: { invoiceId: $event.id } })" />
      </v-col>

      <v-col cols="12" class="position-relative">
        <div class="mt-4 d-flex flex-column ga-4 position-sticky" style="top: 9rem;">


        </div>
      </v-col>
      <v-col cols="12" >
        <div class="d-flex flex-column flex-sm-row flex-wrap ga-2">

        <v-btn :to="{ name: 'invoice-new' }" size="x-large" variant="tonal" color="success">
            <v-icon>mdi-file-check</v-icon>
            <p>Create New</p>
        </v-btn>
        <v-spacer/>
        <div  class="d-flex flex-column flex-sm-row flex-wrap ga-2">
          <CountUp @click="$router.replace({query: {tab:'invoices',filter:''}})" title="All Invoices" mode="total-invoices" 
            :count="invoiceGroupCounts.total" color="primary"/> 

          <CountUp @click="$router.replace({ query: { tab: 'invoices', filter: 'paid' } })" title="Paid Invoices"
            :count="invoiceGroupCounts.paid" :total="invoiceGroupCounts.total" color="success" />
          
          <CountUp @click="$router.replace({ query: { tab: 'invoices', filter: 'unpaid' } })" title="Unpaid Invoices"
            :count="invoiceGroupCounts.unpaid" :total="invoiceGroupCounts.total" color="warning" />
    
          <CountUp @click="$router.replace({ query: { tab: 'invoices', filter: 'overdue' } })" title="Overdue Invoices"
            :count="invoiceGroupCounts.overdue" :total="invoiceGroupCounts.total" color="error" />
        </div>
        </div>
      </v-col>
      <!-- <v-col cols="12" sm="8">
        <v-card class="w-100">
          <v-card-title class="d-flex flex-wrap align-center justify-space-between">
            <div class="d-flex flex-column">
              <h1 class="ml-4">
                <v-icon color="green">mdi-cash</v-icon>Invoices
              </h1>
              <v-card-subtitle class="text-wrap">Manage invoices and payments here.</v-card-subtitle>
            </div>
            <div class="d-flex flex-wrap flex-md-column align-end">


            </div>
          </v-card-title>
          <v-card-text>


          </v-card-text>
          <v-card-actions>
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn variant="text" v-bind="props" class="text-h6">
                  Showing: {{ poolTypeToName(pool.type) }}
                  <v-icon end>mdi-menu-down</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item v-for="status in invoiceTypes" :key="status" @click="setInvoiceType(status)">
                  <v-list-item-title>
                    <span class="text-capitalize"> {{ poolTypeToName(status) }}</span>
                  </v-list-item-title>
                </v-list-item>
                <v-divider class="my-1" />
                <v-list-item @click="setInvoiceType(undefined)">
                  <v-list-item-title>
                    <span>All Invoices</span>
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-card-actions>
        </v-card>
      </v-col> -->
      <v-col cols="12">
        <v-row>
          <v-col>
            <v-label>Showing: {{ poolTypeToName(pool.type) }}</v-label>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-data-table v-if="!isMobile" :headers="[
              { title: 'Invoice #', key: 'id', width: '220px' },
              { title: 'Customer', key: 'customer_name' },
              { title: 'Amount', key: 'due_total', width: '120px' },
              { title: 'Status', key: 'status', width: '100px' },
              { title: 'Due Date', key: 'due_date', width: '140px' },
            ]" :items="pool.data.items" :items-per-page="pageSize" hide-default-footer density="comfortable">
              <!-- custom item row that toggles actions -->
              <template #item="{ item }">
                <tr @click="toggleRow(item.id)" class="cursor-pointer">
                  <td><strong>#{{ getReferenceNumber(item.id, 'invoice') }}</strong></td>
                  <td>{{ capitalizeWords(item.customer_name) }}</td>
                  <td>{{ formatCurrency(item.due_total) }}{{ item.payment_amount && item.payment_amount < item.due_total
                    ? ` (${formatCurrency(item.payment_amount)})` : '' }}</td>
                  <td>
                    <v-chip :color="item.status === 'paid' ? 'success' : !isOverdue(item) ? 'warning' : 'error'"
                      size="small" class="text-capitalize">
                      {{ isOverdue(item) ? 'Overdue' : item.status }}
                    </v-chip>
                  </td>
                  <td>
                    <div class="d-flex flex-column ga-1">
                      <span>{{ toDateString(item.due_date) }}</span>
                      <span class="text-caption text-disabled">{{ getPaymentWindowText(item) }}</span>
                    </div>
                  </td>
                  <td class="text-right">
                    <v-icon small>{{ selectedInvoice === item.id ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                  </td>
                </tr>

                <!-- expandable action row -->
                <tr v-show="selectedInvoice === item.id" class="action-row">
                  <td colspan="6">
                    <div class="d-flex ga-2">
                      <v-spacer />
                      <v-btn size="small" variant="tonal" color="success"
                        @click.stop="navigateToInvoice(item.id)">Open</v-btn>
                      <v-btn v-if="item.status !== 'paid'" size="small" variant="tonal" color="primary"
                        @click.stop="editToInvoice(item.id)">Edit</v-btn>
                      <v-btn size="small" variant="tonal" color="warning"
                        @click.stop="cloneFromInvoice(item.id)">Clone</v-btn>
                      <v-spacer />
                    </div>
                  </td>
                </tr>
              </template>

              <template v-slot:no-data>
                <div class="pa-4 text-center">No invoices found matching the current filter.</div>
              </template>
            </v-data-table>


            <!-- Mobile list -->
            <div v-else class="mobile-invoice-list">
              <div v-for="item in pool.data.items" :key="item.id" class="mb-3">
                <v-card outlined>
                  <v-card-text class="d-flex align-center justify-space-between" @click="toggleRow(item.id)"
                    style="cursor:pointer">
                    <div>
                      <div><strong>#{{ getReferenceNumber(item.id, 'invoice') }}</strong> — {{
                        capitalizeWords(item.customer_name) }}</div>
                      <div class="text-caption text-disabled">{{ toDateString(item.due_date) }} · {{
                        getPaymentWindowText(item) }}</div>
                    </div>
                    <div class="text-right">
                      <div>{{ formatCurrency(item.due_total) }}</div>
                      <v-chip :color="item.status === 'paid' ? 'success' : !isOverdue(item) ? 'warning' : 'error'"
                        size="small" class="text-capitalize mt-1">
                        {{ isOverdue(item) ? 'Overdue' : item.status }}
                      </v-chip>
                    </div>
                  </v-card-text>

                  <v-expand-transition>
                    <v-card-text v-show="selectedInvoice === item.id">
                      <div class="d-flex flex-wrap gap-2">
                        <v-btn size="small" variant="tonal" color="success"
                          @click.stop="navigateToInvoice(item.id)">Open</v-btn>
                        <v-btn v-if="item.status !== 'paid'" size="small" variant="tonal" color="primary"
                          @click.stop="editToInvoice(item.id)">Edit</v-btn>
                        <v-btn size="small" variant="tonal" color="warning"
                          @click.stop="cloneFromInvoice(item.id)">Clone</v-btn>
                        <!-- optional: more compact menu instead of inline buttons -->
                        <v-spacer />
                      </div>
                    </v-card-text>
                  </v-expand-transition>
                </v-card>
              </div>
            </div>

          </v-col>
        </v-row>
        <v-row v-if="pool.data.pagination.totalPages >= 2">
          <v-card class="w-100">
            <v-pagination :total-visible="5" v-model="currentPage" :length="pool.data.pagination.totalPages"
              @update:model-value="onPageChange"></v-pagination>
          </v-card>
        </v-row>
      </v-col>
    </v-row>

  </v-container>
</template>


<style>
.show-change {
  animation: flash 1.5s 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation-iteration-count: 1;
}

@keyframes flash {
  50% {
    background-color: rgba(var(--v-theme-primary), 0.2);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
    transform: translateY(-4px);
  }

  100% {
    background-color: transparent;
    box-shadow: var(--v-shadow-key-umbra-opacity, 0.2) 0px 2px 4px -1px,
      var(--v-shadow-key-penumbra-opacity, 0.14) 0px 4px 5px 0px,
      var(--v-shadow-key-ambient-opacity, 0.12) 0px 1px 10px 0px;
    transform: translateY(0);
  }
}

.dashboard {
  display: flex;
  gap: 16px;
  justify-content: start;
  flex-wrap: wrap;
  padding: 2px;
}

.dashboard>* {
  flex-grow: 1;
}

.dashboard-grid {
  display: grid !important;
  padding: 8px;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, max-content);
  height: 100%;
}

.logo {
  border-radius: 1rem;
}
</style>