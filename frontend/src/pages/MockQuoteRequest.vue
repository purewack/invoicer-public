<template>
    <v-container>
      <h1>Quote Request Data Generator</h1>
      <p>Generate fake data for testing the /api/quote/new-request endpoint</p>
  
      <v-card>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <label for="jobType">Job Type:</label>
              <v-select
                id="jobType"
                v-model="jobType"
                :items="['windows', 'gutters']"
                outlined
                dense
              ></v-select>
            </v-col>
  
            <v-col cols="12">
              <v-checkbox
                id="includeCompany"
                v-model="includeCompany"
                label="Include Company:"
              ></v-checkbox>
            </v-col>
  
            <v-col cols="12">
              <v-checkbox
                id="includeFeatures"
                v-model="includeFeatures"
                label="Include Property Features:"
              ></v-checkbox>
            </v-col>
  
            <v-col cols="12">
              <label for="country">Country:</label>
              <v-select
                id="country"
                v-model="country"
                :items="['gb', 'us', 'ca', 'au']"
                outlined
                dense
              ></v-select>
            </v-col>
          </v-row>
  
          <v-row>
            <v-col cols="12">
              <v-btn @click="generateData" :disabled="generateBtnDisabled" :loading="isLoading">
                Generate Data
              </v-btn>
              <v-btn @click="copyToClipboard" :disabled="copyBtnDisabled">
                Copy to Clipboard
              </v-btn>
              <v-btn @click="postData" :disabled="postBtnDisabled" color="success">
                Post Data to API
              </v-btn>
            </v-col>
          </v-row>
  
          <v-row>
            <v-col cols="12">
              <div class="status" id="status">{{ statusText }}</div>
            </v-col>
          </v-row>
  
          <v-row>
            <v-col cols="12">
              <v-textarea
                id="output"
                v-model="output"
                readonly
                outlined
                rows="10"
              ></v-textarea>
            </v-col>
          </v-row>
  
          <v-row v-if="showResponse">
            <v-col cols="12">
              <h3>API Response:</h3>
              <pre id="apiResponse">{{ apiResponse }}</pre>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-container>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        jobType: 'windows',
        includeCompany: true,
        includeFeatures: true,
        country: 'gb',
        output: '',
        statusText: 'Ready',
        apiResponse: '',
        showResponse: false,
        generateBtnDisabled: false,
        copyBtnDisabled: false,
        postBtnDisabled: true,
        isLoading: false,
        ukPostcodes: ['SW1A 1AA', 'M1 1AF', 'B1 1AA', 'LS1 1AA', 'G1 1AA', 'L1 1AA', 'BS1 1AA'],
        propertyTypes: ['Detached', 'Semi-detached', 'Terraced', 'Flat', 'Bungalow', 'Cottage'],
        features: ['Garden', 'Garage', 'Conservatory', 'Loft', 'Fireplace', 'Solar panels', 'Swimming pool']
      };
    },
    methods: {
      async generateData() {
        try {
          this.generateBtnDisabled = true;
          this.postBtnDisabled = true;
          this.statusText = 'Fetching data from APIs...';
          this.showResponse = false;
          this.isLoading = true;
  
          // Fetch random user data
          const userResponse = await axios.get(`https://randomuser.me/api/?nat=${this.country}`);
          const user = userResponse.data.results[0];
  
          // Fetch company/address data
          let company = null;
          let address = null;
          let city = null;
          let postcode = null;
  
          try {
            const fakerResponse = await axios.get('https://fakerapi.it/api/v1/companies?_quantity=1');
            if (fakerResponse.data.data && fakerResponse.data.data.length > 0) {
              company = this.includeCompany ? fakerResponse.data.data[0].name : null;
  
              const addressResponse = await axios.get('https://fakerapi.it/api/v1/addresses?_quantity=1');
              if (addressResponse.data.data && addressResponse.data.data.length > 0) {
                address = `${addressResponse.data.data[0].street}, ${addressResponse.data.data[0].streetName}`;
                city = addressResponse.data.data[0].city;
                postcode = addressResponse.data.data[0].zipcode;
              }
            }
          } catch (e) {
            console.log('Using fallback data for company/address');
          }
  
          // Fallback if any data is missing
          if (!address) {
            address = `${user.location.street.number} ${user.location.street.name}`;
            city = user.location.city;
            postcode = this.country === 'gb' ?
              this.ukPostcodes[Math.floor(Math.random() * this.ukPostcodes.length)] :
              user.location.postcode;
          }
  
          // Generate property features if needed
          const propertyFeatures = this.includeFeatures ?
            [...new Set(Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () =>
              this.features[Math.floor(Math.random() * this.features.length)]))] : null;
  
          // Construct the final data object
          const data = {
            name: `${user.name.first} ${user.name.last}`,
            company: company,
            address: address,
            postcode: postcode,
            city: city,
            email: user.email,
            phone: user.phone.replace(/[^\d]/g, '').slice(0, 11), // Clean phone number
            'property-rooms': Math.floor(Math.random() * 6) + 1,
            'property-type': this.propertyTypes[Math.floor(Math.random() * this.propertyTypes.length)],
            'property-features': propertyFeatures,
            job: this.jobType
          };
  
          this.output = JSON.stringify(data, null, 2);
          this.statusText = 'Data generated successfully!';
          this.postBtnDisabled = false;
        } catch (error) {
          console.error('Error generating data:', error);
          this.statusText = 'Error generating data. Using fallback data.';
          this.generateFallbackData();
        } finally {
          this.generateBtnDisabled = false;
          this.isLoading = false;
        }
      },
      generateFallbackData() {
        const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller'];
        const companies = ['Acme Inc', 'Globex Corp', 'Soylent Corp', 'Initech', 'Umbrella Corp'];
        const cities = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow'];
  
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const company = this.includeCompany ?
          companies[Math.floor(Math.random() * companies.length)] : null;
        const city = cities[Math.floor(Math.random() * cities.length)];
        const postcode = this.ukPostcodes[Math.floor(Math.random() * this.ukPostcodes.length)];
        const propertyType = this.propertyTypes[Math.floor(Math.random() * this.propertyTypes.length)];
        const propertyFeatures = this.includeFeatures ?
          [...new Set(Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () =>
            this.features[Math.floor(Math.random() * this.features.length)]))] : null;
  
        const data = {
          name: `${firstName} ${lastName}`,
          company: company,
          address: `${Math.floor(Math.random() * 100) + 1} ${lastName} Street`,
          postcode: postcode,
          city: city,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
          phone: `07${Math.floor(Math.random() * 90000000) + 10000000}`,
          'property-rooms': Math.floor(Math.random() * 6) + 1,
          'property-type': propertyType,
          'property-features': propertyFeatures,
          job: this.jobType
        };
  
        this.output = JSON.stringify(data, null, 2);
        this.statusText = 'Data generated successfully!';
        this.postBtnDisabled = false;
      },
      copyToClipboard() {
        navigator.clipboard.writeText(this.output)
          .then(() => {
            this.statusText = "Copied to clipboard!";
            setTimeout(() => this.statusText = "Ready", 2000);
          })
          .catch(err => {
            console.error('Could not copy text: ', err);
            this.statusText = "Failed to copy to clipboard.";
          });
      },
      async postData() {
        try {
          if (!this.output) {
            this.statusText = "No data to post. Generate data first.";
            return;
          }
  
          this.postBtnDisabled = true;
          this.statusText = "Posting data to API...";
  
          const response = await axios.post('/api/quote/new-request', this.output, {
            headers: {
              'Content-Type': 'application/json',
              // Add any authorization headers if needed
              // 'Authorization': 'Bearer your-token-here'
            }
          });
  
          this.apiResponse = JSON.stringify(response.data, null, 2);
          this.showResponse = true;
  
          if (response.status === 200) {
            this.statusText = "Data posted successfully!";
          } else {
            this.statusText = `API Error: ${response.status} ${response.statusText}`;
          }
        } catch (error) {
          console.error("Error posting data:", error);
          this.statusText = "Failed to post data. Check console for details.";
          this.apiResponse = error.toString();
          this.showResponse = true;
        } finally {
          this.postBtnDisabled = false;
        }
      }
    },
    mounted() {
      this.generateData();
    }
  };
  </script>
  
  <style scoped>
  body {
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    line-height: 1.6;
  }
  
  h1 {
    color: #2c3e50;
  }
  
  .container {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
  }
  
  button {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    margin-right: 10px;
    margin-bottom: 10px;
  }
  
  button:hover {
    background-color: #2980b9;
  }
  
  button:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
  
  #postBtn {
    background-color: #2ecc71;
  }
  
  #postBtn:hover {
    background-color: #27ae60;
  }
  
  textarea {
    width: 100%;
    height: 300px;
    font-family: monospace;
    padding: 10px;
    border-radius: 4px;
    border: 1px solid #ddd;
  }
  
  .controls {
    margin-bottom: 20px;
  }
  
  label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }
  
  select,
  input {
    margin-bottom: 15px;
    padding: 8px;
    width: 100%;
    box-sizing: border-box;
  }
  
  .status {
    margin-top: 10px;
    font-style: italic;
    color: #7f8c8d;
  }
  
  .button-group {
    display: flex;
    flex-wrap: wrap;
  }
  
  .response-container {
    margin-top: 20px;
    padding: 15px;
    border-radius: 4px;
    background-color: #f0f0f0;
    display: none;
  }
  </style>