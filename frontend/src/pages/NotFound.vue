<template>
    <v-container class="fill-height" fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" md="8" lg="6" class="text-center">
          <v-card flat>
            <v-card-text>
              <!-- <div class="text-h1 font-weight-bold primary--text">404</div> -->
              <div class="text-h1 pb-4">Oops!<br/>Page not found</div>
              <div class="text-body-1 mt-2">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
              </div>
            </v-card-text>
            <v-card-actions class="justify-center">
              <v-btn
                color="primary"
                large
                depressed
                :to="{ name: 'Home' }"
              >
                <v-icon left>mdi-home</v-icon>
                Go to Homepage
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script>
  export default {
    name: 'NotFoundPage',
    metaInfo: {
      title: 'Page Not Found'
    }
  }
  </script>
  
  <style scoped>
  .fill-height {
    min-height: 100vh;
  }
  </style>