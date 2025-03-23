<template>
    <v-dialog activator="parent">
    
    <template v-slot:default="{ isActive}">
      <v-card>
          <v-card-title>
            Select Existing Customer
          </v-card-title>
          <v-card-text>
            <Table
              :tableName="'customers'"
              :query="{
                include: {
                  billing_address: true
                }
              }"
              @click:item="(item: Customer) => {
                $emit('selected', item);
                isActive.value = false
              }"
              :included="['name','address','contact']"
            >
              <template #name="{item}:{item:Customer}">
                {{ item.name }}{{ item.company ? `Company: ${item.company}` : '' }}
                <br/>
                <i>(ID:{{ item.id }})</i>
              </template>
              <template #address="{item}:{item: Customer}">
                <div class="d-flex flex-column py-1">
                  <span>{{ item?.billing_address?.line_one }}</span>
                  <span>{{ item?.billing_address?.city }}</span>
                  <span>{{ item?.billing_address?.postcode }}</span>
                </div>
                <i>(ID:{{ item.billing_address_id }})</i>
              </template>
              <template #contact="{item}:{item: Customer}">
                <ul>
                  <li v-if="item.email"><v-icon>mdi-email</v-icon> {{ item.email }}</li>
                  <li v-if="item.phone"><v-icon>mdi-phone</v-icon> {{ item.phone }}</li>
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
import { Customer } from '@shared/schema';
  
  defineEmits<{
    (e: 'selected', item: Customer): void
  }>()
  </script>
  
  <style>
  .capitalize {
    text-transform: capitalize;
  }
  </style>