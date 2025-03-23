<template>
  <v-dialog v-model="isActive" max-width="500">
    <v-card>
      <!-- Title Slot -->
      <v-card-title class="text-h5">
        <slot name="title">Are you sure?</slot>
      </v-card-title>

      <!-- Content Slot -->
      <v-card-text>
        <slot name="content">
          This action cannot be undone. Are you sure you want to proceed?
        </slot>
      </v-card-text>

      <!-- Actions Slot -->
      <v-card-actions>
        <v-btn color="error" @click="cancel">Cancel</v-btn>
        <v-spacer></v-spacer>
        <slot name="actions">
          <v-btn color="success" @click="confirm">Confirm</v-btn>
        </slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, defineEmits } from 'vue';

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

// Emits
const emit = defineEmits(['update:modelValue', 'confirm']);

// Local state
const isActive = ref(props.modelValue);

// Watch for changes in `modelValue` to sync with `isActive`
watch(
  () => props.modelValue,
  (newValue) => {
    isActive.value = newValue;
  }
);

// Emit `update:modelValue` when dialog state changes
watch(
  () => isActive.value,
  (newValue) => {
    emit('update:modelValue', newValue);
  }
);

// Cancel action
function cancel() {
  isActive.value = false;
}

// Confirm action
function confirm() {
  emit('confirm');
  isActive.value = false;
}
</script>

<style scoped>
/* Add any custom styles here if needed */
</style>