<template>
    <v-list >
        <v-dialog max-width="800" v-for="cycle in computedCycles" >
            <template #activator="{props}">
                <v-list-item @click="props.onClick" :key="cycle.id" :class="$route.query.cycle === cycle.id && 'cycle-highlight'">
                <v-divider v-if="job.cycles!.length > 1" class="mb-2"/>
                <div class="d-flex flex-column flex-sm-row align-stretch align-sm-center ga-6 my-12 my-sm-0" :class="[
                    $slots.item ? 'justify-space-between' : 'justify-center',
                    $vuetify.display.smAndDown ? 'flex-wrap' : ''
                ]"> 
                    <JobCycleSubView :cycle="cycle" :items="job.items!" :class="!$slots.item && 'align-center'"/>
                    <slot v-bind="{scheduledItem: cycle}" name="item"></slot>
                </div>
                </v-list-item>
            </template>
            <template #default="{isActive}">
                <v-card @vue:before-mount="pickCycle(cycle)">
                <v-card-title>
                    <v-icon>mdi-pencil-box-outline</v-icon> Edit Cycle 
                </v-card-title>
                <v-card-text>
                    <v-row>
                    <v-col cols="12" sm="6">
                    <h2>Arrangement</h2>
                    <DatePicker allow-new v-model="cycle.date" @update:modelValue="cycleEdits.date = $event" />
                    <v-checkbox
                        v-model="includeTime"
                        label="At Time"
                        class="mt-4"
                    ></v-checkbox>
                    
                    <v-text-field
                        v-if="includeTime"
                        v-model="cycleEdits.time"
                        type="time"
                        label="Time"
                        class="mt-2"
                        :rules="[
                        (value: string) => {
                            if (!value) return true;
                            const [hours, minutes] = value.split(':').map(Number);
                            if (hours < 6 || hours > 18) {
                            return 'Time must be between 06:00 and 18:00';
                            }
                            return true;
                        },
                        ]"
                    ></v-text-field>
                    </v-col>
                    <v-col  cols="12" sm="6">
                    <h2>Items</h2>
                    <v-list>
                        <template v-for="cycleItemId in cycle.items">
                        <v-list-item
                            v-for="jobItem in [job.items!.find(i=>i.uuid === cycleItemId)!]"
                            :key="jobItem.uuid"
                            class="mb-2 py-4 job-item"
                            :ripple="false"
                        >
                        <template #prepend>
                        <v-checkbox
                            v-model="cycleEdits.items"
                            :value="jobItem.uuid"
                            color="primary"
                            hide-details
                            class="mr-2"
                            @click.stop
                        />
                        </template>
                        <template #default>
                        <div class="d-flex align-center" >
                            <v-icon class="mr-2">mdi-spray-bottle</v-icon>
                            <p>
                            {{ jobItem.title }}
                            </p>
                            <v-spacer/>
                            <v-chip color="primary" >
                            <v-icon>mdi-clock{{ !jobItem.cycle_months ? '-outline' : '' }}</v-icon>
                            <!-- <span class="mr-2" v-if="$vuetify.display.mdAndUp">{{ jobCycles[item.cycle_months].text }} </span> -->
                            <span>({{ jobItem.cycle_months }})</span>
                            </v-chip>
                        </div>
                        </template>
                        </v-list-item>
                        </template>
                    </v-list>
                    </v-col>
                    </v-row>
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="isActive.value = false">Back</v-btn>
                    <v-spacer/>
                    <v-btn variant="tonal" color="error">
                        Delete
                        <v-dialog activator="parent" max-width="500">
                            <template #default="{isActive: confirmActive}">
                                <v-card>
                                    <v-card-title>
                                        Are You Sure?
                                    </v-card-title>
                                    <v-card-text>Are you sure you want to delete this cycle?</v-card-text>
                                    <v-card-actions>
                                        <v-btn @click="confirmActive.value=false">No</v-btn>
                                        <v-spacer/>
                                        <v-btn @click="()=> {
                                            $emit('update:item-delete', cycle); 
                                            confirmActive.value = false; 
                                            isActive.value = false
                                            }"
                                            variant="tonal"
                                            color="error"
                                        >
                                            Yes
                                        </v-btn>
                                    </v-card-actions>
                                </v-card>
                            </template>
                        </v-dialog>
                    </v-btn>
                    <v-spacer/>
                    <v-btn 
                        variant="tonal" 
                        color="primary"
                        :disabled="!cycleEdits.items.length"    
                    >
                        Save
                        <MessagingDataBar 
                            :target="{...computedJob, templateMetadata: {updated:true}}"
                            template="quote-work-notify"
                            @save="$emit('edit', {
                                ...cycleEdits, 
                                time: includeTime ? cycleEdits.time : undefined
                            })"
                            @complete="isActive.value = false;"
                        />
                    </v-btn>
                </v-card-actions>
            </v-card>
            </template>
        </v-dialog>
    </v-list>
</template>

<script setup lang="ts">
import { toDateString } from '@shared/helpers';
import { Job, JobCycle } from '@shared/schema';
import { computed, ref } from 'vue';
import DatePicker from './DatePicker.vue';
import MessagingDataBar from './MessagingDataBar.vue';
import JobCycleSubView from './JobCycleSubView.vue';

const props = defineProps<{job: Partial<Job>}>();
const computedCycles = computed(()=>{
    return props.job.cycles!.map(c => ({...c, date: new Date(c.date!)})) as JobCycle[]
})
const includeTime = ref(true)
const cycleEdits = ref<JobCycle>({} as JobCycle)
function pickCycle(cycle: JobCycle){
    cycleEdits.value = {
        ...cycle,
        time: cycle?.time ? cycle.time : '12:00',
    } as JobCycle
}

const computedJob = computed(()=>{
    if(!cycleEdits.value.id || !props.job.cycles) return props.job
    let cycles = [...props.job.cycles!]
    const spotId = cycles.findIndex(c => c.id === cycleEdits.value.id)
    let time = new Date(cycleEdits.value.date).toTimeString()
    if(cycleEdits.value.time){
        time = (cycleEdits.value.time as string)
    }
    cycles[spotId] = {
        ...cycleEdits.value,
        time: includeTime.value ? time : undefined
    } as JobCycle
    return {
        ...props.job,
        cycles
    }
})

</script>

<style scoped>
.cycle-highlight{
    border: solid gold 2px;
    border-radius: 8px;
}
</style>