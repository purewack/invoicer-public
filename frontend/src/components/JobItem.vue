<template>
  <div class="d-flex w-100 ga-4" :class="'flex-column justify-space-between'">
    <div class="d-flex ga-2" :class="'flex-grow-1 justify-start'" v-if="!simple">  
      <v-btn 
        :color="item.group_type === 'suggested' ? 'warning' : ''"
        @click="
          item.group_type =
            item.group_type === 'suggested' ? 'requested' : 'suggested';
          changeSelf();
        "
        variant="outlined"
      >
        <v-icon>
          mdi-{{
            item.group_type === 'suggested'
              ? 'star'
              : 'spray-bottle'
          }}
        </v-icon>
        {{ `${$vuetify.display.mdAndUp && (item.group_type === 'suggested' ? 'Deal' : 'Standard') || ''}` }}
      </v-btn>

      <v-btn v-if="allowCycles" variant="outlined" :color="jobCycles[item.cycle_months].color" @click="changeCycle">
        <v-icon>mdi-clock{{ !item.cycle_months ? '-outline' : '' }}</v-icon>
        {{ $vuetify.display.mdAndUp ? jobCycles[item.cycle_months].text : item.cycle_months }}
      </v-btn>  

      <v-btn v-if="!isOnlyItem" color="error" variant="tonal" :class="'ml-auto'" text @click="deleteSelf">
        <template v-if="$vuetify.display.mdAndUp">Delete</template>
        <v-icon v-else>mdi-delete-outline</v-icon>
      </v-btn>
    </div>



    <v-dialog max-width="500px" v-if="!simple">
      <template #activator={props}>
        <div :key="item.title + item.categories?.join(',')" class="d-flex ga-2 cursor-pointer" @click="props.onClick">
          <template v-for="category in _JobItemCategory">
            <v-chip
            :key="category"
            v-if="item.category?.includes(category)"
            class="ma-1"
            color="secondary"
            >
              <v-icon class="mr-2">mdi-tag</v-icon>
              {{ capitalizeWords(category) }}
            </v-chip>
          </template>
        </div>
      </template>
      
      <template #default={isActive}>
      <JobItemCategorySelector 
        :title="titleModel"
        :categories="item.category"
        @close="isActive.value = false"
        @select="(values)=>{updateDetail(values); isActive.value = false}" 
      />
      </template>
    </v-dialog>

    <div class="flex-grow-1">
      <div class="d-flex" :class="$vuetify.display.xs ? 'flex-column-reverse' : 'ga-2'">
        <v-combobox
          v-model="titleModel"
          :items="availableTitles"
          item-title="title"
          item-value="title"
          label="Title *"
          :rules="[v => !!v || 'Title is required']"
          variant="outlined"
          @update:model-value="updateTitle"
          @keydown.enter.prevent="addTitle"
          :return-object="false"
        >
        <template v-slot:append-inner>
            

            <v-dialog max-width="500px">
              <template #activator={props}>
                <v-chip
                  v-bind="props"
                  class="ml-2"
                  variant="flat"
                  v-if="titleModel && !availableTitles.find(v => v.title === titleModel)"
                >
                  <v-icon>mdi-plus</v-icon>
                  Keep
                </v-chip>
              </template>
              
              <template #default={isActive}>
              <JobItemCategorySelector 
                :title="titleModel"
                :categories="item.category"
                @close="isActive.value = false"
                @select="(values)=>{addTitle(values); isActive.value = false}" 
              />
              </template>
            </v-dialog>
          </template>

          <template v-slot:item="{ item, props }">
            <v-list-item v-bind="props" :value="item.title">
              <template v-slot:title>
                <v-chip :color="colors[item.raw.id]" small class="mr-2">
                  {{ item.raw.title }}
                </v-chip>
              </template>
              <template v-slot:append>
                <v-icon
                  size="small"
                  @click.stop="deleteTitle(item.raw)"
                >
                  mdi-close
                </v-icon>
              </template>
            </v-list-item>
          </template>
        </v-combobox>
        
        <!-- Window Cleaning Pricing -->
        <div v-if="isWindowCleaning && !simple" class="d-flex ga-2">
          <v-text-field
            v-model.number="item.unit_price"
            type="number"
            label="Initial (£)"
            prefix="£"
            step="5"
            variant="outlined"
            style="max-width: 150px;"
            :rules="[v => !!v || 'Price is required', v => v >= 0 || 'Price needs to be more than £0']"
            @input="changeSelf"
            @click="()=>{ if(item.unit_price === 0) item.unit_price = '' }"
          ></v-text-field>
          <v-text-field
            v-model.number="item.monthly_price"
            type="number"
            label="Monthly (£)"
            prefix="£"
            step="5"
            variant="outlined"
            :rules="[v => !!v || 'Price is required', v => v >= 0 || 'Price needs to be more than £0']"
            style="max-width: 150px;"
            @input="changeSelf"
            @click="()=>{ if(item.monthly_price === 0) item.monthly_price = '' }"
          ></v-text-field>
          <v-text-field
            v-model.number="item.bimonthly_price"
            type="number"
            label="Bi-monthly (£)"
            prefix="£"
            step="5"
            variant="outlined"
            :rules="[v => !!v || 'Price is required', v => v >= 0 || 'Price needs to be more than £0']"
            style="max-width: 150px;"
            @input="changeSelf"
            @click="()=>{ if(item.bimonthly_price === 0) item.bimonthly_price = '' }"
          ></v-text-field>
        </div>
        
        <!-- Other Services Pricing -->
        <v-text-field
          v-else
          v-model.number="item.unit_price"
          type="number"
          label="Price (£) *"
          :rules="[v => !!v || 'Price is required', v => v >= 0 || 'Price needs to be more than £0']"
          prefix="£"
          step="5"
          variant="outlined"
          style="max-width: 150px;"
          @input="changeSelf"
          @click="()=>{ if(item.unit_price === 0) item.unit_price = '' }"
        ></v-text-field>
      </div>

      <div class="d-flex ga-2">
        <v-textarea 
          v-if="!simple"
          v-model="item.detail"
          label="Details"
          variant="outlined"
          rows="1"
          auto-grow
          @focus="isDetailAreaFocused = true"
          @blur="handleBlur"
          @input="changeSelf"
          spellcheck="true"
        >
          <template v-slot:append-inner>
            <v-dialog max-width="500px">
              <template #activator={props}>
                <v-chip
                  @click.prevent.stop="props.onClick"
                  class="ml-2"
                  variant="flat"
                  v-if="isDetailAreaFocused && titleModel && availableTitles.find(v => v.title === item.title) && !availableTitles.find(v => v.title === item.title && v.detail === item.detail)"
                >
                  <v-icon>mdi-plus</v-icon>
                  Update
                </v-chip>

              </template>
              
              <template #default={isActive}>
              <JobItemCategorySelector 
                :title="titleModel"
                :categories="item.category"
                @close="isActive.value = false"
                @select="(values)=>{updateDetail(values); isActive.value = false}" 
              />
              </template>
            </v-dialog>
          </template>
        </v-textarea>
      </div>
    </div>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.text }}
      
      <template v-slot:actions>
        <v-btn
          v-if="snackbar.undo"
          variant="text"
          @click="snackbar.undo"
        >
          Undo
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { capitalizeWords } from '@shared/helpers';
import { _JobItemCategory, jobCycles } from '@shared/schema';
import JobItemCategorySelector from './JobItemCategorySelector.vue';

