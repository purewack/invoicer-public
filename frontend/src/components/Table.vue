<template>
  <v-container max-width="100%">
    <!-- Search Bar -->
    <v-text-field
      v-model="searchTerm"
      label="Search"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      clearable
      @update:modelValue="handleSearch"
      class="mb-4"
      v-if="!isClientSide"
    />

    <v-data-table-server
      :headers="headers"
      :items="processedItems"
      :items-length="totalItems"
      :loading="loading"
      v-model:page="currentPage"
      v-model:items-per-page="pageSize"
      @update:options="handleOptionsUpdate"
      @click:row="(ev, row)=>$emit('click:item', row.item)"
      class="capitalize"
      loading-text="Loading... Please wait"
      :server-items-length="isClientSide ? items.length : totalItems"
    >
      <!-- Dynamic slots for all fields -->
      <template v-for="header in headers" :key="header.key" #[`item.${header.key}`]="{ item }">
        <slot v-if="$slots[header.key]" :name="header.key" :item="item" />
        <span v-else-if="header.format">{{ header.format(item) }}</span>
        <span v-else>{{ item[header.key] }}</span>
      </template>

      <!-- Action slot -->
      <template v-if="$slots.action" v-slot:item.actions="{ item }">
        <slot name="action" :item="item" />
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { SearchServiceController } from '@shared/api';
import { capitalizeWords } from '@shared/helpers';

const props = defineProps({
  tableName: String,
  items: Array,
  included: {
    type: Array,
    default: () => [],
  },
  excluded: {
    type: Array,
    default: () => ['created_at', 'updated_at'],
  },
  searchInFields: {
    type: Array,
    default: () => [],
  },
  customFields: {
    type: Object,
    default: () => ({}),
  },
  query: {
    type: Object,
    required: false
  }
});

const emit = defineEmits(['click:item']);

// Reactive state
const searchTerm = ref('');
const loading = ref(false);
const totalItems = ref(0);
const pageSize = ref(10);
const currentPage = ref(1);
const serverItems = ref([]);
const headers = ref([]);
const searchFields = ref([]);

// Derived state
const isClientSide = !props.tableName;
const processedItems = ref([]);

// Initialize the table based on props
const initializeTable = async () => {
  if (isClientSide) {
    initializeClientSide();
  } else {
    await initializeServerSide();
  }
  updateProcessedItems();
};

// Client-side initialization
const initializeClientSide = () => {
  if (!props.items?.length) return;

  // Get all fields to display
  const fields = getFieldsFromProps();
  
  // Create headers
  headers.value = Object.entries(fields).map(([key, config]) => ({
    title: config.label,
    key,
    sortable: false,
    format: config.format,
  }));

  // Initialize search fields if not specified
  if (props.searchInFields.length === 0) {
    searchFields.value = Object.keys(fields).filter(key => !fields[key].format);
  } else {
    searchFields.value = props.searchInFields;
  }
};

// Server-side initialization
const initializeServerSide = async () => {
  try {
    const info = await SearchServiceController.tableInfo(props.tableName, props.query);
    if (!info) return;

    // Get all fields to display
    const fields = getFieldsFromProps(info.fields);
    
    // Create headers
    headers.value = Object.entries(fields).map(([key, config]) => ({
      title: config.label,
      key,
      sortable: false,
      format: config.format,
    }));


    // Initialize search fields if not specified
    if (props.searchInFields.length === 0) {
      searchFields.value = info.fields
        .filter(col => fields[col.key] && !fields[col.key].format && !col.relation)
        .map(col => col.key);
    } else {
      searchFields.value = props.searchInFields;
    }

    await fetchData();
  } catch (error) {
    console.error('Error initializing table:', error);
  }
};

// Get all fields that should be displayed
const getFieldsFromProps = (serverFields = []) => {
  const fields = {};
  const excluded = props.excluded;

  // 1. Process included fields
  if (props.included.length > 0) {
    props.included.forEach(field => {
      const key = typeof field === 'string' ? field : field.field || field.key;
      const label = typeof field === 'string' 
        ? capitalizeWords(key.split('_').join(' ')) 
        : field.label || capitalizeWords(key.split('_').join(' '));
      const format = typeof field === 'string' ? undefined : field.format;
      
      if (!excluded.includes(key)) {
        fields[key] = { label, format };
      }
    });
  } 
  // 2. No included fields - use all available fields
  else {
    const sourceFields = isClientSide 
      ? (props.items[0] ? Object.keys(props.items[0]) : [])
      : serverFields.map(f => f.key);
    
    sourceFields.forEach(key => {
      if (!excluded.includes(key)) {
        fields[key] = {
          label: capitalizeWords(key.split('_').join(' ')),
          format: undefined,
        };
      }
    });
  }

  // 3. Apply custom fields (can override existing fields)
  Object.entries(props.customFields).forEach(([key, config]) => {
    if (!excluded.includes(key)) {
      fields[key] = {
        label: config.label || capitalizeWords(key.split('_').join(' ')),
        format: config.format,
      };
    }
  });

  return fields;
};

// Update processed items with custom formatting
const updateProcessedItems = () => {
  const sourceItems = isClientSide ? props.items : serverItems.value;
  if (!sourceItems) return;

  processedItems.value = sourceItems.map(item => {
    const processedItem = { ...item };
    headers.value.forEach(header => {
      if (header.format) {
        processedItem[header.key] = header.format(item);
      }
    });
    return processedItem;
  });
};


const fetchData = async (options = {}) => {
  if (isClientSide) return;
  
  try {
    loading.value = true;
    let response;
    
    const pagination = { 
      page: options.page || currentPage.value, 
      limit: options.itemsPerPage || pageSize.value
    };

    if (searchTerm.value) {
      response = await SearchServiceController.tableFind(
        searchTerm.value,
        props.tableName,
        props.query,
        searchFields.value,
        pagination
      );
    } else {
      response = await SearchServiceController.tableGet(
        props.tableName, 
        props.query, 
        pagination
      );
    }

    serverItems.value = response.data || [];
    totalItems.value = response.total || response.pagination?.totalItems || 0;
    
    updateProcessedItems();
  } catch (error) {
    console.error('Error fetching data:', error);
    serverItems.value = [];
    totalItems.value = 0;
  } finally {
    loading.value = false;
  }
};

// Handle options update from v-data-table-server
const handleOptionsUpdate = (options) => {
  currentPage.value = options.page;
  pageSize.value = options.itemsPerPage;
  fetchData(options);
};

// Debounced search
const debouncedSearch = useDebounceFn(async () => {
  currentPage.value = 1;
  await fetchData();
}, 500);

const handleSearch = () => {
  if (isClientSide) return;
  loading.value = true;
  debouncedSearch();
};

// Initialize on mount
onMounted(initializeTable);

// Watch for pagination changes
watch([currentPage, pageSize], () => {
  if (!isClientSide) {
    fetchData();
  }
});

// Watch for items changes in client-side mode
watch(() => props.items, () => {
  if (isClientSide) {
    updateProcessedItems();
  }
}, { deep: true });
</script>

<style>
.capitalize {
  text-transform: capitalize;
}

.v-progress-linear {
  transition: opacity 0.3s ease;
}
</style>