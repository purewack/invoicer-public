<template>
  <v-container max-width="900">
    <v-row v-if="invoice.id && $route.name === 'invoice'">
      <v-col cols="12" :md="invoice.auto_reminders ? 12 : 8">
        <v-card v-if="isDaysPast(invoice.due_date!) && invoice.status !== 'paid'" class="my-8" color="error" variant="tonal">
          <v-card-title style="text-wrap: wrap;">
            <h2 class="text-error">This invoice
              is overdue {{ -getDaysDiffTo(invoice.due_date!) }} days!</h2>
          </v-card-title>
          <v-card-text>
            Use the links below to contact the client:
            <br/>
            <br/>
            <ContactOptions :email="invoice.customer!.email" :phone="invoice.customer!.phone"></ContactOptions>
          </v-card-text>
          <!-- <v-card-actions>
            <v-btn variant="tonal">
              Message
              <MessagingDataBar
                :template="getDaysDiffTo(invoice.due_date!) > 0 ? 'invoice-reminder' : 'invoice-final-notice'"
                :target="invoice"
              />
            </v-btn>
          </v-card-actions> -->
        </v-card>
        <v-card v-else-if="getDaysDiffTo(invoice.due_date!) <= (invoice.payment_window! / 2) && invoice.status !== 'paid'" class="my-8" color="warning" variant="tonal">
          <v-card-title style="text-wrap: wrap;">
            <h2 class="text-error">This invoice
              is not paid yet</h2>
          </v-card-title>
          <v-card-text>
            Use the links below to contact the client:
            <br/>
            <br/>
            <ContactOptions :email="invoice.customer!.email" :phone="invoice.customer!.phone"></ContactOptions>
          </v-card-text>
          <!-- <v-card-actions>
            <v-btn variant="tonal">
              Message
              <MessagingDataBar
                :template="getDaysDiffTo(invoice.due_date!) > 0 ? 'invoice-reminder' : 'invoice-final-notice'"
                :target="invoice"
              />
            </v-btn>
          </v-card-actions> -->
        </v-card>
        <v-card v-else-if="invoice?.id && invoice.status === 'paid'" class="my-8" color="success" variant="tonal">
          <v-card-title style="text-wrap: wrap;">
            <h2 class="text-success">Paid <v-icon>mdi-cash</v-icon></h2>
          </v-card-title>
          <v-card-text>
            This invoice was paid on <b>{{ toDateString(invoice.payment_date!) }}</b>.
          </v-card-text>
        </v-card>
        <v-card v-else-if="invoice?.id" class="my-8" color="success" variant="tonal">
          <v-card-title>
            <v-icon>mdi-clock-outline</v-icon>
            {{ getDaysDiffTo(invoice.due_date!) }} days left to pay
          </v-card-title>
          <v-card-text>This invoice was not marked as paid yet</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" :md="invoice.auto_reminders ? 12 : 4">
        <v-card v-if="!invoice.auto_reminders" class="my-8" color="warning" variant="tonal">
          <v-card-title style="text-wrap: wrap;">
            <span class="text-warning">Reminders: OFF</span>
          </v-card-title>
          <v-card-text>This invoice is marked to NOT auto remind missed payments!</v-card-text>
          <v-card-actions>
            <v-btn @click="()=>{
              invoice.auto_reminders = true;
              optionsChangedSave()
            }" >Turn On</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- <v-row>
      <v-col class="my-4">
          <v-card-title>Not completed yet</v-card-title>
          <v-card-text>
            You are trying to issue an invoice for a cycle which has not happened yet!
          </v-card-text>
        </v-card>
      </v-col>
    </v-row> -->
    
    <v-row v-if="invoice.payments?.length && invoice.status === 'unpaid'" >
      <v-col cols="12">
        <v-card  color="info" variant="outlined" class="mb-8">
          <v-card-title style="text-wrap: wrap;" class="d-flex flex-wrap ga-2 align-center justify-space-between">
            <h2 class="text-info">Payment Log <v-icon>mdi-history</v-icon></h2>
            
            <v-divider/>
          </v-card-title>
          <v-card-text class="d-flex flex-wrap justify-center ga-2 ">
            <v-card v-for="payment in invoice.payments"  color="info" variant="tonal">
              <template #prepend>
                <v-icon class="mr-2">mdi-cash</v-icon>
              </template>
              <template #title>
              Amount £{{ payment.amount.toFixed(2) }} 
                <v-card-subtitle>on {{ toDateString(payment.created_at) }}</v-card-subtitle>
              </template>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="my-3" v-if="$route.name === 'invoice' && invoice.reminders?.length">
      <v-col>
        <v-card color="warning" variant="tonal">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-clock-alert" class="mr-2" />
            Automatic Reminder History
          </v-card-title>
          
          <v-list>
            <v-list-item
              v-for="reminder in sortedReminders"
              :key="reminder.id"
              :subtitle="toDateString(reminder.created_at)!"
              class="reminder-item"
            >
              <template #prepend>
                <v-icon :color="getReminderColor(reminder)">
                  {{ getReminderIcon(reminder) }}
                </v-icon>
              </template>

              <v-list-item-title>
                {{ getReminderTitle(reminder) }}
                {{ (reminder.messageContent ? `: ${reminder.messageContent}` : '') }}
              </v-list-item-title>

              <template #append>
                <div class="d-flex align-center ga-2">
                  <div class="text-caption text-grey">
                    £{{ reminder.amount_paid }} / £{{ reminder.amount_due }}
                  </div>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-if="invoice.customer && invoice.billing && invoice.site && invoice.customer">
      <v-card-title class="d-flex align-center text-wrap">
        <div>
          <h1 id="title" v-if="appBarTitle === 'Invoice Clone'">Recreate Invoice</h1>
          <h1 id="title" v-else-if="route.name === 'invoice-edit'">Edit Invoice</h1>
          <h1 id="title" v-else-if="route.name === 'invoice-new'">Create New Invoice</h1>
          <h2 v-else-if="route.name === 'invoice'">Invoice: <br/> {{
            invoice.site!.line_one }} {{ invoice.site!.city }}
          </h2>
          <h3 @click="console.log(invoice.id)">{{ getReferenceNumber(invoice.id!, 'invoice') }}</h3>
        </div>

        <template v-if="invoice.id && $route.name === 'invoice'" > 
        <v-spacer/>
        <SavePDF v-if="invoice.id" :invoice-i-d="invoice.id" />
        <v-btn v-if="invoice.status !== 'paid'" :to="{name: 'invoice-edit', params: {invoiceId: invoice.id}}" variant="tonal" color="success" class="ml-2">
          <v-icon>mdi-tools</v-icon>
          Edit
        </v-btn>
        <v-btn :to="{name: 'invoice-clone', params: {invoiceId: invoice.id}}" variant="tonal" color="warning" class="ml-2">
          <v-icon>mdi-content-copy</v-icon>
          Clone
        </v-btn>
        </template>
        <!-- <code v-if="job.id" color="primary">{{ getReferenceNumber(job.id, 'invoice') }}</code> -->
      </v-card-title>


      <v-card-text :style="{pointerEvents: route.name === 'invoice' ? 'none' : undefined}" :ripple="false">
        
        <v-row>
          <v-col>
            <v-card v-if="route.name === 'invoice-new'" variant="outlined">
              <v-card-title>Auto Fill</v-card-title>
              <v-card-subtitle>Use data from a previous invoice as a starting point for this one.</v-card-subtitle>
              <v-card-text>
              <SearchBar v-if="route.name === 'invoice-new'" @pick="fillUsingExistingData"/>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row v-if="route.name === 'invoice-new'" style="height: min-content; flex: unset">
             
          <v-col style="height: min-content">
            <!-- <v-btn color="secondary" class="w-100">
              <v-icon>mdi-account</v-icon>
              Pick Customer
              <PickCustomer @selected="useCustomer" />
            </v-btn> -->
          </v-col>
        </v-row>
        
        <!-- Invoice detail -->
        <v-card variant="outlined" style="border: solid 1px lightgray;">
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6">
                <v-card variant="text" >
                <v-card-title>
                  <v-icon color="blue">mdi-phone</v-icon> Client Info
                </v-card-title>
                <v-card-text>
                  <div id="customer-name">
                    <v-text-field v-if="route.name !== 'invoice'" v-model="invoice.customer.name" label="(To *)" variant="outlined"
                    density="comfortable" class="text-cap-all mb-2" 
                    />
                    <v-label v-else-if="invoice.customer.name">To: {{ invoice.customer.name }}</v-label>
                  </div>
                    <v-text-field v-if="route.name !== 'invoice'" v-model="invoice.customer.company" label="(Company)" variant="outlined"
                    density="comfortable" class="text-cap-all mb-2" />
                    <v-label v-else-if="invoice.customer.company">Company: {{ invoice.customer.company }}</v-label>
                  <div id="customer-email">
                    <v-text-field v-if="route.name !== 'invoice'" v-model="invoice.customer.email" label="(Email **)" variant="outlined"
                      density="comfortable" class="mb-2"  type="email"
                    />
                    <v-label v-else-if="invoice.customer.email">Email: {{ invoice.customer.email }}</v-label>
                  </div>

                  <div id="customer-phone">
                    <v-text-field v-if="route.name !== 'invoice'" v-model="invoice.customer.phone" label="(Phone **)" variant="outlined"
                      density="comfortable" class="mb-2" 
                    />
                    <v-label v-else-if="invoice.customer.phone">Phone: {{ invoice.customer.phone }}</v-label>
                  </div>
                </v-card-text>
                </v-card>  
              </v-col>

              <v-col cols="12" sm="6">

                <v-card v-if="route.name !== 'invoice'" variant="text">
                  <v-card-title>
                    <v-icon color="purple" class="mr-2">mdi-clock</v-icon>
                    Edit Timeline
                  </v-card-title>
                  <v-card-text>
                    <DatePickerField v-model="invoice.completion_date!" allow-old variant="outlined"
                      label="Work Date*" />
                    <DatePickerField v-model="invoice.created_at!" allow-old variant="outlined" label="Invoice Date*" />
                    <v-row>
                      <v-col cols="12" sm="6">
                        <v-number-input v-model.number="invoice.payment_window!" @update:model-value="invoice.due_date = addDays(new Date(), $event)" label="Days to Pay" 
                          variant="outlined" density="comfortable" class="mb-4" />
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-number-input v-model.number="invoice.warning_window!" label="Number of Warnings" 
                          variant="outlined" density="comfortable" />
                      </v-col>
                    </v-row>
                  </v-card-text>
                  
                </v-card>

                <v-card v-else variant="text" class=" outline">
                <v-card-title class="pb-0"><v-icon size="large">mdi-clock</v-icon>
                  Timeline</v-card-title>
                <v-card-text class="pt-2">
                  <div class="d-flex flex-column gap-2">
                    <v-label v-if="invoice.completion_date"
                      :class="isDaysToComeAfterToday(invoice.completion_date) && 'text-error text-decoration-underline'">
                        Completed: <v-spacer/>{{ toDateString(invoice.completion_date!) }}
                    </v-label>

                    <v-label class="d-flex align-center">
                      Issued: <v-spacer/>{{ toDateString(invoice.created_at!) }}
                    </v-label>

                    <template v-if="invoice.status !== 'paid'">
                      <v-label>Payment Due: <v-spacer/>{{ toDateString(invoice.due_date!) }}</v-label>
                      <v-label class="text-caption">({{ Math.abs(getDaysDiffTo(invoice.due_date!)) }} days {{ getDaysDiffTo(invoice.due_date!) < 0 ? 'over' : 'left'}}, {{ invoice.warning_window }} warnings left)</v-label>
                    </template>
                    <template v-else>
                      <v-label>Paid on: <v-spacer/>{{ toDateString(invoice.payment_date!) }}</v-label>
                    </template>
                  </div>
                </v-card-text>
                </v-card>

              </v-col>
                
              <v-col cols="12" sm="6">
                <v-card variant="text" >
                  <v-card-title><v-icon color="green">mdi-cash</v-icon> Billing Address
                  </v-card-title>
                  <v-card-text>
                    


                    <div id="billing-address-line_one">
                      <v-text-field v-if="route.name !== 'invoice'" v-model="invoice.billing.line_one" label="(Address *)" variant="outlined"
                        density="comfortable" class="text-cap-all mb-2" 
                      />
                      <v-label v-else>{{ invoice.billing.line_one }}</v-label>
                    </div>

                    <div id="billing-address-city">
                      <v-text-field v-if="route.name !== 'invoice'" v-model="invoice.billing.city" label="(City *)" variant="outlined"
                        density="comfortable" class="text-cap-all mb-2"
                      />
                      <v-label v-else>{{ invoice.billing.city }}</v-label>  
                    </div>
                    
                    <div id="billing-address-postcode">
                      <v-text-field v-if="route.name !== 'invoice'" v-model="invoice.billing.postcode" label="(Postcode *)" variant="outlined"
                        density="comfortable" class="text-upper-all mb-2"
                      />
                      <v-label v-else>{{ invoice.billing.postcode }}</v-label>
                    </div>
                    
                    <v-text-field v-if="route.name !== 'invoice'" v-model="invoice.customer.billing_reference" label="(Billing Ref)" variant="outlined"
                      density="compact" class="text-upper-all" />
                    <v-label v-else-if="invoice.customer.billing_reference">REF: {{ invoice.customer.billing_reference }}</v-label>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6">
                <v-card variant="text" >
                  <v-card-title><v-icon color="gray">mdi-pin</v-icon> Location Address
                  </v-card-title>

                  <v-card-text v-if="$route.name === 'invoice' || !options.locationSameAddress">
                    
                    <v-form @submit.prevent >
                      <div id="site-address-line_one">
                        <v-text-field v-if="route.name !== 'invoice'" v-model="invoice.site.line_one" label="(Address Line *)" variant="outlined"
                          density="comfortable" class="text-cap-all mb-2" 
                        />
                        <v-label v-else>{{ invoice.site.line_one }}</v-label>
                      </div>

                      <div id="site-address-city">
                        <v-text-field v-if="route.name !== 'invoice'" v-model="invoice.site.city" label="(City *)" variant="outlined" density="comfortable"
                          class="text-cap-all mb-2" 
                        />
                        <v-label v-else>{{ invoice.site.city }}</v-label>
                      </div>

                      <div id="site-address-postcode">
                        <v-text-field v-if="route.name !== 'invoice'" v-model="invoice.site.postcode" label="(Postcode *)" variant="outlined"
                          density="comfortable" class="text-upper-all mb-2" 
                        />  
                        <v-label v-else>{{ invoice.site.postcode }}</v-label>
                      </div>
                    </v-form>
                  </v-card-text>
                  
                  <v-card-actions >
                      <v-checkbox v-if="$route.name !== 'invoice'" v-model="options.locationSameAddress" label="Same as billing address" density="compact"></v-checkbox>
                  </v-card-actions>
                </v-card>
              </v-col>

            </v-row>
            
          </v-card-text>
        </v-card>
        
        <!-- Invoice Items -->
        <v-card variant="text" class="outline mt-4" id="invoice-items">
          <v-card-title class="d-flex align-center">
            <v-icon color="blue">mdi-water</v-icon> Completed Work
            <v-spacer />
            
          </v-card-title>

            <v-expansion-panels >
              <v-expansion-panel
                v-for="item in invoice.items"
                :key="item.uuid"
                :value="item.uuid"
                elevation="0"
                style="border: solid 1px lightgray;"
                class="my-1"
                :style="{pointerEvents: invoice?.payments?.length ? 'none' : 'unset'}"
                :expand-icon="$route.name !== 'invoice' && !invoice?.payments?.length ? '$expand' : ''"
              >
                <v-expansion-panel-title  v-slot="{ expanded }" collapse-icon=""> 
                  <div class="d-flex align-center w-100 ga-2 flex-wrap">
                    <div class="d-flex flex-column flex-grow-1">
                      <div class="text-subtitle-1">{{ item.title }}</div>
                      <v-label v-if="item.detail">Details: {{ item.detail }}</v-label>
                    </div>
                    <div class="text-right text-h6">£{{ item.unit_price.toFixed(2) }} </div>
                    
                    <div v-if="expanded" class="w-100 d-flex">
                      <v-btn variant="tonal" color="error" class="mt-2 mr-auto" @click="removeItem(item)">
                        Remove
                      </v-btn>
                      <v-btn variant="tonal" color="success" class="mt-2" >
                        Ok
                      </v-btn>
                    </div>
                  </div>


                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-text-field
                    v-if="route.name !== 'invoice' "
                    v-model="item.title"
                    label="Title"
                    density="comfortable"
                    variant="outlined"
                    hide-details
                    class="mb-2"
                    @blur="updateItemTotal"
                  />
                  <v-textarea
                    v-model="item.detail"
                    :label="route.name !== 'invoice' ? 'Details' : undefined"
                    :readonly="route.name === 'invoice'"
                    density="comfortable"
                    variant="outlined"
                    hide-details
                    auto-grow
                    rows="2"
                    class="mb-2"
                    @blur="updateItemTotal"
                  />
                  <v-text-field
                    v-if="route.name !== 'invoice'"
                    v-model.number="item.unit_price"
                    label="Price"
                    type="number"
                    prefix="£"
                    density="comfortable"
                    variant="outlined"
                    hide-details
                    @blur="updateItemTotal"
                    @keyup.enter="updateItemTotal"
                  />

                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <v-container v-if="$route.name !== 'invoice' && !invoice?.payments?.length" class="my-4 d-flex justify-center" variant="outlined" style="border: solid lightgray 1px;">
              <v-btn  color="success" variant="tonal" size="large">
              Add Work 
              <v-dialog activator="parent" max-width="500">
                <template #default="{ isActive }">
                  <v-card>
                    <v-card-title>
                      <v-icon color="primary">mdi-spray-bottle</v-icon>
                      Add Work
                    </v-card-title>
                    <v-card-text>
                      <JobItem v-model="newItem" :available-titles="jobTitlesPool" is-only-item simple
                        @changed="newItemChange" />
                    </v-card-text>
                    <v-card-actions>
                      <v-btn density="compact" variant="text" @click="resetNewItem(); isActive.value = false">
                        <v-icon>mdi-arrow-left</v-icon>
                        Back
                      </v-btn>
                      <v-spacer />
                      <v-btn  variant="tonal" color="success" @click="addNewItem(isActive)">
                        Add
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </template>
              </v-dialog>
            </v-btn>
            </v-container>
          
        </v-card>
        
        <v-textarea v-model="invoice.notes" label="Invoice Extra Description" variant="outlined" class="mt-4" />
      

        <v-card variant="outlined" class="outline">
          <v-card-text>
            <div class="d-flex flex-row-reverse ga-4 mt-2">
              <div class="text-right text-h5">
                <div>Total:</div>
                <div :class="selectedTotal <= 0 ? 'text-red' : ''">
                  <strong>£{{ selectedTotal.toFixed(2) }}</strong>
                </div>
              </div>

              <div v-if="$route.name !== 'invoice-new' && invoice.id && !isPaid" :class="'text-warning'"
                class="text-right text-h6">
                <div>Paid:</div>
                <div>
                  <strong>£{{ ((invoice.payment_total || 0)).toFixed(2) }}</strong>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

      </v-card-text>

      <v-divider />

      
    </v-card>

    <v-card class="mt-4 position-sticky bottom-0" elevation="4">
      <v-card-actions class="pa-4">
        <div class="action-bar-grid">
        <v-btn variant="text" style="grid-area: back" @click="$router.back()">
          Back
        </v-btn>

        <v-spacer />
    
        <v-btn v-if="invoice.id && $route.name !== 'invoice-new'" style="grid-area: other" variant="text">
          <v-icon>mdi-dots-horizontal</v-icon>
          <v-bottom-sheet activator="parent">
            <template v-slot:default="{isActive: sheetActive}">
              <v-sheet>
                <v-card class="text-center">

                  <v-card-text>
                    <p>These options have the potential to remove data, be careful and think about if your choice is
                      correct.</p>
                    <br />
                    <div class="d-flex ga-4 justify-center flex-wrap flex-sm-row flex-column-reverse">
                      <v-btn @click="sheetActive.value = false" variant="flat">
                        <v-icon left>mdi-arrow-left</v-icon>
                        Back
                      </v-btn>

                      
                      <v-btn v-if="!isPaid && invoice.auto_reminders" variant="plain" color="warning">
                        Turn off
                        <br />
                        Auto-Reminders
                        <v-icon end icon="mdi-clock"></v-icon>

                        <v-dialog  activator="parent" max-width="500px">
                          <template #default="{ isActive }">
                            <v-card>
                              <v-card-title class="d-flex align-center">
                                <v-icon color="warning" class="mr-2">mdi-delete-clock</v-icon>
                                Confirm Auto-OFF
                              </v-card-title>
                              <v-card-text>
                                <p class="text-body-1">Are you sure you want to turn off auto-reminders for this
                                  invoice?</p>
                              </v-card-text>
                              <v-card-actions>
                                <v-spacer></v-spacer>
                                <v-btn text @click="isActive.value = false">No</v-btn>
                                <v-btn color="warning" variant="tonal" @click="()=>{
                                  isActive.value = false;
                                  sheetActive.value = false;
                                  invoice.auto_reminders = false;
                                  optionsChangedSave()
                                }">
                                  Yes
                                </v-btn>
                              </v-card-actions>
                            </v-card>
                          </template>
                        </v-dialog>
                      </v-btn>

                      <v-btn variant="plain" color="error">
                        Delete Invoice
                        <v-icon end icon="mdi-delete"></v-icon>

                        <v-dialog activator="parent" max-width="500px">
                          <template #default="{ isActive }">
                            <v-card>
                              <v-card-title class="d-flex align-center">
                                <v-icon color="error" class="mr-2">mdi-delete-outline</v-icon>
                                Confirm Deletion
                              </v-card-title>
                              <v-card-text>
                                <p class="text-body-1">Are you sure you want to delete this invoice? This action cannot
                                  be undone.</p>
                              </v-card-text>
                              <v-card-actions>
                                <v-spacer></v-spacer>
                                <v-btn text @click="isActive.value = false">No</v-btn>
                                <v-btn color="error" variant="tonal"
                                  @click="isActive.value = false; sheetActive.value = false; deleteInvoice()">
                                  Yes
                                </v-btn>
                              </v-card-actions>
                            </v-card>
                          </template>
                        </v-dialog>
                      </v-btn>

                    </div>
                  </v-card-text>
                </v-card>
              </v-sheet>
            </template>
          </v-bottom-sheet>
        </v-btn>
        
        <v-btn style="grid-area: action" :style="{display: $route.name === 'invoice' ? 'none' : undefined}" variant="tonal"
          color="success" @click="onPreSaveAndContinue">
          Save & Continue
          <v-icon>mdi-arrow-right</v-icon>
          <MessagingDataBar title="Continue" :template="'invoice-standard'" :target="invoice"
            @save="onMessagingPreSave"
            @complete="onMessagingComplete" >
          <template #sms-title>Send invoice SMS</template>
            <template #sms-body>
              Confirm invoice details via SMS
            </template>
            <template #email-title>Send invoice Email</template>
            <template #email-body>
              Confirm invoice details via email
            </template> 
          </MessagingDataBar>
        </v-btn>
        
        <template v-if="route.name === 'invoice' && invoice.status !== 'paid'">
          <v-btn style="grid-area: action" color="success" variant="tonal" @click="paymentAmount = total_price - (invoice.payment_total || 0)">
            <v-icon class="mr-2">mdi-cash-multiple</v-icon>
            Mark Paid
            <v-dialog activator="parent" max-width="500">
              <template #default="{isActive}">
                <v-card>
                  <v-card-title>
                    <v-icon color="green">mdi-cash</v-icon>
                    Payment Amount
                  </v-card-title>
                  <v-card-text>

                    <template v-if="!invoice.payment_total">
                      <p class="mb-4">Please select the appropriate option:</p>
                      <v-radio-group v-model="paymentOption">
                        <v-radio label="Full Payment" value="full"
                          @click="paymentAmount = total_price"></v-radio>
                        <v-radio label="Partial Payment" value="partial"></v-radio>
                      </v-radio-group>
                      <v-text-field v-if="paymentOption === 'partial'" v-model.number="paymentAmount"
                        label="Payment Amount" type="number" prefix="£" :rules="[
                    v => v > 0 || 'Amount must be greater than 0',
                    v => v <= total_price || 'Amount cannot exceed total'
                    ]" variant="outlined" density="comfortable"></v-text-field>
                    </template>

                    <template v-else>
                      <p class="mb-4">Please enter the partial amount paid:</p>
                      <div class="d-flex ga-2">
                        <v-text-field v-model.number="paymentAmount" label="Payment Amount" type="number" prefix="£"
                          :rules="[
                      v => v > 0 || 'Amount must be greater than 0',
                      v => v <= total_price-invoice.payment_total! || 'Amount cannot exceed total'
                      ]" variant="outlined" density="comfortable"></v-text-field>
                        <v-btn variant="tonal" class="mt-1"
                          @click="paymentAmount = total_price - invoice.payment_total!">
                          Remainder
                        </v-btn>
                      </div>
                    </template>

                    <v-checkbox v-if="paymentOption === 'partial' || invoice.payment_total"
                      v-model="options.resetPaymentWindow" label="Reset payment window with this payment"></v-checkbox>

                  </v-card-text>
                  <v-card-actions>
                    <v-btn variant="text" @click="isActive.value = false; paymentAmount = 0;">Cancel</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="success" variant="tonal" @click=""
                      :disabled="paymentOption === 'partial' && (!paymentAmount || paymentAmount <= 0)">
                      Confirm

                      <!-- <MessagingDataBar
                    title="Send Payment Confirmation"
                    :template="paymentOption === 'full' ? 'invoice-paid' : 'invoice-partial'" -->
                      <MessagingDataBar title="Send Payment Confirmation" :template="'invoice-payment'" :target="{
                      ...invoice,
                      payment_total: (invoice.payment_total || 0) + paymentAmount,
                      status: (invoice.payment_total || 0) + paymentAmount >= invoice.due_total! ? 'paid' : 'unpaid'
                    }" @complete="console.log('complete') ;markPaidSave(isActive); isActive.value = false" />
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </template>
            </v-dialog>
          </v-btn>
        </template>
        </div>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, Ref, toRaw, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { InvoiceController } from '@shared/api';
