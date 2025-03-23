<template>
    <template v-if="!data">
        <v-skeleton-loader type="heading"></v-skeleton-loader>
    </template>
    <template v-else>
        <div v-if="type === 'email'" v-html="data" class="email"></div>
        <div v-else>
            <pre class="text" >{{ data }}</pre>
        </div>
    </template>
</template>

<style scoped>
.mobile {
    max-width: 500px;
}
.email{
    max-width: 800px;
}

.text {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    padding: 16px;
    border-radius: 16px;
    background-color: rgb(67, 219, 118);
    color: white;
    max-width: 300px;
    white-space: pre-wrap; /* Preserve line breaks */
    word-wrap: break-word; /* Wrap long continuous text */
}
</style>

<script setup lang="ts">
import { watch } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps<{
    type: 'email' | 'sms',
    data?: string,
    contact: string
}>()


</script>