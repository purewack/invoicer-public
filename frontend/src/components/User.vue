<template>
  <v-btn
    icon
    variant="tonal"
    class="profile-btn"
  >
    <v-avatar v-if="cachedPhotoURL" size="36">
      <v-img :src="cachedPhotoURL" alt="Profile picture" />
    </v-avatar>
    <v-icon v-else>mdi-account</v-icon>
  </v-btn>
     
</template>

<script setup lang="ts">
import { ref, onMounted, watch, inject, Ref } from 'vue';
import { User } from 'firebase/auth';

const user = inject('user') as Ref<User | null>
const cachedPhotoURL = ref<string | null>(null);
const cacheExpiryKey =  user.value?.uid + '-photoURLCacheExpiry';
const photoURLKey = user.value?.uid + '-photoURL'
const cacheDuration = 24 * 60 * 60 * 1000; // 24 hours

onMounted(() => {
  console.log("PFP user",user)
  loadCachedPhoto();
});

watch(
  () => user?.value?.photoURL,
  (newPhotoURL) => {
    if (newPhotoURL) {
      convertToDataURL(newPhotoURL).then(dataURL => {
        updateCachedPhoto(dataURL);
      });
    }
  }
);

async function convertToDataURL(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting to data URL:', error);
    return '';
  }
}

async function loadCachedPhoto() {
  const cachedExpiry = localStorage.getItem(cacheExpiryKey);
  const cachedURL = localStorage.getItem(photoURLKey);

  if (cachedExpiry && cachedURL) {
    const expiryTime = parseInt(cachedExpiry, 10);
    if (expiryTime > Date.now()) {
      console.log("using cached PFP")
      cachedPhotoURL.value = cachedURL;
    } else {
      console.log("using fresh picture")
      localStorage.removeItem(photoURLKey);
      localStorage.removeItem(cacheExpiryKey);
      await fetchAndCachePhoto();
    }
  } else {
    await fetchAndCachePhoto();
  }
}

async function fetchAndCachePhoto() {
  console.log("try fetching pfp")
  if (user?.value?.photoURL) {
    console.log("fetching pfp")
    const dataURLPromise = convertToDataURL(user.value.photoURL);
    dataURLPromise.then(dataURL => {
      updateCachedPhoto(dataURL);
      cachedPhotoURL.value = dataURL;
    });
  }
}

function updateCachedPhoto(dataURL: string) {
  localStorage.setItem(photoURLKey, dataURL.startsWith('data:text/html') ? '' : dataURL);
  localStorage.setItem(cacheExpiryKey, (Date.now() + cacheDuration).toString());
  cachedPhotoURL.value = dataURL;
  console.log("set new pfp")
}
</script>

<style scoped>
.user-menu {
  display: flex;
  align-items: center;
}

.profile-btn {
  transition: all 0.3s ease;
}

.profile-btn:hover {
  transform: scale(1.1);
}

.v-list {
  min-width: 200px;
}
</style>