const props = defineProps({
  value: {
    type: Object
  },
  selfIndex: {
    type: Number
  },
  isOnlyItem: {
    type: Boolean,
    default: false
  },
  availableTitles: {
    type: Array,
    required: true
  },
  allowCycles: {
    type: Boolean,
    default: false
  },
  simple: {
    type: Boolean,
    default: false,
  }
});

const emit = defineEmits(['deleted', 'changed', 'add-title', 'update-title', 'remove-title']);


const item = reactive({ ...props.value, id: null });
const isValid = ref(false);
const isDetailAreaFocused = ref(false);
const titleModel = ref(null);
const snackbar = reactive({
  show: false,
  color: 'success',
  text: '',
  undo: null
});
const colorPalette = [
  'blue',
  'cyan',
  'green',
  'yellow-darken-2',
  'orange',
  'red',
  'purple',
  'indigo',
  'deep-purple',
  'light-blue',
  'teal',
  'green',
  'light-green',
  'amber',
  'deep-orange',
  'brown',
  'blue-grey'
];
const colors = reactive({});

const isWindowCleaning = computed(() => {
  return titleModel.value && titleModel.value.toLowerCase().includes('window');
});

function updateTitle(t) {
  const foundItem = props.availableTitles.find(i => i.title === t);
  if (foundItem) {
    item.detail = foundItem.detail;
    item.cycle_months = foundItem.cycle;
    item.category = foundItem.category
    if (isWindowCleaning.value) {
      item.unit_price = null;
      item.monthly_price = item.monthly_price || '';
      item.bimonthly_price = item.bimonthly_price || '';
    } else {
      item.monthly_price = null;
      item.bimonthly_price = null;
      item.unit_price = item.unit_price || '';
    }
  }
  changeSelf();
}

function handleBlur() {
  setTimeout(() => {
    isDetailAreaFocused.value = false;
  }, 100);
}

function deleteSelf() {
  const t = capitalizeWords(titleModel.value ? titleModel.value : '');
  emit('deleted', { ...item, title: t }, item.uuid);
}

function changeSelf() {
  const t = capitalizeWords(titleModel.value ? titleModel.value : '');
  emit('changed', { ...item, title: t }, item.uuid);
}

function changeCycle() {
  switch (item.cycle_months) {
    case 0:
      item.cycle_months = 1;
      break;
    case 1:
      item.cycle_months = 2;
      break;
    case 2:
      item.cycle_months = 12;
      break;
    default:
      item.cycle_months = 0;
      break;
  }
  changeSelf();
}


function addTitle(selectedCategories) {
  const t = capitalizeWords(titleModel.value);
  titleModel.value = t;
  // console.log(t)
  item.categories = [...selectedCategories]
  emit('add-title', { title: t, detail: item.detail, category:   item.categories  });
}



function updateDetail(selectedCategories) {
  const t = capitalizeWords(titleModel.value);
  titleModel.value = t;
  item.categories = [...selectedCategories]
  console.log("update",item,selectedCategories)
  const entity = props.availableTitles.find(i => i.title == t);
  emit('update-title', { id: entity.id, title: entity.title, detail: item.detail, category:   item.categories  });
}

function deleteTitle(item) {
  emit('remove-title', item);
}

watch(
  () => props.value,
  (newVal) => {
    Object.assign(item, newVal);
    titleModel.value = null;
    if (item.title?.length > 0) titleModel.value = item.title;
  },
  { deep: true, immediate: true }
);

watch(
  () => props.availableTitles,
  (newVal) => {
    Object.keys(colors).forEach(key => delete colors[key]);
    newVal.forEach((v, i) => {
      colors[v.id] = colorPalette[i % colorPalette.length];
    });
  },
  { deep: true, immediate: true }
);
</script>
