<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch, Ref, useTemplateRef, onMounted, inject } from 'vue';
import { MessagingController, TemplateTargetType } from "@shared/api";
import { EmailTemplateName, Invoice, getReferenceNumber } from "@shared/schema";
import { openEmail, openEmptyEmail, openEmptySMS, openSMS } from '@/hooks';
import MessageRender from './MessageRender.vue';

type ContactOperation = 'skip' | 'auto' | 'manual';

export interface ContactStatusFlags {
  email: ContactOperation,
  sms: ContactOperation,
  other: ContactOperation,
}

const props = defineProps<{
  target: TemplateTargetType,
  template: EmailTemplateName,
  confirmText?: string,
}>();

const emit = defineEmits<{
  (event: 'update:contact', type: 'email'|'sms'|'other', status: ContactOperation): void,
  (event: 'complete', results: ContactStatusFlags): void
  (event: 'save'): Partial<Invoice>,
  (event: 'fail'): void,
}>();

const activeStep = ref<'menu' | 'email' | 'sms' | 'confirm' | 'sending' | 'retryEmail'>('menu');
const messageData = ref({ text: '', html: '', title: ''});
const loading = ref(false);
const error = ref('');

const type = computed(()=>(props.target as {due_date?:string})?.due_date  ? 'invoice' : 'job');
const customer = computed(()=>(props.target as Invoice).customer)
const contacts = computed(()=>({
  email: customer.value.email,
  phone: customer.value.phone
}))
// console.log(props.target,props.template,customer, contacts)

const contactStatus = reactive({
  email: 'auto',
  sms: 'auto',
  other: 'skip'
} as ContactStatusFlags)

function handleContactStateChange(type: 'email'|'sms'|'other'){
  // if(type === 'email' && contactStatus.email === 'skip') contactStatus.email = 'manual'
  if(type === 'email' && contactStatus.email === 'auto') contactStatus.email = 'skip'
  else if(type === 'email' && contactStatus.email === 'skip') contactStatus.email = 'auto'

  // if(type === 'sms' && contactStatus.sms === 'skip') contactStatus.sms = 'manual'
  if(type === 'sms' && contactStatus.sms === 'auto') contactStatus.sms = 'skip'
  else if(type === 'sms' && contactStatus.sms === 'skip') contactStatus.sms = 'auto'

  if(type === 'other' && contactStatus.other === 'skip') contactStatus.other = 'manual'
  else if(type === 'other' && contactStatus.other === 'manual') contactStatus.other = 'skip'

  emit('update:contact', type, contactStatus[type])
}

const flags = reactive({
  email: 'skip',
  sms: 'skip',
  other: 'skip',
} as ContactStatusFlags)

// Fetch message preview
async function loadPreview() {
  loading.value = true;
  try {
    const res = await MessagingController.generateContent(props.template, props.target)
    messageData.value = {
      text: res.text || '',
      html: res.html || '',
      title: props.template || ''
    };
  } catch (err: any) {
    error.value = err;
  } finally {
    loading.value = false;
  }
}



// Handle contact submission
async function handleContact() {
  let results: ContactStatusFlags = {
    email: 'skip',
    sms: 'skip',
    other: 'skip', 
  }
  console.log("handle")
  
  if (contactStatus.email !== 'skip' && customer.value.email?.length) {
    let attachmentRequest = null
    if(props.template.startsWith('invoice')){
      const inv = (props.target as Partial<Invoice>)
      if((inv.payment_total || 0) < inv.due_total!)
        attachmentRequest = {
          type: 'invoice'
        }
        console.log("request invoice attachment")
    }

    activeStep.value = 'sending'
    const res = await MessagingController.sendEmail(
      props.template,
      props.target,
      contactStatus.email === 'auto',
      attachmentRequest
    );
    
    if (!res.success) {
      activeStep.value = 'retryEmail';
      emit('fail')
      throw new Error('Email send error')
    }
    
    if(contactStatus.email === 'manual' && res.content)
      nextTick(()=>{
        openEmail(contacts.value.email, res.content)
      })

    if(res.success)
      results.email = contactStatus.email
  }
  if (contactStatus.sms !== 'skip' && customer.value.phone?.length) {
    const res = await MessagingController.sendSms(
      props.template,
      props.target,
      contactStatus.sms === 'auto'
    );

    nextTick(()=>{
      if(contactStatus.sms === 'manual' && res.success && res.content)
        openSMS(contacts.value.phone, '')
      else
        openSMS(contacts.value.phone, res.content)
    })

    if(res.success)
      results.sms = contactStatus.sms
  }
  if (contactStatus.other !== 'skip') { // other
    const res = await MessagingController.sendOther(
      props.template,
      props.target,
    );

    if(res.success)
      results.other = contactStatus.other
  }

  emit('complete', results);  
  modalState.value = false
  activeStep.value = 'menu'
}

const awaitTargetChange = ref(false)
const modalState = ref(false)

