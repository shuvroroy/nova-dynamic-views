<template>
  <LoadingView :loading="initialLoading">
    <template v-if="relatedResourceLabel && title">
      <Head
        :title="
          __('Update attached :resource: :title', {
            resource: relatedResourceLabel,
            title: title,
          })
        "
      />
    </template>

    <Heading class="mb-3" v-if="relatedResourceLabel && title">
      {{
        __('Update attached :resource: :title', {
          resource: relatedResourceLabel,
          title: title,
        })
      }}
    </Heading>

    <custom-update-attached-header
      class="mb-3"
      :resource-name="resourceName"
      :resource-id="resourceId"
      :related-resource-name="relatedResourceName"
      :related-resource-id="relatedResourceId"
      :via-resource="viaResource"
      :via-resource-id="viaResourceId"
      :via-relationship="viaRelationship"
    />

    <form
      v-if="field"
      @submit.prevent="updateAttachedResource"
      @change="onUpdateFormStatus"
      :data-form-unique-id="formUniqueId"
      autocomplete="off"
    >
      <Card class="mb-8">
        <!-- Related Resource -->
        <div
          v-if="parentResource"
          dusk="via-resource-field"
          class="field-wrapper flex flex-col md:flex-row border-b border-gray-100 dark:border-gray-700"
        >
          <div class="w-1/5 px-8 py-6">
            <label
              :for="parentResource.name"
              class="inline-block text-gray-500 pt-2 leading-tight"
            >
              {{ parentResource.name }}
            </label>
          </div>
          <div class="py-6 px-8 w-1/2">
            <span class="inline-block font-bold text-gray-500 pt-2">
              {{ parentResource.display }}
            </span>
          </div>
        </div>
        <DefaultField
          :field="field"
          :errors="validationErrors"
          :show-help-text="true"
        >
          <template #field>
            <SelectControl
              v-model="selectedResourceId"
              @selected="selectResource"
              :options="availableResources"
              disabled
              label="display"
              class="w-full"
              :class="{
                'form-control-bordered-error': validationErrors.has(
                  field.attribute
                ),
              }"
              dusk="attachable-select"
            >
              <option value="" disabled selected>
                {{ __('Choose :field', { field: field.name }) }}
              </option>
            </SelectControl>
          </template>
        </DefaultField>

        <LoadingView :loading="loading">
          <!-- Pivot Fields -->
          <div v-for="field in fields" :key="field.uniqueKey">
            <component
              :is="'form-' + field.component"
              :resource-name="resourceName"
              :resource-id="resourceId"
              :field="field"
              :form-unique-id="formUniqueId"
              :errors="validationErrors"
              :related-resource-name="relatedResourceName"
              :related-resource-id="relatedResourceId"
              :via-resource="viaResource"
              :via-resource-id="viaResourceId"
              :via-relationship="viaRelationship"
              :show-help-text="true"
            />
          </div>
        </LoadingView>
      </Card>
      <!-- Attach Button -->
      <div
        class="flex flex-col mt-3 md:mt-6 md:flex-row items-center justify-center md:justify-end"
      >
        <Button
          dusk="cancel-update-attached-button"
          @click="cancelUpdatingAttachedResource"
          :label="__('Cancel')"
          variant="ghost"
        />

        <Button
          class="mr-3"
          dusk="update-and-continue-editing-button"
          @click.prevent="updateAndContinueEditing"
          :disabled="isWorking"
          :loading="submittedViaUpdateAndContinueEditing"
        >
          {{ __('Update & Continue Editing') }}
        </Button>

        <Button
          dusk="update-button"
          type="submit"
          :disabled="isWorking"
          :loading="submittedViaUpdateAttachedResource"
        >
          {{
            __('Update :resource', {
              resource: relatedResourceLabel,
            })
          }}
        </Button>
      </div>
    </form>
  </LoadingView>
</template>

<script>
import { Button } from 'laravel-nova-ui'
import {
  PerformsSearches,
  TogglesTrashed,
  FormEvents,
  PreventsFormAbandonment,
  HandlesFormRequest,
} from '@/mixins'
import { mapActions } from 'vuex'
import storage from '@/storage/PivotableFieldStorage'
import tap from 'lodash/tap'