import { Address, Customer, Defaults, getReferenceNumber, Invoice, InvoiceItem, Reminder} from '@shared/schema';
import { JobItem as JobItemSchema, JobItemTitle as JobItemTitleSchema} from '@shared/schema';
import { inject } from 'vue';
import JobItem from '@/components/JobItem.vue';
import MessagingDataBar from '@/components/MessagingDataBar.vue';
import { repo } from 'remult';
import DatePickerField from '@/components/DatePicker.vue';
import PickAddress from '@/components/PickAddress.vue';
import { addDays, getDaysDiffTo, getUID, isDaysPast, isDaysToComeAfterToday, toDateString } from '@shared/helpers';
import ContactOptions from '@/components/ContactOptions.vue';
import SavePDF from '@/components/SavePDF.vue';
import { flashElement, scrollToElement } from '@/hooks';
import PickCustomer from '@/components/PickCustomer.vue';
import SearchBar from '@/components/SearchBar.vue';

const route = useRoute();
const router = useRouter();
const showSnackbar = inject('snackbar') as (message: string, color: string) => void;
const appBarTitle = inject('appBarTitle') as Ref<string>
appBarTitle.value = 'Create Invoice'

const options = reactive({
  resetPaymentWindow: false,
  locationSameAddress: true,
})

