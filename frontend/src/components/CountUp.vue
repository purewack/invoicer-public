<template>
  <v-card
    ref="root"
    variant="tonal"
    class="counter"
    :color="color"
    :style="{opacity: !ratio ? 0.33 : 1}"
  >
    <!-- Narrow mode: show only title + optional small count -->
    <template v-if="isNarrow">
      <v-card-title class="text-wrap compact-title">
        {{ title }}
        <span class="compact-count"> {{ count }}</span>
      </v-card-title>
    </template>

    <!-- Short mode: show a horizontal bar with title and count -->
    <template v-else>
      <v-card-title class="text-wrap small-title">
        {{ title }}
        <span class="spacer" />
        <strong class="small-count">{{ count }}{{ total ? `/${total}` : '' }}</strong>
      </v-card-title>
      <v-card-text class="px-4 pb-3">
        <v-progress-linear v-if="total" :model-value="ratio" height="12" :color="color" />
      </v-card-text>
    </template>

    <!-- <template v-else>
      <v-card-title class="text-wrap">
        {{ title }}
      </v-card-title>
      <v-card-subtitle>
        {{ subtitle }}
      </v-card-subtitle>
      <v-card-text class="text-center">
        <v-progress-circular
          :model-value="ratio"
          :rotate="360"
          :size="100"
          :width="15"
          :color="color"
        >
          <template v-slot:default>
            {{ count }}{{ total ? `/${total}` : '' }}
          </template>
        </v-progress-circular>
      </v-card-text>
    </template> -->
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useDebounceFn } from '@vueuse/core';

const props = defineProps<{
  title: string,
  subtitle?: string,
  count: number,
  total?: number,
  color?: string,
  compactShowCount?: boolean, // optional prop if you want the small compact count inline
  narrowThreshold?: number,
  shortThreshold?: number
}>()

const root = ref<any | null>(null); // may be component instance OR HTMLElement

// normalize to a DOM element (handles Vuetify component refs)
const getRootEl = (): HTMLElement | null => {
  const val = root.value;
  if (!val) return null;
  // If this is a native Element
  if (val instanceof HTMLElement) return val;
  // If Vuetify/component proxy, it usually exposes $el
  if (val.$el && val.$el instanceof HTMLElement) return val.$el;
  // Fallback: try to find DOM by mounting node (rare)
  if (val.$ && (val.$.el as any) instanceof HTMLElement) return val.$.el as HTMLElement;
  return null;
};

const narrowThreshold = props.narrowThreshold ?? 160; // px
const shortThreshold = props.shortThreshold ?? 120; // px

const isNarrow = ref(false);
const isShort = ref(false);

const updateSize = () => {
  const el = getRootEl();
  if (!el) return;
  const w = el.clientWidth;
  const h = el.clientHeight;
  isNarrow.value = w < narrowThreshold;
  isShort.value = h < shortThreshold;
};

const debouncedUpdate = useDebounceFn(updateSize, 50);

let ro: ResizeObserver | undefined;

onMounted(async () => {
  // ensure DOM exists for components that render asynchronously
  await nextTick();
  updateSize();

  const el = getRootEl();
  if (el && 'ResizeObserver' in window) {
    ro = new ResizeObserver(debouncedUpdate);
    ro.observe(el); // safe: el is HTMLElement
  } else {
    window.addEventListener('resize', debouncedUpdate);
  }
});

onBeforeUnmount(() => {
  const el = getRootEl();
  if (ro && el) ro.unobserve(el);
  window.removeEventListener('resize', debouncedUpdate);
});

const ratio = computed(() => {
  if (props.total === undefined) return 100;
  if (props.total === 0) return 0;
  return Math.round((props.count / props.total) * 100);
});

</script>

<style scoped>


</style>