export default {
  components: {
    Button,
  },

  mixins: [
    FormEvents,
    HandlesFormRequest,
    PerformsSearches,
    TogglesTrashed,
    PreventsFormAbandonment,
  ],

  provide() {
    return {
      removeFile: this.removeFile,
    }
  },

  props: {
    resourceName: {
      type: String,
      required: true,
    },
    resourceId: {
      required: true,
    },
    relatedResourceName: {
      type: String,
      required: true,
    },
    relatedResourceId: {
      required: true,
    },
    viaResource: {
      default: '',
    },
    viaResourceId: {
      default: '',
    },
    parentResource: {
      type: Object,
    },
    viaRelationship: {
      default: '',
    },
    viaPivotId: {
      default: null,
    },
    polymorphic: {
      default: false,
    },
  },

  data: () => ({
    initialLoading: true,
    loading: true,
    submittedViaUpdateAndContinueEditing: false,
    submittedViaUpdateAttachedResource: false,

    field: null,
    softDeletes: false,
    fields: [],
    selectedResourceId: null,
    lastRetrievedAt: null,
    title: null,
  }),

  created() {
    if (Nova.missingResource(this.resourceName)) return Nova.visit('/404')
  },

  /**
   * Mount the component.
   */
  mounted() {
    this.initializeComponent()
  },

  methods: {
    ...mapActions(['fetchPolicies']),

    /**
     * Initialize the component's data.
     */
    async initializeComponent() {
      this.softDeletes = false
      this.disableWithTrashed()
      this.clearSelection()
      await this.getField()
      await this.getPivotFields()
      await this.getAvailableResources()
      this.resetErrors()

      this.selectedResourceId = this.relatedResourceId

      this.updateLastRetrievedAtTimestamp()
    },

    removeFile(attribute) {
      const {
        resourceName,
        resourceId,
        relatedResourceName,
        relatedResourceId,
        viaRelationship,
      } = this

      const uri = Nova.request().delete(
        `/nova-api/${resourceName}/${resourceId}/${relatedResourceName}/${relatedResourceId}/field/${attribute}?viaRelationship=${viaRelationship}`
      )
    },

    /**
     * Handle pivot fields loaded event.
     */
    handlePivotFieldsLoaded() {
      this.loading = false

      Object.values(this.fields).forEach(field => {
        if (field) {
          field.fill = () => ''
        }
      })
    },

    /**
     * Get the many-to-many relationship field.
     */
    async getField() {
      this.field = null

      const { data: field } = await Nova.request().get(
        '/nova-api/' + this.resourceName + '/field/' + this.viaRelationship,
        {
          params: {
            relatable: true,
          },
        }
      )

      this.field = field

      if (this.field.searchable) {
        this.determineIfSoftDeletes()
      }

      this.initialLoading = false
    },

    /**
     * Get all of the available pivot fields for the relationship.
     */
    async getPivotFields() {
      this.fields = []

      const {
        data: { title, fields },
      } = await Nova.request()
        .get(
          `/nova-api/${this.resourceName}/${this.resourceId}/update-pivot-fields/${this.relatedResourceName}/${this.relatedResourceId}`,
          {
            params: {
              editing: true,
              editMode: 'update-attached',
              viaRelationship: this.viaRelationship,
              viaPivotId: this.viaPivotId,
            },
          }
        )
        .catch(error => {
          if (error.response.status == 404) {
            Nova.visit('/404')
            return
          }
        })

      this.title = title
      this.fields = fields

      this.handlePivotFieldsLoaded()
    },

    /**
     * Get all of the available resources for the current search / trashed state.
     */
    async getAvailableResources(search = '') {
      Nova.$progress.start()

      try {
        const response = await storage.fetchAvailableResources(
          this.resourceName,
          this.resourceId,
          this.relatedResourceName,
          {
            params: {
              search,
              current: this.relatedResourceId,
              first: true,
              withTrashed: this.withTrashed,
              component: this.field.component,
              viaRelationship: this.viaRelationship,
            },
          }
        )

        this.availableResources = response.data.resources
        this.withTrashed = response.data.withTrashed
        this.softDeletes = response.data.softDeletes
      } catch (error) {}

      Nova.$progress.done()
    },

    /**
     * Determine if the related resource is soft deleting.
     */
    determineIfSoftDeletes() {
      Nova.request()
        .get('/nova-api/' + this.relatedResourceName + '/soft-deletes')
        .then(response => {
          this.softDeletes = response.data.softDeletes
        })
    },

    /**
     * Update the attached resource.
     */
    async updateAttachedResource() {
      this.submittedViaUpdateAttachedResource = true

      try {
        await this.updateRequest()

        this.submittedViaUpdateAttachedResource = false

        await this.fetchPolicies(),
          Nova.success(this.__('The resource was updated!'))

        Nova.visit(`/resources/${this.resourceName}/${this.resourceId}`)
      } catch (error) {
        window.scrollTo(0, 0)

        this.submittedViaUpdateAttachedResource = false

        this.handleOnUpdateResponseError(error)
      }
    },

    /**
     * Update the resource and reset the form
     */
    async updateAndContinueEditing() {
      this.submittedViaUpdateAndContinueEditing = true

      try {
        await this.updateRequest()

        window.scrollTo(0, 0)

        this.disableNavigateBackUsingHistory()

        this.submittedViaUpdateAndContinueEditing = false

        Nova.success(this.__('The resource was updated!'))

        // Reset the form by refetching the fields
        this.initializeComponent()
      } catch (error) {
        this.submittedViaUpdateAndContinueEditing = false

        this.handleOnUpdateResponseError(error)
      }
    },

    cancelUpdatingAttachedResource() {
      this.handleProceedingToPreviousPage()

      this.proceedToPreviousPage(
        `/resources/${this.resourceName}/${this.resourceId}`
      )
    },

    /**
     * Send an update request for this resource
     */
    updateRequest() {
      return Nova.request().post(
        `/nova-api/${this.resourceName}/${this.resourceId}/update-attached/${this.relatedResourceName}/${this.relatedResourceId}`,
        this.updateAttachmentFormData(),
        {
          params: {
            editing: true,
            editMode: 'update-attached',
            viaPivotId: this.viaPivotId,
          },
        }
      )
    },

    /*
     * Get the form data for the resource attachment update.
     */
    updateAttachmentFormData() {
      return tap(new FormData(), formData => {
        Object.values(this.fields).forEach(field => {
          field.fill(formData)
        })

        formData.append('viaRelationship', this.viaRelationship)

        if (!this.selectedResourceId) {
          formData.append(this.relatedResourceName, '')
        } else {
          formData.append(
            this.relatedResourceName,
            this.selectedResourceId ?? ''
          )
        }

        formData.append(this.relatedResourceName + '_trashed', this.withTrashed)
        formData.append('_retrieved_at', this.lastRetrievedAt)
      })
    },

    /**
     * Toggle the trashed state of the search
     */
    toggleWithTrashed() {
      this.withTrashed = !this.withTrashed

      // Reload the data if the component doesn't support searching
      if (!this.isSearchable) {
        this.getAvailableResources()
      }
    },

    /**
     * Update the last retrieved at timestamp to the current UNIX timestamp.
     */
    updateLastRetrievedAtTimestamp() {
      this.lastRetrievedAt = Math.floor(new Date().getTime() / 1000)
    },

    onUpdateFormStatus() {
      //
    },

    isSelectedResourceId(value) {
      return (
        value != null &&
        value?.toString() === this.selectedResourceId?.toString()
      )
    },
  },

  computed: {
    /**
     * Get the attachment endpoint for the relationship type.
     */
    attachmentEndpoint() {
      return this.polymorphic
        ? '/nova-api/' +
            this.resourceName +
            '/' +
            this.resourceId +
            '/attach-morphed/' +
            this.relatedResourceName
        : '/nova-api/' +
            this.resourceName +
            '/' +
            this.resourceId +
            '/attach/' +
            this.relatedResourceName
    },

    /**
     * Get the label for the related resource.
     */
    relatedResourceLabel() {
      if (this.field) {
        return this.field.singularLabel
      }
    },

    /**
     * Determine if the related resources is searchable
     */
    isSearchable() {
      return this.field.searchable
    },

    /**
     * Determine if the form is being processed
     */
    isWorking() {
      return (
        this.submittedViaUpdateAttachedResource ||
        this.submittedViaUpdateAndContinueEditing
      )
    },

    selectedResource() {
      return this.availableResources.find(r =>
        this.isSelectedResourceId(r.value)
      )
    },
  },
}
</script>
