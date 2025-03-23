<template>
    <v-card variant="tonal" color="info">
      <v-card-title>
        <v-icon >mdi-calendar-clock</v-icon> Upcoming Tasks
      </v-card-title>
      <v-card-subtitle>Jobs scheduled for today and tomorrow</v-card-subtitle>
      <v-table v-if="scheduledJobs.length > 0">
        <thead>
          <tr>
        <th>Where</th>
        <th>When</th>
          </tr>
        </thead>
        <tbody >
          <tr
        v-for="jobCycle in scheduledJobs"
        :key="jobCycle.id"
        :to="`/job/${jobCycle.job_id}?cycle=${jobCycle.id}`"
        style="cursor: pointer"
        :style="{backgroundColor: 
          getDaysDiffTo(jobCycle.date) === 0 ? 'rgba(255, 170, 0, 0.66)' : 
          getDaysDiffTo(jobCycle.date) === 1 ? 'rgba(59, 204, 182, 0.46)' : ''}"
        @click="$router.push(`/job/${jobCycle.job_id}?cycle=${jobCycle.id}`)"
          >
        <td>
          <v-icon>{{ jobCycle.job.customer.company ? 'mdi-office-building' : 'mdi-account' }}</v-icon>
          {{ jobCycle.job.customer.name }} - {{ jobCycle.job.site_address.line_one }}
        </td>
        <td>
          {{ formatDate(jobCycle.date) }}
          <span v-if="jobCycle.time">{{ ' - ' + jobCycle.time }}</span>
        </td>
          </tr>
        </tbody>
      </v-table>
      <v-card-text v-else>No jobs scheduled for today or tomorrow.</v-card-text>
    </v-card>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, computed } from 'vue';
  import { JobController } from '@shared/api';
  import { JobCycle } from '@shared/schema';
  import { getDaysDiffTo, toDateString } from '@shared/helpers';
  
  const scheduledJobs = ref<JobCycle[]>([]);
  
  const fetchScheduledJobs = async () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
  
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1);
  
    try {
      // Fetch all job cycles
      scheduledJobs.value = (await JobController.getUpcomingCycles(4,0));

    } catch (error) {
      console.error('Failed to fetch scheduled jobs:', error);
    }
  };
  
  onMounted(fetchScheduledJobs);
  
  const formatDate = (date: Date) => {
    return toDateString(date);
  };
  </script>