const loading = ref(false);

const invoice = reactive({
  id: '',
  job_id: '',
  items: [] as InvoiceItem[],
  customer: {
    name: '',
    email: '',
    phone: '',
    company: '',
    billing_reference: ''
  },
  site: {
    line_one: '',
    city: '',
    postcode:''
  },
  billing: {
    line_one: '',
    city: '',
    postcode:''
  },
  billing_reference: '',
  warning_window: 0,
  payment_window: 0,
  payment_total: 0,
  payment_due: 0,
  updated_at: new Date(),
  due_date: new Date(),
  created_at: new Date(),
  completion_date: new Date(),
  notes: '',
  status: undefined,
  due_total: 0,
  metadata: {},
  payments: [],
  auto_reminders: true,
  unspent_auto_reminders: 0,
  reminders: [],
} as Partial<Invoice>);

const user = inject('user') as any


const fillUsingExistingData = (data: Customer | Invoice | Address, target?: string)=>{
  console.log(data,target)

  if((data as Customer)?.name)
    invoice.customer!.name = (data as Customer).name 
  else if((data as Invoice)?.customer?.name)
    invoice.customer!.name = (data as Invoice).customer.name

  if((data as Customer)?.company)
    invoice.customer!.company = (data as Customer).company 
  else if((data as Invoice)?.customer?.company)
    invoice.customer!.company = (data as Invoice).customer.company!

  if((data as Customer)?.email)
    invoice.customer!.email = (data as Customer).email 
  else if((data as Invoice)?.customer?.email)
    invoice.customer!.email = (data as Invoice).customer.email
  
  if((data as Customer)?.phone)
    invoice.customer!.phone = (data as Customer).phone 
  else if((data as Invoice)?.customer?.phone)
    invoice.customer!.phone = (data as Invoice).customer.phone

  if((data as Customer)?.billing_reference)
    invoice.customer!.billing_reference = (data as Customer).billing_reference! 
  else if((data as Invoice)?.customer?.billing_reference)
    invoice.customer!.billing_reference = (data as Invoice).customer.billing_reference!

  if((data as Address)?.line_one){
    if(target === 'site')
      invoice.site!.line_one = (data as Address).line_one 
    else
      invoice.billing!.line_one = (data as Address).line_one 
  }
  if((data as Invoice)?.site?.line_one)
    invoice.site!.line_one = (data as Invoice).site.line_one
  if((data as Invoice)?.billing?.line_one)
    invoice.billing!.line_one = (data as Invoice).billing.line_one

  if((data as Address)?.city){
    if(target === 'site')
      invoice.site!.city = (data as Address).city 
    else
      invoice.billing!.city = (data as Address).city 
  }
  if((data as Invoice)?.site?.city)
    invoice.site!.city = (data as Invoice).site.city
  if((data as Invoice)?.billing?.city)
    invoice.billing!.city = (data as Invoice).billing.city

  if((data as Address)?.postcode){
    if(target === 'site')
      invoice.site!.postcode = (data as Address).postcode 
    else
      invoice.billing!.postcode = (data as Address).postcode 
  }
  if((data as Invoice)?.site?.postcode)
    invoice.site!.postcode = (data as Invoice).site.postcode
  if((data as Invoice)?.billing?.postcode)
    invoice.billing!.postcode = (data as Invoice).billing.postcode

  options.locationSameAddress = false;

  if((data as Invoice)?.items){
    invoice.items = []
    for(const item of (data as Invoice).items){
      invoice.items.push(item as JobItemSchema)
    }
  }

  invoice.status = 'unpaid'
  invoice.id = undefined;
  invoice.created_at = new Date(invoice.created_at!);
  invoice.completion_date = new Date(invoice.completion_date!);
  invoice.due_date = new Date(invoice.due_date!);
  invoice.payment_total = 0
  invoice.payment_date = null
  // invoice.due_total = 0
  invoice.payments = undefined
  invoice.reminders = undefined
  paymentAmount.value = 0
  options.resetPaymentWindow = false
}






