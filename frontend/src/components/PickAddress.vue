<template>
  <v-dialog activator="parent">

    <template v-slot:default="{ isActive }">
      <v-card>
        <v-card-title>
          Select Existing Address
        </v-card-title>
        <v-card-text>
          <Table 
            :items="addresses" 
            :included="['line_one', 'city', 'postcode']"@click:item="(item: Address) => {
                $emit('selected', item);
                isActive.value = false
              }" >
            <template #address="{ item }: { item: Address }">
              <div class="d-flex flex-column py-1">
                <span>{{ item?.line_one }}</span>
              </div>
            </template>
            <template #city="{ item }: { item: Address }">
              <div class="d-flex flex-column py-1">
                <span>{{ item?.city }}</span>
              </div>
            </template>
            <template #postcode="{ item }: { item: Address }">
              <div class="d-flex flex-column py-1">
                <span>{{ item?.postcode }}</span>
              </div>
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
import { Address } from '@shared/schema';
import { FindOptions } from "remult"
import { onMounted, ref } from 'vue';
import {remult} from 'remult';

defineProps<{ billing?: boolean }>()

const addresses = ref<any[]>([])
 
onMounted(async () => {
  // First get all addresses
  const allAddresses = await remult.repo(Address).find();

  // Use a Map to filter duplicates based on line_one + postcode
  const uniqueAddressMap = new Map<string, Address>();

  for (const address of allAddresses) {
    const key = `${address.line_one.toLowerCase()}|${address.postcode.toLowerCase()}`;
    if (!uniqueAddressMap.has(key)) {
      uniqueAddressMap.set(key, address);
    }
  }

  // Convert Map values to array
  addresses.value = Array.from(allAddresses.values());
});

</script>

<style>
.capitalize {
  text-transform: capitalize;
}
</style>