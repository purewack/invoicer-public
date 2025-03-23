<template>
<v-dialog activator="parent" max-width="90vw">
  <template #default="{isActive}">
    <v-card>
    <v-card-title>
      <v-icon>mdi-pin</v-icon> {{ props.address }} {{ props.city }}, {{ props.postcode }}
    </v-card-title>
    <v-card-text>
      <div
        ref="mapContainer"
        style="height: 70vh; width: 100%; margin-bottom: 16px"
      >
        <v-progress-circular
          v-if="isLoading"
          indeterminate
          color="primary"
          style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"
        ></v-progress-circular>
      </div>
      <v-alert v-if="hasError" type="error" dismissible>
        No results found for the entered address. Please check the address and try again.
      </v-alert>
    </v-card-text>
    <v-card-actions>
      <v-btn @click="isActive.value = false">
        Back
      </v-btn>
      <v-spacer/>

      <v-btn color="success" target="_blank" :href="mapsUrl" :disabled="hasError || isLoading">
        <v-icon left>mdi-open-in-new</v-icon>
        Google Maps
      </v-btn>

      <v-btn color="primary" target="_blank" :href="streetViewUrl" :disabled="hasError || isLoading">
        <v-icon left>mdi-google-maps</v-icon>
        Street View
      </v-btn>
    </v-card-actions>
  </v-card>
  </template>
</v-dialog> 
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import L from 'leaflet';

const props = defineProps({
  address: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  postcode: {
    type: String,
    default: ''
  }
});

const markerLatLng = ref(null);
const map = ref(null);
const marker = ref(null);
const showMap = ref(false);
const mapInitialized = ref(false);
const isLoading = ref(false);
const hasError = ref(false);
const defPos = ref([53.0465084, -2.9937869]);
const mapContainer = ref(null);
let resizeObserver = null;

const streetViewUrl = computed(() => {
  if (!markerLatLng.value) return '#';
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${markerLatLng.value.lat},${markerLatLng.value.lng}`;
});

const mapsUrl = computed(() => {
  if (!markerLatLng.value) return '#';
  const destination = `${markerLatLng.value.lat},${markerLatLng.value.lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
});

const tryShowMap = async () => {
  const addressValid = props.address && props.address.trim().length > 2;
  const postcodeValid = props.postcode && props.postcode.trim().length > 2;
  const cityValid = props.city && props.city.trim().length > 2;
  showMap.value = addressValid || postcodeValid || cityValid;
};

const setupResizeObserver = () => {
  resizeObserver = new ResizeObserver(() => {
    if (showMap.value && map.value) {
      fixMapRendering();
    }
  });
  resizeObserver.observe(mapContainer.value);
};

const fixMapRendering = () => {
  if (map.value) {
    map.value.invalidateSize();
    setTimeout(() => {
      map.value.invalidateSize(true);
    }, 50);
  }
};

const initMap = async () => {
  isLoading.value = true;
  hasError.value = false;
  try {
    const latlng = await geocode();
    if (latlng) {
      map.value = L.map(mapContainer.value).setView(latlng, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map.value);

      placeMarker(latlng);
      mapInitialized.value = true;
    } else {
      hasError.value = true;
      map.value = L.map(mapContainer.value).setView(defPos.value, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map.value);
      placeMarker(defPos.value);
      mapInitialized.value = true;
    }
  } finally {
    isLoading.value = false;
  }
};

const placeMarker = (latlng) => {
  if (marker.value) {
    map.value.removeLayer(marker.value);
  }

  markerLatLng.value = latlng;
  marker.value = L.marker(latlng).addTo(map.value);

  map.value.setView(latlng, map.value.getZoom());
};

const geocode = async () => {
  const searchQueryValue = `${props.address}, ${props.city}, ${props.postcode}`;
  if (!searchQueryValue || searchQueryValue.trim().length < 3) return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?addressdetails=1&format=json&q=${encodeURIComponent(
        searchQueryValue.replace(/\n/g, ',')
      )}`
    );
    const data = await response.json();

    if (data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Search failed:', error);
    return null;
  }
};

watch(() => [props.address, props.city, props.postcode], () => {
  tryShowMap();
}, { immediate: true });

watch(mapContainer, (_v)=>{
  if(!_v) return
  setupResizeObserver();
  initMap();
});

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove();
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});</script>

<style scoped>
@import 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

.preserve-whitespace {
  white-space: pre-wrap;
}
</style>