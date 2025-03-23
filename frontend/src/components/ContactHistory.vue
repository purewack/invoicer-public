<template>
    <v-card :color="color" :variant="variant">
      <v-card-title class="d-flex align-center">
        <template v-if="title"><v-icon :icon="icon" class="mr-2" />{{ title }}</template>
        <h2 v-else><v-icon icon="mdi-phone" class="mr-2" />Contact Log</h2>
      </v-card-title>
      
      <v-expansion-panels>
        <v-expansion-panel
          v-for="(contacts, status) in groupedContacts"
          :key="status"
          :title="`${status} (${contacts.length})`"
          elevation="0"
        >
          <template #text>
            <v-list>
              <v-list-item
                v-for="contact in contacts"
                :key="contact.id"
                :subtitle="toDateString(contact.created_at)!"
                class="contact-item"
              >
                <template #prepend>
                  <v-icon :color="getContactColor(contact)">
                    {{ getContactIcon(contact) }}
                  </v-icon>
                </template>
  
                <v-list-item-title>
                  {{ getContactTitle(contact) }}
                </v-list-item-title>
  
                <template #append>
                  <div class="d-flex align-center gap-2">
                    <v-chip v-if="![200,204].includes(contact.status)"
                      color="error"
                      size="small"
                      :variant="contact.manual ? 'outlined' : 'tonal'"
                    >
                      Error
                    </v-chip>
                    <v-chip v-else
                      :color="contact.status === 200 ? 'success' : 'warning'"
                      size="small"
                      :variant="contact.manual ? 'outlined' : 'tonal'"
                    >
                      {{ contact.manual ? 'Manual' : 'Auto' }}
                    </v-chip>
                    
                    <v-btn
                      v-if="contact.metadata?.messageContent && allowResend"
                      density="comfortable"
                      icon="mdi-send"
                      variant="text"
                      :color="contact.method === 'email' ? 'primary' : 'success'"
                      @click="$emit('resend', contact)"
                    >
                      <MessagingDataBar
                        v-if="target"
                        :template="contact.forStatus"
                        :target="target"
                        :data="{
                          messageContent: contact.metadata.messageContent
                        }"
                      />
                    </v-btn>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </template>
        </v-expansion-panel>
      </v-expansion-panels>
  
      <v-card-text v-if="!contacts.length" class="text-center text-grey">
        No contact history available
      </v-card-text>
    </v-card>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  import { ContactLog } from '@shared/schema';
  import { toDateString } from '@shared/helpers';
  import MessagingDataBar from './MessagingDataBar.vue';
  
  const props = defineProps<{
    contacts: ContactLog[];
    title?: string;
    icon?: string;
    color?: string;
    variant?: string;
    allowResend?: boolean;
    target?: any;
  }>();
  
  const emit = defineEmits<{
    (e: 'resend', contact: ContactLog): void;
  }>();
  
  const sortedContacts = computed(() => {
    return [...props.contacts]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });
  
  function getContactColor(contact: ContactLog): string {
    switch (contact.method) {
      case 'email':
        return 'primary';
      case 'sms':
        return 'success';
      default:
        return 'warning';
    }
  }
  
  function getContactIcon(contact: ContactLog): string {
    switch (contact.method) {
      case 'email':
        return 'mdi-email';
      case 'sms':
        return 'mdi-message';
      default:
        return 'mdi-account-voice';
    }
  }
  
  function getContactTitle(contact: ContactLog): string {
    const method = contact.method === 'email' ? 'Email' : 
                   contact.method === 'sms' ? 'SMS' : 'Other';
    const type = contact.forStatus;
    
    return `${method} for ${type}`;
  }


const groupedContacts = computed(() => {
  const groups = props.contacts.reduce((acc, contact) => {
    const status = contact.forStatus;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(contact);
    return acc;
  }, {} as Record<string, ContactLog[]>);

  // Sort contacts within each group by date
  // Object.keys(groups).forEach(key => {
  //   groups[key].sort((a, b) => 
  //     new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  //   );
  // });

  return groups;
});
  </script>
  
  <style scoped>
  .contact-item {
    transition: background-color 0.2s;
  }
  
  .contact-item:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
  
  .v-list-item__prepend {
    margin-right: 12px;
  }
  </style>