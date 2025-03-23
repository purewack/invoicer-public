<template>
  <v-dialog activator="parent">
    
    <template v-slot:default="{ isActive }">
      <v-card>
        <v-card-title>
          Select Existing Job
        </v-card-title>
        <v-card-text>
          <Table
            :tableName="'jobs'"
            :query="{ where: {
              status: {
                $in: ['ongoing','completed', 'concluded' ]
              }
            },
             include: {
              customer: {
                include: {
                  billing_address: true
                }
              },
              site_address: true
            }}"
            @click:item="$emit('selected',$event); isActive.value = false"
            :included="['address','customer','REF','items']"
          >
            <template #REF="{item}: {item: Job}">
              {{ getReferenceNumber(item.id,'job') }} / {{ item.status }}
            </template>
            <template #customer="{item}: {item: Job}">
              <v-icon>{{ item.customer?.company ? 'mdi-office-building' : 'mdi-account' }}</v-icon>{{ item.customer?.company || item.customer.name }}
            </template>
            <template #address="{item}: {item: Job}">
              <div class="d-flex flex-column py-1">
                <span>{{ item.site_address.line_one }}</span>
                <span>{{ item.site_address.city }}</span>
                <span>{{ item.site_address.postcode }}</span>
              </div>
            </template>
            <template #items="{item}: {item: Job}">
              <ul>
                <li v-for="ii in item.items">{{ ii.title }}</li>
              </ul>
            </template>
          </Table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="isActive.value = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
import Table from '@/components/Table.vue';
import { getReferenceNumber, Job } from '@shared/schema';
import { repo } from 'remult';
import { onMounted, ref } from 'vue';

defineEmits(['selected'])

</script>
