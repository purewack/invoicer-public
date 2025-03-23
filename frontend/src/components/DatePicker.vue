<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    transition="scale-transition"
    offset-y
    min-width="auto"
  >
    <template v-slot:activator="{ props }">
      <div v-bind="$attrs" class="w-100">
        <v-label v-if="label">{{ label }}</v-label><br/>
        <v-text-field
          v-if="typeof displayDate !== 'number'"
          :value="toDateString(displayDate)"
          readonly
          v-bind="props"
          :variant="variant"
          :rules="rules"
        ></v-text-field>
      </div>
    </template>

    <template v-slot:default="{isActive}">
    <v-card style="width: max-content;">
      <v-date-picker
        :min="allowOld || (!allowOld && !allowNew) ? undefined : getToday()"
        :max="allowNew || (!allowOld && !allowNew) ? undefined : getToday(false)"
        v-model="internalDate"
        @update:modelValue="onNewSelection"
        @input="menu = false"
      ></v-date-picker>

      <v-card-actions>
        <v-btn @click="isActive.value = false">Cancel</v-btn>
        <v-btn @click="internalDate = new Date()">Today</v-btn>
        <v-spacer/>
        <v-btn color="success" @click="onFinishSelection(isActive)">Ok</v-btn>
      </v-card-actions>
    </v-card>
    </template>
  </v-menu>
</template>

<script setup lang="ts">
import { Ref, ref, watch } from 'vue'
import { toDateString,toDateObject, getDays } from '@shared/helpers';

const props = defineProps<{
  modelValue: string | Date;
  label?: string;
  variant?: string;
  rules?: any;
  allowOld?: boolean;
  allowNew?: boolean;
}>()
const emit = defineEmits(['update:modelValue'])


const menu = ref(false)
const finalDate = ref(props.modelValue ?  props.modelValue : (new Date(new Date()).setHours(9, 0, 0, 0)))
const displayDate = ref(finalDate.value)
const internalDate = ref(!props.modelValue ? finalDate.value : null)

function onNewSelection(value: Date | string | number | null){
  internalDate.value = value
}
function onFinishSelection(isActiveModal: Ref<boolean>){
  if(!internalDate.value) return
    const adjustedDate = new Date(internalDate.value)
    adjustedDate.setHours(9, 0, 0, 0)
    isActiveModal.value = false
    finalDate.value = adjustedDate
}

watch(() => props.modelValue, (newVal) => {
  if(!newVal) return
  internalDate.value = toDateObject(newVal)!
  displayDate.value = toDateObject(newVal)!
},{immediate:true})

watch(finalDate, (newVal) => {
  displayDate.value = newVal
  emit('update:modelValue', newVal)
})
 

function getToday(day = true){
  const d = new Date()
  d.setHours(day ? 23 : 6, 0,0)
  return d.toDateString()
}
</script>