// Computed properties for reactive totals
const selectedTotal = computed(() => {
  if (!invoice.items) return 0;
  const cost = invoice.items
    .reduce((sum, item) => sum + (item.unit_price), 0);
  if(route.name === 'invoice-edit'){

  }
  return cost
});

watch(selectedTotal,(_new)=>{
  invoice.due_total = _new
})

const total_price = ref(0)
// Update the invoice total whenever items change
function updateInvoiceTotal() {
  if (!invoice.items) {
    total_price.value = 0;
    return;
  }
  
  total_price.value = invoice.items
    .reduce((sum, item) => sum + (item.unit_price), 0);
}

// Update total when individual items change
function updateItemTotal() {
  updateInvoiceTotal();
}

const isPaid = computed(()=>{
  return (invoice.payment_total || 0) >= total_price.value
})








// Process job items for invoice display
// function processJobItems(items: JobItemSchema[]) {
//   return items.map(j => {
//     const item = { detail: '', title: j.title, unit_price: j.unit_price, uuid: j.uuid };
    
//     if (j.cycle_months == 2 && j.bimonthly_price) {
//       return { ...item, unit_price: j.bimonthly_price, title: j.title + ' (8-9 week cycle)' };
//     }
//     if (j.cycle_months == 1 && j.monthly_price) {
//       return { ...item, unit_price: j.monthly_price, title: j.title + ' (4-5 week cycle)' };
//     }
//     return item;
//   });
// }


