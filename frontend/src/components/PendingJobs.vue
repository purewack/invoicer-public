<template>
  <v-dialog max-width="1000">
    <template #activator="{ props }">
      <v-card v-if="totalItems"
        elevation="5"
        :color="$vuetify.theme.current.dark ? 'purple-darken-4' : 'purple-lighten-5'"
        v-bind="props"
        class="pending-jobs-card"
      >
        <v-card-title class="d-flex align-center">
          <v-icon color="purple" size="large" class="mr-2">mdi-alert-decagram</v-icon>
          <span class="text-h6">Requests</span>
          <v-badge class="ml-auto" color="error" :content="totalItems" location="end center" />
        </v-card-title>
        <v-card-text>
          Looks like there are new requests!
          <br />
          Click here to see.
        </v-card-text>
      </v-card>
    </template>

    <template #default="{ isActive }">
      <v-card >
        <v-card-title class="d-flex justify-space-between align-center flex-wrap pa-4">
          <h2 class="text-h5">Pending Quote Reviews</h2>
          <v-chip color="primary" variant="tonal">
            {{ totalItems }} Quote{{ totalItems !== 1 ? 's' : '' }}
          </v-chip>
        </v-card-title>

        <v-divider />

        <v-container class="pa-4">
          <v-row>
            <v-col v-for="item in items" :key="item.id" cols="12" :sm="items.length >= 3 ? 6 : 12" :md="items.length >= 3 ? 4 : 12">
              <v-card
                :variant="item.status === 'postponed' ? 'tonal' : 'outlined'"
                :color="item.status === 'postponed' ? 'warning' : undefined"
                :class="['quote-card', item.site_residential ? 'residential' : 'commercial']"
              >
                <v-card-item>
                  <template #prepend>
                    <v-icon :icon="!item.site_residential ? 'mdi-office-building' : 'mdi-home'" size="large" />
                  </template>
                  <v-card-title>{{ item.client_name }}{{ item.status === 'postponed' ? ' - POSTPONED' : '' }}</v-card-title>
                  <v-card-subtitle>
                    {{ item.site_line_one }}, {{ item.site_city }}
                  </v-card-subtitle>
                </v-card-item>

                <v-card-text>
                  <div class="d-flex flex-wrap justify-space-around ga-2">
                    <!-- Service Type -->
                    <div class="d-flex align-center">
                      <v-icon
                        :icon="item.requested_service === 'windows' ? 'mdi-window-closed-variant' : 'mdi-home'"
                        size="small"
                        class="mr-2"
                      />
                      <span class="text-body-1 capitalize">{{ getServiceText(item.requested_service as JobRequestTypes) || 'General Inquiry' }}</span>
                    </div>

                    <!-- Timestamp -->
                    <div class="d-flex align-center">
                      <v-icon icon="mdi-clock-outline" size="small" class="mr-2" />
                      <div class="d-flex flex-column">
                        <span class="text-caption">Submitted</span>
                        <span class="text-body-2 font-weight-medium">
                          {{ daysAgoText(item.created_at) }}
                        </span>
                      </div>
                    </div>

                    <!-- Reference Number -->
                    <div class="d-flex align-center">
                      <v-icon icon="mdi-pound" size="small" class="mr-2" />
                      <span class="text-caption">Reference:<br /> {{ getReferenceNumber(item.id, 'quote') }}</span>
                    </div>
                  </div>
                </v-card-text>

                <v-divider />

                <v-card-actions class="pa-4">
                  <v-btn>
                    Show Address <v-icon>mdi-magnify</v-icon>
                    <MapsPreview :postcode="item.site_postcode" :city="item.site_city" :address="item.site_line_one" />
                  </v-btn>
                  <v-spacer />
                  <RouterLink :to="{name:'quote-review', params: {id: item.id}}">
                    <v-btn class="text-none">
                      Review
                      <v-icon end>mdi-arrow-right</v-icon>
                    </v-btn>
                  </RouterLink>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-container>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-btn variant="text" @click="isActive.value = false">
            Close
          </v-btn>
          <v-spacer />
          <v-pagination
            v-if="totalPages > 1"
            v-model="currentPage"
            :length="totalPages"
            :total-visible="3"
            density="comfortable"
            @update:model-value="fetchData"
          />
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject } from 'vue';
import { getReferenceNumber, JobSummary, JobRequestTypes, broadcastMessageType } from '@shared/schema';
import { getDays } from '@shared/helpers';
import MapsPreview from './MapsPreview.vue';
import { JobController } from '@shared/api';
import { useRealtimeChannel } from '@/hooks';
import { watch } from 'vue';

const items = ref<JobSummary[]>([]);
const totalItems = ref(0);
const currentPage = ref(1);
const pageSize = 5;
const totalPages = ref(1);

const emit = defineEmits(['action']);

const sse = inject('realtimeChannel') as broadcastMessageType
watch(sse, (newEvent: broadcastMessageType)=>{
  if(newEvent.type === 'new-quote'){
    fetchData()
  }
})

onMounted(fetchData)

async function fetchData(page: number = 1) {
  try {
    const data = await JobController.getJobs(page, pageSize, {
      status: ['new','postponed']
    });
    items.value = data.items;
    totalItems.value = data.pagination.totalItems;
    totalPages.value = data.pagination.totalPages;
    currentPage.value = page;
    console.log("NEW",data)
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}


function daysAgoText(created_at: Date) {
  const days = getDays(created_at, Date.now());

  switch (days) {
    case 0:
      return 'Today';
    case 1:
      return days + ' day ago';
    default:
      return days + ' days ago';
  }
}

function getServiceText(service: JobRequestTypes) {
  switch (service) {
    case 'gutters':
      return 'Gutters Only';
    case 'gutters-package':
      return 'Full Gutter Package';
    case 'soffits':
      return 'Soffits Only';
    case 'windows':
      return 'Windows Only';
    default:
      return '';
  }
}
</script>

<style scoped>
.pending-jobs-card {
  transition: transform 0.2s;
}

.pending-jobs-card:hover {
  transform: translateY(-4px);
}

.quote-card {
  transition: all 0.2s ease;
  height: 100%;
}

.quote-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.quote-card.residential {
  border-left: 4px solid rgb(var(--v-theme-info));
}

.quote-card.commercial {
  border-left: 4px solid rgb(var(--v-theme-success));
}

.capitalize {
  text-transform: capitalize;
}

@media (max-width: 600px) {
  .v-card-actions {
    flex-direction: column;
    gap: 8px;
  }

  .v-card-actions .v-btn {
    width: 100%;
  }

  .v-spacer {
    display: none;
  }
}
</style>