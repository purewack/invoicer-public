<template>
  <v-dialog v-model="isOpen" persistent width="600">
    <v-card>
      <v-card-title class="headline">
        {{ title }}
        <v-progress-linear
          v-if="!processComplete && !hasErrors"
          indeterminate
          color="primary"
          class="mt-2"
        ></v-progress-linear>
      </v-card-title>

      <v-card-text>
        <v-list lines="two">
          <v-list-item
            v-for="(step, index) in visibleSteps"
            :key="index"
            :data-status="step.status"
            class="step-item"
          >
            <template v-slot:prepend>
              <v-icon
                v-if="step.status === 'ok'"
                color="success"
                class="mr-3"
              >mdi-check-circle</v-icon>
              <v-icon
                v-else-if="step.status === 'skipped'"
                color="success"
                class="mr-3"
              >mdi-chevron-down</v-icon>
              <v-progress-circular
                v-else-if="step.status === 'processing'"
                indeterminate
                color="primary"
                size="24"
                width="2"
                class="mr-3"
              ></v-progress-circular>
              <v-icon
                v-else-if="step.status === 'issue'"
                color="warning"
                class="mr-3"
              >mdi-alert</v-icon>
              <v-icon
                v-else-if="step.status === 'error'"
                color="error"
                class="mr-3"
              >mdi-alert-circle</v-icon>
              <v-icon
                v-else
                color="grey"
                class="mr-3"
              >mdi-circle-outline</v-icon>
            </template>

            <div>
              <div class="text-subtitle-1">{{ step.heading }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ step.message }} 
                <span v-if="step.status === 'error' && step.retryCount < maxRetries" class="text-caption text-right">
                  [Attempt: {{ step.retryCount }}/{{ maxRetries }}]
                </span>
              </div>
            </div>

            <template v-slot:append>
              <v-chip v-if="step.status !== 'pending'" size="small" :color="getStatusColor(step.status)" style="text-transform: uppercase;">
                {{ step.status }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          v-if="hasErrors"
          color="error"
          variant="tonal"
          @click="retryProcess"
        >
          <v-icon left>mdi-reload</v-icon>
          Retry
        </v-btn>
        <v-btn
          v-if="showAbort && !processComplete"
          color="secondary"
          @click="cancelProcess"
        >
          Cancel
        </v-btn>
        <template v-if="processComplete">
          <slot v-if="$slots.postactions" name="postactions"></slot>
          <v-btn 
            color="primary"
            @click="closeModal"
          >
            {{ successButtonText }}
          </v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: 'Processing'
    },
    processFunction: {
      type: Function,
      required: true
    },
    processArgs: {
      type: Array,
      default: () => []
    },
    maxRetries: {
      type: Number,
      default: 3
    },
    successButtonText: {
      type: String,
      default: 'Done'
    },
    showAbort: {
      type: Boolean,
      default: true
    },
    showAllSteps: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      isOpen: true,
      processComplete: false,
      hasErrors: false,
      steps: [],
      abortController: null
    };
  },

  computed: {
    visibleSteps() {
      return this.steps.filter(step => step.status !== 'pending' || this.showAllSteps);
    }
  },

  mounted() {
    this.steps = []
    this.startProcess();
  },

  methods: {
    getStatusColor(status) {
      const colors = {
        processing: 'primary',
        ok: 'success',
        issue: 'warning',
        error: 'error',
        pending: 'grey'
      };
      return colors[status] || 'grey';
    },

    async startProcess() {
      this.processComplete = false;
      this.hasErrors = false;
      this.steps = [];
      this.abortController = new AbortController();
      console.log(this.processArgs)
      try{
        const result = await this.processFunction(
          ...this.processArgs,
          this.handleStepSuccess,
          this.handleStepError,
          {
            maxRetries: this.maxRetries,
            signal: this.abortController.signal
          }
        )
        this.processComplete = true;
        this.hasErrors = false;
        this.$emit('success', result);
      }
      catch(error){
        if (error.message !== 'Operation aborted by user') {
          this.hasErrors = true;
          this.$emit('error', error);
          this.steps[this.steps.length-1].status = 'error'
        }
      };
    },

    handleStepSuccess(stepIndex, heading, result) {
      // Vue 3 way - directly assign to reactive array
      this.steps[stepIndex] = {
        heading,
        status: result.skipped ? 'skipped' : 'ok',
        message: result.skipped ? 'Skipped' : 'Completed',
        retryCount: 0
      };
      this.hasErrors = false;
      // Force reactivity update if needed
      this.steps = [...this.steps];
    },

    handleStepError(error, stepIndex, heading, meta) {
      // Vue 3 way - directly assign to reactive array
      this.steps[stepIndex] = {
        heading: heading,
        status: 'issue',
        message: error.message,
        retryCount: meta?.retryCount || 0
      };
      
      // Force reactivity update if needed
      this.steps = [...this.steps];
    },

    cancelProcess() {
      if (this.abortController) {
        this.abortController.abort();
      }
      this.closeModal();
    },

    closeModal() {
      this.isOpen = false;
      this.$emit('input', false);
      this.$emit('close');
    },

    retryProcess() {
      this.startProcess();
    }
  }
};
</script>

<style scoped>
/* .step-item {
  border-left: 3px solid rgba(var(--v-border-color), var(--v-border-opacity));
  margin-bottom: 8px;
  padding-left: 12px;
  transition: all 0.3s ease;
}

.step-item[data-status="processing"] {
  border-left-color: rgb(var(--v-theme-primary));
}

.step-item[data-status="ok"] {
  border-left-color: rgb(var(--v-theme-success));
}

.step-item[data-status="error"] {
  border-left-color: rgb(var(--v-theme-error));
} */
</style>