// New item handling
const newItem = ref<InvoiceItem>({
  title: '',
  detail: '',
  unit_price: 0,
  uuid: getUID()
});

function resetNewItem() {
  newItem.value = {
    title: '',
    detail: '',
    unit_price: 0,
    uuid: getUID()
  };
}

function addNewItem(isActiveModal: Ref<boolean>) {
  if (!invoice.items) {
    invoice.items = [];
  }
  
  const itemToAdd = {
    ...toRaw(newItem.value),
    detail: '',
    uuid: getUID()
  } as InvoiceItem;
  
  invoice.items.push(itemToAdd);
  updateInvoiceTotal();
  
  isActiveModal.value = false;
  resetNewItem();
}

function newItemChange(item: InvoiceItem) {
  newItem.value = item;
}

// Job titles pool
const jobTitlesPool = ref<JobItemTitleSchema[]>([]);
onMounted(async () => {
  jobTitlesPool.value = await repo(JobItemTitleSchema).find({ orderBy: { id: 'asc' } });
});


function removeItem(item: {uuid: string}) {
  if (!invoice.items) return;
  invoice.items = invoice.items.filter(j => j.uuid !== toRaw(item).uuid)
  updateInvoiceTotal();
}

// Payment reminders
const sortedReminders = computed(() => {
  return [...(invoice.reminders || [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
});

function getReminderColor(reminder: Reminder): string {
  if (reminder.reason === 'overdue') return 'error';
  return reminder.contact?.method === 'email' ? 'primary' : 'success';
}

function getReminderIcon(reminder: Reminder): string {
  if (reminder.contact?.method === 'email') return 'mdi-email';
  if (reminder.contact?.method === 'sms') return 'mdi-message';
  return 'mdi-bell';
}

function getReminderTitle(reminder: Reminder): string {
  const method = reminder.contact?.method === 'email' ? 'Email :-' : reminder.contact?.method === 'sms' ? 'SMS :- ' : '';
  const type = reminder.reason === 'overdue' ? 'Final Notice' : 'Non-Payment Notice';
  return `${method} ${type}`;
}


// Payment handling
const paymentOption = ref('full');
const paymentAmount = ref(0)

async function markPaidSave(isActiveModal: Ref<boolean>) {
  try {
    invoice.payment_date = new Date()
    if ((invoice.payment_total || 0) + paymentAmount.value >= total_price.value) {
      invoice.status = 'paid';
    }
    else
      invoice.status = 'unpaid'

    invoice.payment_total! += paymentAmount.value;

    const res = await InvoiceController.recordPayment(invoice, paymentAmount.value, options.resetPaymentWindow)

    isActiveModal.value = false;
    showSnackbar('Payment recorded successfully', 'success');

    paymentAmount.value = 0;
    console.log(res)

    // try{
    //   if(!res.remaining)
    //     await JobController.payCycle(invoice.id!, invoice.payment_date)
    // }
    // catch{}

    if(invoice.payment_total! >= total_price.value)
      router.push({path: '/', query: {highlight: invoice.id}})
  } catch (error) {
    console.error(error);
    showSnackbar('Failed to record payment', 'error');
  }
}







function onMessagingPreSave(){
  console.log("PRESAVE")
  return saveInvoice()
}

function onMessagingComplete(){
  console.log("COMPLETE")
  // router.push({
  //   path: '/',
  //   query: {
  //     highlight: invoice.id!
  //   }
  // });
}

async function saveInvoice(routeBack = false) {

  loading.value = true;
  try {
    let res

    const selectedInvoiceItems = invoice.items!

    invoice.due_total = selectedInvoiceItems.reduce((sum, item) => sum + (item.unit_price), 0)
    invoice.metadata = {
      owner_uid: user.uid
    }

    if(options.locationSameAddress === true){
      invoice.site!.line_one = invoice.billing!.line_one
      invoice.site!.postcode = invoice.billing!.postcode
      invoice.site!.city = invoice.billing!.city
    }

    if(invoice.id){
      res = await InvoiceController.updateInvoice({
        ...toRaw(invoice),
        payment_total: paymentAmount.value + (invoice.payment_total || 0),
        items: selectedInvoiceItems as InvoiceItem[],
      } as Invoice);
      invoice.due_date = res?.due_date
    }
    else{
      res = await InvoiceController.createInvoice({
        ...toRaw(invoice),
        items: selectedInvoiceItems as InvoiceItem[],
        
      } as Invoice);
      console.log("save",res)
      invoice.id = res.id

      // if(invoice.job_id && forCycle.value){
      //   console.log("cycle completion save")
      //   try{
      //     await JobController.finishCycle(forCycle.value, invoice.id!, res.completion_date)
      //   }
      //   catch{}
      // }
    }


    showSnackbar('Invoice saved', 'success');
    // console.log(res)
    
    if(!routeBack)
    router.push({name: 'invoice', params:{invoiceId: res.id}})

    // if(routeBack)
    //   router.push({
    //     path: '/',
    //     query: {
    //       highlight: res!.id
    //     }
    //   });
    // else
      return res
  } finally {
    loading.value = false;
  }
}



async function optionsChangedSave(){
  if(invoice.id)
    await saveInvoice()
}







async function onPreSaveAndContinue(e: any){
  if(e.followCall) return
  try{
    e.preventDefault();
    e.stopImmediatePropagation();

    const checkInvoice = {...toRaw(invoice)}
    if(options.locationSameAddress){
      checkInvoice.site!.line_one = checkInvoice.billing!.line_one
      checkInvoice.site!.postcode = checkInvoice.billing!.postcode
      checkInvoice.site!.city = checkInvoice.billing!.city
    }
    await InvoiceController.validate(checkInvoice)

    let newEvent: any = new PointerEvent(e.type, {
      bubbles: e.bubbles,
      cancelable: e.cancelable,
      relatedTarget: e.relatedTarget
    });
    newEvent.followCall = true
    e.target.dispatchEvent(newEvent);
    console.log(e)
  }
  catch(er: any){
    console.error('fail',er)
    const [erTarget, message] = er.message.split(':')
    console.log(erTarget)
    showSnackbar(message,'error')
    scrollToElement(erTarget)
    flashElement(erTarget)
    return false
  }  
}




watch(
  () => route.params,
  async () => {
    try {
      if(route.name && ['invoice','invoice-edit','invoice-clone'].includes(route.name as string) && route.params?.invoiceId) {
      const originalData = await InvoiceController.getInvoiceById(route.params.invoiceId as string);
        Object.assign(invoice, originalData);
      
        if(route.name === 'invoice-clone'){
          showSnackbar(`Using info from invoice ${originalData.id}`,'info')
          fillUsingExistingData(originalData)
          appBarTitle.value = `Invoice Clone`
          router.replace({name:'invoice-new'})
        }
        else if(route.name === 'invoice-edit'){
          if(invoice.status === 'paid'){
            showSnackbar('Invoice can not be edited', 'error');
            router.push('/');
            return
          }
          appBarTitle.value = 'Invoice Edit'
        }
        else
          appBarTitle.value = `Invoice Details`
      }

      updateInvoiceTotal();
      window.scrollTo({top: 0})
    } catch (error) {
      console.error(error);
      showSnackbar('Invoice may not exist', 'error');
      router.push('/');
    }
  },
  { immediate: true }
);
onMounted(async ()=>{
  console.log('init')
  if(route.name !== 'invoice-new') return;

  const defs = await repo(Defaults).findFirst({platform: import.meta.env.VITE_PLATFORM})
  invoice.items = []; 
  invoice.payment_window = defs!.prefs.default_payment_window
  invoice.warning_window = defs!.prefs.default_payment_warnings
  invoice.due_date = addDays(new Date(), defs!.prefs.default_payment_window)
  invoice.created_at = new Date();
  invoice.completion_date = new Date();
})

async function deleteInvoice(){
  await InvoiceController.deleteInvoice(invoice.id!)
  showSnackbar('Deleted invoice successfully','warning')
  router.push('/')
}

// onMounted(() => {
//   scrollToElement('title')
// });



</script>

<style scoped>
.text-cap-all * {
  text-transform: capitalize;
}
.text-upper-all * {
  text-transform: uppercase;
}
.outline{
  border-color: lightgray;
}

.reminder-item {
  transition: background-color 0.2s;
}

.reminder-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.v-list-item__prepend {
  margin-right: 12px;
}

.contact-item {
  transition: background-color 0.2s;
}

.contact-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.v-list-item__prepend {
  margin-right: 12px;
}

.action-bar-grid {
  width: 100%; 
  display:grid; 
  grid-template-areas: 'back other action';
  grid-template-columns: 1fr 3fr 1fr;
}
</style>