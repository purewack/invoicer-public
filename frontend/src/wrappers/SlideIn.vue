<script setup lang="ts">
import { useElementVisibility } from '@vueuse/core';
import { ref, useTemplateRef, watch } from 'vue';

const props = defineProps<{always?: boolean, skip?:boolean}>()

const skipped = ref(false)
const container = useTemplateRef('container-ref')
const isVisible = useElementVisibility(container)
const shouldEnter = ref(false)

watch(()=>props.skip, (_s)=>{
  if(_s) skipped.value = true
},{immediate: true})

watch(isVisible, (_new)=>{
    if(props.always || _new)
        shouldEnter.value = _new
})
</script>
<template>
    <div ref="container-ref" class="slide-in-container">
        <slot :class="!skipped ? (shouldEnter ? 'enter-anim' : 'default') : ''"></slot>
    </div>
</template>

<style>
@keyframes kf-enter {
  from {
    opacity: 0;
    transform: translate(-1rem, 0);
  }
}
.enter-anim{
  animation: kf-enter 1s;
}
.default {
  opacity: 0;
}
</style>