<template>
  <v-app id="app">
    <template v-if="$route.path !== '/'">
      <v-app-bar color="primary">
        <!-- <v-btn variant="tonal" class="mx-2" @click="$router.back()"><v-icon>mdi-arrow-left</v-icon></v-btn> -->
        <v-btn variant="tonal" class="mx-2" @click="$router.push('/')"><v-icon>mdi-home</v-icon></v-btn>
        <b v-if="appBarTitle" class="text-center">{{appBarTitle }}</b>
      </v-app-bar>
    </template>
    <v-main>
      <router-view ></router-view>
      <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
        {{ snackbar.message }}
        <template v-slot:actions="{ isActive }">
          <v-btn text v-bind="isActive" @click="snackbar.show = false">
            Close
          </v-btn>
        </template>
      </v-snackbar>
    </v-main>
  </v-app>
</template>


<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, provide, reactive, Ref, inject } from 'vue'
import { useTheme } from 'vuetify'
import { repo } from 'remult'
import { Defaults } from '@shared/schema'
import { useTimeout, useTimeoutFn } from '@vueuse/core'

const devUser = {
  displayName: 'Tester',
  email: 'test@example.com',
  uid: 'dummy_uid'
}
provide('user',devUser)

const theme = useTheme()

function toggleTheme() {
theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}
provide('theme',toggleTheme)


const defs = ref()
onMounted(async ()=>{
  defs.value = await repo(Defaults).findFirst({platform: import.meta.env.VITE_PLATFORM})
})

useTimeoutFn(()=>{
  const currentHour = new Date().getHours();
  const isSummer = (new Date().getMonth() >= 5 && new Date().getMonth() <= 8); // June to September
  const darkThemeStart = isSummer ? 20 : 17; // 8 PM in summer, 6 PM in winter
  const darkThemeEnd = isSummer ? 6 : 7; // 6 AM in summer, 7 AM in winter

  theme.global.name.value = currentHour >= darkThemeStart || currentHour < darkThemeEnd ? 'dark' : 'light'

},60000, {immediate: true, immediateCallback: true})

if(import.meta.env.MODE === 'development') {
console.log('Development mode')
}

const appBarTitle = ref('Management');
provide('appBarTitle', appBarTitle);


const snackbar = reactive({
  show: false,
  message: '',
  color: 'success',
});
const showSnackbar = (message: string, color: string) => {
  snackbar.message = message;
  snackbar.color = color;
  snackbar.show = true;
};
provide('snackbar', showSnackbar)
// const { notificationVisible, notificationMessage } = useWebSocketNotifications();


</script>

<style scoped>
.logo {
height: 3rem;
}

.titlebar{
  display: grid;
  grid-template: "text title dummy" / 1fr 1fr 1fr;
}

.titlebar > *{
  grid-row-start: 1;
}
</style>

<style>
a {
  text-decoration: none;
  color: inherit;
}

.highlight-important {
  box-shadow: 0 0 10px red;
}
</style>