async function requestConfirm(){
  if((props.target as {id?:string})?.id || (props.target as {body?:string})?.body ){
    try{
      await handleContact()
    }
    catch(e){
      console.error(e)
    }
  }
  else{
    awaitTargetChange.value = true
    console.log("await")
  } 
  emit('save')
}

watch(props.target, async (_new)=>{
  console.log("target changed")
  if(!awaitTargetChange.value) return
  if(!(_new as {id?:string})?.id ) return
    awaitTargetChange.value = false
    // console.log("updated props.target",JSON.stringify(_new))
    try {
      await handleContact()
    }
    catch(e){
      console.error(e)
    }
},{deep: true, immediate: true})

async function retryEmail() {
  activeStep.value = 'menu'; // Go back to the main menu
  try{
    await handleContact(); // Retry sending the email
  }
  catch(e){
    console.error(e)
  }
}

function skipEmail() {
  contactStatus.email = 'skip'; // Skip email for now
  activeStep.value = 'confirm'; // Proceed to the confirmation step
}

</script>

<template>
 <v-dialog  :max-width="activeStep === 'email' && 800 || 600" v-model="modalState" activator="parent" @after-leave="activeStep = 'menu'">
    <template #default="{ isActive }">
      <v-card @vue:mounted="loadPreview(); modalState = true">
      <v-window v-model="activeStep" scrollable>
        <!-- Main Menu -->
        <v-window-item value="menu">
          <v-card-title><v-icon>mdi-floppy</v-icon> Contact Client</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-if="contacts.email">
                <v-checkbox
                  :disabled="false && flags?.email !== 'skip'"
                  :model-value="contactStatus.email === 'auto'"
                  :indeterminate="contactStatus.email === 'manual'"
                  @click.prevent="handleContactStateChange('email')"
                >
                  <template #label>
                    <div class="d-flex flex-column">
                      <v-label>Send Email{{ contactStatus.email === 'manual' || flags.email === 'manual' ? ' (Manual)' : '' }}</v-label>
                      <v-label><code>{{ contacts.email }}</code></v-label>
                    </div>
                  </template>
                  <template #append>
                    <v-btn
                      :disabled="contactStatus.email !== 'auto'"
                      variant="tonal"
                      @click.stop="activeStep = 'email'"
                    ><v-icon>mdi-magnify</v-icon></v-btn>
                    <v-icon class="ml-4" :color="flags.email !== 'skip' ? 'success' : 'transparent'">
                      mdi-check
                    </v-icon>
                    <v-icon :color="contactStatus.email === 'auto' || flags.email !== 'skip' ? 'success' : contactStatus.email === 'manual' ? 'primary' : ''">
                      mdi-email
                    </v-icon>
                  </template>
                </v-checkbox>
              </v-list-item>

              <v-list-item v-if="contacts.phone">
                <v-checkbox
                  :disabled="flags.sms !== 'skip'"
                  :model-value="contactStatus.sms === 'auto'"
                  :indeterminate="contactStatus.sms === 'manual'"
                  @click.prevent="handleContactStateChange('sms')"
                >
                  <template #label>
                    <div class="d-flex flex-column">
                      <v-label>Send SMS {{ contactStatus.sms === 'manual' || flags.sms === 'manual' ? ' (Manual)' : '' }}</v-label>
                      <v-label><code>{{ contacts.phone }}</code></v-label>
                    </div>
                  </template>
                  <template #append>
                    <v-btn
                      :disabled="contactStatus.sms !== 'auto'"
                      variant="tonal"
                      @click.stop="activeStep = 'sms'"
                    ><v-icon>mdi-magnify</v-icon></v-btn>
                    <v-icon class="ml-4" :color="flags.sms !== 'skip' ? 'success' : 'transparent'">
                      mdi-check
                    </v-icon>
                    <v-icon :color="contactStatus.sms === 'auto' || flags.sms !== 'skip' ? 'success' : contactStatus.sms === 'manual' ? 'primary' : ''">
                      mdi-message
                    </v-icon>
                  </template>
                </v-checkbox>
              </v-list-item>

              <v-list-item>
                <v-checkbox
                  :disabled="flags.other === 'manual'"
                  :model-value="contactStatus.other !== 'skip'"
                  @click.prevent="handleContactStateChange('other')"
                  label="I have/will contact the client in a different way"
                >
                  <template #append>
                    <v-icon class="ml-4" :color="flags?.other !== 'skip' ? 'success' : 'transparent'">
                      mdi-check
                    </v-icon>
                    <v-icon :color="contactStatus.other === 'manual' || flags?.other !== 'skip' ? 'success' : ''">
                      mdi-account
                    </v-icon>
                  </template>
                </v-checkbox>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="isActive.value = false">Back</v-btn>
            <v-btn 
              variant="plain"
              v-if="(contactStatus?.email !== 'skip' || contactStatus?.sms !== 'skip' || contactStatus.other !== 'skip')"
             
               @click="()=>{
                contactStatus.email = 'skip';
                contactStatus.sms = 'skip';
                contactStatus.other = 'skip';
                activeStep = 'confirm'
              }"
            >
              No Contact
            </v-btn>
            <v-spacer />
            <v-btn 
              v-if="contactStatus?.email !== 'skip' || contactStatus?.sms !== 'skip' || contactStatus.other !== 'skip'"
              color="success" 
              @click="activeStep = 'confirm'"
            >
              Next
            </v-btn>
            <v-btn 
              v-else
              color="secondary"
              @click="activeStep = 'confirm'"
            >
              Skip
            </v-btn>
          </v-card-actions>
        </v-window-item>

        <!-- Email Preview -->
        <v-window-item value="email" v-if="contacts.email">
          <v-card-title>
            <v-card-subtitle>
              <p @click="openEmptyEmail(contacts.email)" class="cursor-pointer">to:{{ contacts.email }}</p>
            </v-card-subtitle>
          </v-card-title>
          <v-divider/>
          <v-card-text style="background: white; color: black; max-height:60vh; overflow-y: scroll;">
            <MessageRender :data="messageData.html" :contact="contacts.email!" type="email" />
          </v-card-text>
          <v-divider/>
          <v-card-actions>
            <v-btn @click="activeStep = 'menu'">Back</v-btn>
            <v-spacer/>
          </v-card-actions>
        </v-window-item>

        <!-- SMS Preview -->
        <v-window-item value="sms" v-if="contacts.phone">
          <v-card-title class="text-h6 d-flex flex-column align-center">
            <div style="background-color: gray; width:2rem; height:2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1rem;">
              <v-icon color="white" size="24">mdi-account-circle</v-icon>
            </div>
            <p @click="openEmptySMS(contacts.phone)" class="cursor-pointer">{{ contacts.phone }}</p>
          </v-card-title>
          <v-divider/>
          <v-card-text>
            <div style="max-height:60vh; overflow-y: scroll">
              <MessageRender :data="messageData.text" :contact="contacts.phone!" type="sms" />
            </div>
          </v-card-text>
          <v-divider/>
          <v-card-actions>
            <v-btn @click="activeStep = 'menu'">Back</v-btn>
          </v-card-actions>
        </v-window-item>

        <!-- Confirmation Slide -->
        <v-window-item value="confirm">
          <v-card-title>
            {{ (contactStatus?.email !== 'skip' || contactStatus?.sms !== 'skip' || contactStatus.other !== 'skip') ? 
               'Confirm Messages' : 'Skip Confirmation' }}
          </v-card-title>
          <v-card-text>
            <p v-if="contactStatus?.email === 'skip' && contactStatus?.sms === 'skip' && contactStatus.other === 'skip'">
              Are you sure you want to skip contacting the client?
            </p>
            <template v-else>
              <p>{{ confirmText || 'Are you sure you want to continue?' }}</p>
              <br/>
              <ul class="ml-4">
                <li v-if="customer.email && contactStatus.email === 'auto' && flags.email === 'skip'">An automatic email will be sent</li>
                <li v-else-if="contactStatus.email === 'manual' && flags.email === 'skip'">You need to <b>write your own email</b> <i>(only marked as sent)</i></li>
                <li v-if="customer.phone && contactStatus.sms === 'auto' && flags.sms === 'skip'">SMS will open, which <b><u>you need to send</u></b></li>
                <li v-else-if="contactStatus.sms === 'manual' && flags.sms === 'skip'">You will need to <b>write your own SMS</b> <i>(only marked as sent)</i></li>
                <li v-if="contactStatus.other === 'manual' && flags.other === 'skip'">Remember to contact the client in some other way</li>
              </ul>
            </template>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="activeStep = 'menu'">Back</v-btn>
            
            <v-spacer />
            <v-btn 
              color="success" 
              @click="requestConfirm "
            >
              {{contactStatus.email === 'skip' && contactStatus.sms === 'skip' && contactStatus.other === 'skip' ? 'Skip' : 'Send'}}
              <v-icon>mdi-check</v-icon>
            </v-btn>
          </v-card-actions>
        </v-window-item>

        <v-window-item value="sending">
          <v-card-title>Sending <v-icon>mdi-send</v-icon></v-card-title>
          <v-card-text>
            <p>Please wait while we send your message</p>
            <p class="text-center"><v-progress-circular indeterminate/></p>
          </v-card-text>
        </v-window-item>

        <!-- Retry Email Slide -->
        <v-window-item value="retryEmail">
          <v-card-title><v-icon color="error">mdi-email-remove</v-icon> Error</v-card-title>
          <v-card-text>
            There was an issue sending the email. What would you like to do?
          </v-card-text>
          <v-card-actions>
            <v-btn @click="skipEmail()">Skip Email</v-btn>
            <v-spacer />
            <v-btn color="warning" @click="retryEmail">Retry Email</v-btn>
          </v-card-actions>
        </v-window-item>
      </v-window>
    </v-card>
    </template>
  </v-dialog>
</template>