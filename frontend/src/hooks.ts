
import { computed, inject, watch, watchEffect } from "vue";
import { onMounted, onUnmounted, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import {repo} from "remult"
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";

export type InvoiceFilter = 'invoice' | 'customer' | 'address' 

export function scrollToElement(elName: string){
  const el = document.getElementById(elName);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: "center" });
  }
}

export function flashElement(elName: string){
  const el = document.getElementById(elName);
  if (el) {
    el.classList.add('highlight-important')
    setTimeout(()=>{
      el.classList.remove('highlight-important')
    },3000)
  }
}

export function useUnsavedChanges(initialValue = false) {
  const hasUnsavedChanges = ref(initialValue)
  const disable = ref(false)
  
  // Handle browser tab/window close
  const beforeUnloadHandler = (e:any) => {
    if (hasUnsavedChanges.value) {
      e.preventDefault()
      e.returnValue = 'You have unsaved changes'
    }
  }

  // Handle in-app navigation
  onBeforeRouteLeave((to, from, next) => {
    if (hasUnsavedChanges.value && !disable.value) {
      if (confirm('You have unsaved changes. Proceed anyway?')) {
        next()
      } else {
        next(false)
      }
    } else {
      next()
    }
  })

  onMounted(() => {
    window.addEventListener('beforeunload', beforeUnloadHandler)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeunload', beforeUnloadHandler)
  })

  return {
    hasUnsavedChanges,
    disable
  }
}

export function openSMS(phone: string, body: string){
  const link = `sms://${phone}&body=${body}`
  location.href = link;
  console.log("SMSMSMSMS")
}

export function openEmail(email: string, body: string){
  const link = `mailto:${email}?body=${body}` 
  location.href = link;
}

export function openEmptySMS(phone: string){
  const link = `sms://${phone}&body=`
  location.href = link;
  console.log("SMSMSMSMS")
}

export function openEmptyPhonecall(phone: string){
  const link = `tel:${phone}`
  location.href = link;
}

export function openEmptyEmail(email: string){
  const link = `mailto:${email}`
  location.href = link;
}


export function copyToClipboard(text: string, showSnackbar: (message: string, color: string)=>void) {
  navigator.clipboard.writeText(text).then(() => {
    console.log('Text copied to clipboard:', text);
  }).catch(err => {
    console.error('Failed to copy text to clipboard:', err);
  });
  showSnackbar(`Copied '${text}'`,"success")
}

