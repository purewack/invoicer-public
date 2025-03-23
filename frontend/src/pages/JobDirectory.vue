<template>
  <v-container>
    <v-card>
      <v-card-title>
        <v-icon color="primary" class="mr-2">mdi-format-list-bulleted</v-icon>
        All Jobs
      </v-card-title>
      <v-card-subtitle>
        Browse all jobs, their status, customer, address, invoices, and cycles.
      </v-card-subtitle>
      <v-divider class="mb-2"/>
      <v-skeleton-loader v-if="loading" type="table"/>
      <v-table v-else>
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Site Address</th>
            <th>Customer</th>
            <th>Invoices</th>
            <th>Cycles</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="job in jobs" :key="job.id">
            <td>
              <span class="text-caption">{{ job.id }}</span>
            </td>
            <td>
              <v-icon :color="statusColor(job.status)" small>mdi-circle</v-icon>
              <span class="text-caption">{{ job.status }}</span>
            </td>
            <td>
              <div>{{ job.site.line_one }}</div>
              <div class="text-caption">{{ job.site.city }}, {{ job.site.postcode }}</div>
            </td>
            <td>
              <div>{{ job.customer.name }}</div>
              <div class="text-caption" v-if="job.customer.company">{{ job.customer.company }}</div>
            </td>
            <td>
              <v-chip color="info" size="small" variant="tonal" @click="showInvoices(job)">
                <v-icon start small>mdi-receipt</v-icon>
                {{ job.invoices?.length || 0 }}
              </v-chip>
            </td>
            <td>
            
              <v-dialog  max-width="600">
                <template #activator="{props}">
                  <v-chip color="success" size="small" variant="tonal" v-bind="props">
                    <v-icon start small>mdi-calendar-clock</v-icon>
                    {{ job.cycles?.length || 0 }}
                  </v-chip>
                </template>
                <template #default="{isActive}">
                <v-card>
                  <v-card-title>
                    Cycles for Job <span class="font-mono ml-2">{{ job.id }}</span>
                  </v-card-title>
                  <v-divider/>
                  <v-table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="cycle in job?.cycles || []" :key="cycle.id">
                        <td>{{ formatDate(cycle.date) }}</td>
                        <td>{{ cycle.time || '-' }}</td>
                        <td><router-link :to="{name: 'job', params:{id: job.id}, query: {cycle: cycle.id}}">
                          <v-icon>mdi-open-in-new</v-icon>
                        </router-link></td>
                      </tr>
                      <tr v-if="!job?.cycles?.length">
                        <td colspan="3" class="text-center">No cycles for this job.</td>
                      </tr>
                    </tbody>
                  </v-table>
                  <v-card-actions>
                    <v-spacer/>
                    <v-btn @click="isActive.value = false">Close</v-btn>
                  </v-card-actions>
                </v-card>
                </template>
              </v-dialog>
            </td>
            <td>
              <span class="text-caption">{{ formatDate(job.created_at) }}</span>
            </td>
            <td>
              <RouterLink :to="`/job/${job.id}`">
                <v-btn icon size="small" variant="text">
                  <v-icon>mdi-open-in-new</v-icon>
                </v-btn>
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </v-table>
      <v-pagination
        v-if="pagination.totalPages > 1"
        v-model="currentPage"
        :length="pagination.totalPages"
        class="mt-4"
        @update:model-value="fetchJobs"
      />
    </v-card>

    <!-- Invoices Modal -->
    <v-dialog v-model="invoiceDialog" max-width="700">
      <v-card>
        <v-card-title>
          Invoices for Job <span class="font-mono ml-2">{{ selectedJob?.id }}</span>
        </v-card-title>
        <v-divider/>
        <v-table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inv in selectedJob?.invoices || []" :key="inv.id">
              <td><span class="font-mono">{{ inv.id }}</span></td>
              <td>{{ inv.status }}</td>
              <td>{{ formatDate(inv.due_date) }}</td>
              <td>{{ inv.due_total }}</td>
              <td>
                <RouterLink :to="`/invoice/${inv.id}`">
                  <v-btn icon size="small" variant="text">
                    <v-icon>mdi-open-in-new</v-icon>
                  </v-btn>
                </RouterLink>
              </td>
            </tr>
            <tr v-if="!selectedJob?.invoices?.length">
              <td colspan="5" class="text-center">No invoices for this job.</td>
            </tr>
          </tbody>
        </v-table>
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="invoiceDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, Ref, inject } from 'vue';
import { JobController } from '@shared/api';
import { toDateString } from '@shared/helpers';

const appTitle = inject('appBarTitle') as Ref<string>
appTitle.value = 'Job Directory'

const jobs = ref<any[]>([]);
const pagination = ref({
  currentPage: 1,
  pageSize: 25,
  totalItems: 0,
  totalPages: 1,
});
const currentPage = ref(1);

const loading = ref(false);

const invoiceDialog = ref(false);
const cycleDialog = ref(false);
const selectedJob = ref<any>(null);

function statusColor(status: string) {
  switch (status) {
    case 'new': return 'grey';
    case 'reviewing': return 'orange';
    case 'reviewed': return 'blue';
    case 'arranged': return 'purple';
    case 'confirmed': return 'teal';
    case 'ongoing': return 'green';
    case 'completed': return 'success';
    case 'concluded': return 'red';
    case 'postponed': return 'amber';
    case 'rejected': return 'red';
    default: return 'grey';
  }
}

function formatDate(date: string | Date) {
  return toDateString(date);
}

async function fetchJobs(page = 1) {
  loading.value = true;
  try {
    const res = await JobController.getJobDirectory(page, pagination.value.pageSize);
    jobs.value = res.items;
    pagination.value = res.pagination;
    currentPage.value = res.pagination.currentPage;
  } finally {
    loading.value = false;
  }
}

function showInvoices(job: any) {
  selectedJob.value = job;
  invoiceDialog.value = true;
}
function showCycles(job: any) {
  selectedJob.value = job;
  cycleDialog.value = true;
}

onMounted(() => fetchJobs());
</script>