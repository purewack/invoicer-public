import { createApp } from 'vue'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css' // Ensure you are using css-loader

// Components
import App from './App.vue'
import router from './router';
import colors from 'vuetify/util/colors'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          secondary: colors.blue.lighten3,
          primary: colors.lightBlue.darken2, 
        }
      },
      dark: {
        colors: {
          primary: colors.indigo.darken1, 
          secondary: colors.purple.darken3,
        }
      },
    },
  },
})

createApp(App).use(vuetify).use(router).mount('#app')
