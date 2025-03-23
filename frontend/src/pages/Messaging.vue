<template>
    <v-container class="pa-4">
        <v-row >
            <v-col>
            <v-card variant="tonal" color="success" @click="">
                <v-card-title>Select Customer</v-card-title>
                <v-card-text>
                    <div v-if="selectedCustomer" class="mt-4">
                        <div><strong>Email:</strong> {{ selectedCustomer.email }}</div>
                        <div><strong>Phone:</strong> {{ selectedCustomer.phone }}</div>
                    </div>
                    <div v-else>
                        Click here to pick a customer
                    </div>
                </v-card-text>

                <CustomerPicker @selected="selectedCustomer = $event" />
            </v-card>
            </v-col>
        </v-row>
        <v-row v-if="selectedCustomer">
            <v-col cols="12" md="5" >
            <v-card >
                <v-card-title>Subject: 
                    <v-textarea
                        v-model="customSubject"
                        label="Subject"
                        rows="1"
                        outlined
                        class="mt-4"
                        @update:model-value="updateHeading"
                    ></v-textarea>
                </v-card-title>
                <v-card-text>
                    <v-textarea
                        v-model="customMessage"
                        label="Custom Message"
                        rows="6"
                        outlined
                        class="mt-4"
                        @update:model-value="updatebody"
                    ></v-textarea>
                </v-card-text>
            </v-card>
            </v-col>
            <v-col cols="12" md="7">
                <v-card >
                <v-card-title>Preview</v-card-title>
                <v-card-text>
                    <div class="email-container" v-html="templateGeneric"></div>
                </v-card-text>
            </v-card>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <v-card>
                <v-card-actions>
                    <v-btn @click="$router.back()">Back</v-btn>
                    <v-spacer />
                    <v-btn v-if="selectedCustomer" variant="tonal" color="success">
                        Send <v-icon>mdi-send</v-icon>
                        <MessagingDataBar
                            template="generic"
                            :target="{
                                body: customMessage,
                                title: customSubject,
                                customer: selectedCustomer
                            }" 
                            @complete="showSnackbar('Send Successfully','success'); $router.push('/')"
                        />
                    </v-btn>
                </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject, Ref, watchEffect, onMounted } from 'vue'
import CustomerPicker from "@/components/PickCustomer.vue"
import MessagingDataBar from '@/components/MessagingDataBar.vue'
import { Customer } from '@shared/schema'
import { useDebounce } from '@vueuse/core'
import { GenericEmailProps, MessagingController } from '@shared/api'
import { User } from 'firebase/auth'

const titlebar = inject('appBarTitle') as Ref<string>
titlebar.value = 'Send a Message'
const user = inject('user') as Partial<User> 

const selectedCustomer = ref<Customer | null>(null)

const customSubject = ref('Title')
const customMessage = ref('(Message Here)')

function updateHeading(_text:string){
    const title = document.getElementById('email-heading')
    if(title) title.innerHTML = _text
}
function updatebody(_text: string){
    const body = document.getElementById('email-body')
    if(body) body.innerHTML = _text
}

const templateGeneric = ref('')
onMounted(async ()=>{
    const data = await MessagingController.generateContent('generic',{
        body: customMessage.value,
        title: customSubject.value,
        customer: {
            email: '(customer-email)',
            phone: '(customer-phone)',
            name: '(customer-name)',
        }
    } as GenericEmailProps)
    templateGeneric.value = data.html
})

// watchEffect(async ()=>{
//     if(!(debouncedBodyText.value && debouncedSubjectText.value && selectedCustomer.value)) return
    
//     previewMessage.value = data.html
//     // loading.value = false
// })

const showSnackbar = inject('snackbar') as (txt:string, color:string)=>void

// Optionally fetch customers from API on mount
</script>

<style>
.email-container #email-image-logo { 
    /* opacity: 0.5; */
    width: 100%;
    object-fit: contain;
}
.email-container #email-image-footer { 
    /* opacity: 0.5; */
    width: 100%;
    object-fit: contain;
}
.email-container #email-body {
    text-wrap: wrap;
    max-width: 100%;
}
</style>