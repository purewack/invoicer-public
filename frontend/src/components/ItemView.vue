<!-- src/components/ItemView.vue -->
<template>
  <div>
    <h1>{{ tableName }} #{{ id }}</h1>
    <pre>{{ item }}</pre>
    <router-link :to="`/api/data/${tableName}/${id}/edit`">Edit</router-link>
    <button @click="deleteItem">Delete</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const tableName = route.params.tableName;
const id = route.params.id;
const item = ref({});

onMounted(async () => {
  try {
    const response = await axios.get(`/api/data/${tableName}/${id}`);
    item.value = response.data;
  } catch (error) {
    console.error('Error fetching item:', error);
  }
});

const deleteItem = async () => {
  try {
    await axios.delete(`/api/data/${tableName}/${id}`);
    router.push(`/${tableName}`);
  } catch (error) {
    console.error('Error deleting item:', error);
  }
};
</script>