<template>
  <LoadingView :loading="initialLoading">
    <template v-if="relatedResourceLabel">
      <Head
        :title="
          __('Attach :resource', {
            resource: relatedResourceLabel,
          })
        "
      />
    </template>

    <custom-attach-header
      class="mb-3"
      :resource-name="resourceName"
      :resource-id="resourceId"
      :related-resource-name="relatedResourceName"
      :via-relationship="viaRelationship"
      :via-resource="viaResource"
      :via-resource-id="viaResourceId"
    />

    <Heading
      class="mb-3"
      v-text="__('Attach :resource', { resource: relatedResourceLabel })"
      dusk="attach-heading"
    />

    <form
      v-if="field"
      @submit.prevent="attachResource"
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
            <div class="flex items-center">
              <SearchInput
                v-if="field.searchable"
                v-model="selectedResourceId"
                @selected="selectResource"
                @input="performSearch"
                @clear="clearResourceSelection"
                :options="availableResources"
                :debounce="field.debounce"
                trackBy="value"
                :autocomplete="field.autocomplete"
                class="w-full"
                :dusk="`${field.resourceName}-search-input`"
              >
                <div v-if="selectedResource" class="flex items-center">
                  <div v-if="selectedResource.avatar" class="mr-3">
                    <img
                      :src="selectedResource.avatar"
                      class="w-8 h-8 rounded-full block"
                    />
                  </div>

                  {{ selectedResource.display }}
                </div>

                <template #option="{ selected, option }">
                  <div class="flex items-center">
                    <div v-if="option.avatar" class="flex-none mr-3">
                      <img
                        :src="option.avatar"
                        class="w-8 h-8 rounded-full block"
                      />
                    </div>

                    <div class="flex-auto">
                      <div
                        class="text-sm font-semibold leading-5"
                        :class="{ 'text-white': selected }"
                      >
                        {{ option.display }}
                      </div>

                      <div
                        v-if="field.withSubtitles"
                        class="mt-1 text-xs font-semibold leading-5 text-gray-500"
                        :class="{ 'text-white': selected }"
                      >
                        <span v-if="option.subtitle">{{
                          option.subtitle
                        }}</span>
                        <span v-else>{{
                          __('No additional information...')
                        }}</span>
                      </div>
                    </div>
                  </div>
                </template>
              </SearchInput>

              <SelectControl
                v-else
                v-model="selectedResourceId"
                @selected="selectResource"
                :options="availableResources"
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
                  {{
                    __('Choose :resource', {
                      resource: relatedResourceLabel,
                    })
                  }}
                </option>
              </SelectControl>

              <Button
                v-if="canShowNewRelationModal"
                variant="link"
                size="small"
                leading-icon="plus-circle"
                @click="openRelationModal"
                class="ml-2"
                :dusk="`${field.attribute}-inline-create`"
              />
            </div>

            <CreateRelationModal
              :show="canShowNewRelationModal && relationModalOpen"
              @set-resource="handleSetResource"
              @create-cancelled="closeRelationModal"
              :resource-name="field.resourceName"
              :resource-id="resourceId"
              :via-relationship="viaRelationship"
              :via-resource="viaResource"
              :via-resource-id="viaResourceId"
            />

            <TrashedCheckbox
              v-if="shouldShowTrashed"
              class="mt-3"
              :resource-name="field.resourceName"
              :checked="withTrashed"
              @input="toggleWithTrashed"
            />
          </template>
        </DefaultField>

        <LoadingView :loading="loading">
          <!-- Pivot Fields -->
          <div v-for="field in fields" :key="field.uniqueKey">
            <component
              :is="`form-${field.component}`"
              :resource-name="resourceName"
              :resource-id="resourceId"
              :related-resource-name="relatedResourceName"
              :field="field"
              :form-unique-id="formUniqueId"
              :errors="validationErrors"
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
        class="flex flex-col md:flex-row md:items-center justify-center md:justify-end space-y-2 md:space-y-0 space-x-3"
      >
        <Button
          dusk="cancel-attach-button"
          @click="cancelAttachingResource"
          :label="__('Cancel')"
          variant="ghost"
        />

        <Button
          dusk="attach-and-attach-another-button"
          @click.native.prevent="attachAndAttachAnother"
          :disabled="isWorking"
          :loading="submittedViaAttachAndAttachAnother"
        >
          {{ __('Attach & Attach Another') }}
        </Button>

        <Button
          type="submit"
          dusk="attach-button"
          :disabled="isWorking"
          :loading="submittedViaAttachResource"
        >
          {{
            __('Attach :resource', {
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
  HandlesFormRequest,
  PreventsFormAbandonment,
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
    polymorphic: {
      default: false,
    },
  },

  data: () => ({
    initialLoading: true,
    loading: true,
    submittedViaAttachAndAttachAnother: false,
    submittedViaAttachResource: false,

    field: null,
    softDeletes: false,
    fields: [],
    selectedResourceId: null,
    relationModalOpen: false,
    initializingWithExistingResource: false,
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
    initializeComponent() {
      this.softDeletes = false
      this.disableWithTrashed()
      this.clearSelection()
      this.getField()
      this.getPivotFields()
      this.resetErrors()
    },

    /**
     * Handle pivot fields loaded event.
     */
    handlePivotFieldsLoaded() {
      this.loading = false

      Object.values(this.fields).forEach(field => {
        field.fill = () => ''
      })
    },

    /**
     * Get the many-to-many relationship field.
     */
    getField() {
      this.field = null

      Nova.request()
        .get(
          '/nova-api/' + this.resourceName + '/field/' + this.viaRelationship,
          {
            params: {
              relatable: true,
            },
          }
        )
        .then(({ data }) => {
          this.field = data
          this.field.searchable
            ? this.determineIfSoftDeletes()
            : this.getAvailableResources()
          this.initialLoading = false
        })
    },

    /**
     * Get all of the available pivot fields for the relationship.
     */
    getPivotFields() {
      this.fields = []
      this.loading = true

      Nova.request()
        .get(
          '/nova-api/' +
            this.resourceName +
            '/' +
            this.resourceId +
            '/creation-pivot-fields/' +
            this.relatedResourceName,
          {
            params: {
              editing: true,
              editMode: 'attach',
              viaRelationship: this.viaRelationship,
            },
          }
        )
        .then(({ data }) => {
          this.fields = data

          this.handlePivotFieldsLoaded()
        })
    },

    /**
     * Get all of the available resources for the current search / trashed state.
     */
    getAvailableResources(search = '') {
      Nova.$progress.start()

      return storage
        .fetchAvailableResources(
          this.resourceName,
          this.resourceId,
          this.relatedResourceName,
          {
            params: {
              search,
              current: this.selectedResourceId,
              first: this.initializingWithExistingResource,
              withTrashed: this.withTrashed,
              component: this.field.component,
              viaRelationship: this.viaRelationship,
            },
          }
        )
        .then(response => {
          Nova.$progress.done()

          if (this.isSearchable) {
            this.initializingWithExistingResource = false
          }
          this.availableResources = response.data.resources
          this.withTrashed = response.data.withTrashed
          this.softDeletes = response.data.softDeletes
        })
        .catch(e => {
          Nova.$progress.done()
        })
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
     * Attach the selected resource.
     */
    async attachResource() {
      this.isWorking = true
      this.submittedViaAttachResource = true

      try {
        await this.attachRequest()

        this.isWorking = false
        this.submittedViaAttachResource = false

        await this.fetchPolicies(),
          Nova.success(this.__('The resource was attached!'))

        Nova.visit(`/resources/${this.resourceName}/${this.resourceId}`)
      } catch (error) {
        window.scrollTo(0, 0)

        this.isWorking = false
        this.submittedViaAttachResource = false

        this.handleOnCreateResponseError(error)
      }
    },

    /**
     * Attach a new resource and reset the form
     */
    async attachAndAttachAnother() {
      this.isWorking = true
      this.submittedViaAttachAndAttachAnother = true

      try {
        await this.attachRequest()

        window.scrollTo(0, 0)

        this.disableNavigateBackUsingHistory()

        this.isWorking = false
        this.submittedViaAttachAndAttachAnother = false

        await this.fetchPolicies(),
          Nova.success(this.__('The resource was attached!'))

        // Reset the form by refetching the fields
        this.initializeComponent()
      } catch (error) {
        this.isWorking = false
        this.submittedViaAttachAndAttachAnother = false

        this.handleOnCreateResponseError(error)
      }
    },

    cancelAttachingResource() {
      this.handleProceedingToPreviousPage()

      this.proceedToPreviousPage(
        `/resources/${this.resourceName}/${this.resourceId}`
      )
    },

    /**
     * Send an attach request for this resource
     */
    attachRequest() {
      return Nova.request().post(
        this.attachmentEndpoint,
        this.attachmentFormData(),
        {
          params: {
            editing: true,
            editMode: 'attach',
          },
        }
      )
    },

    /**
     * Get the form data for the resource attachment.
     */
    attachmentFormData() {
      return tap(new FormData(), formData => {
        Object.values(this.fields).forEach(field => {
          field.fill(formData)
        })

        if (!this.selectedResourceId) {
          formData.append(this.relatedResourceName, '')
        } else {
          formData.append(
            this.relatedResourceName,
            this.selectedResourceId ?? ''
          )
        }

        formData.append(this.relatedResourceName + '_trashed', this.withTrashed)
        formData.append('viaRelationship', this.viaRelationship)
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

    onUpdateFormStatus() {
      //
    },

    handleSetResource({ id }) {
      this.closeRelationModal()
      this.selectedResourceId = id
      this.initializingWithExistingResource = true
      this.getAvailableResources()
    },

    openRelationModal() {
      Nova.$emit('create-relation-modal-opened')
      this.relationModalOpen = true
    },

    closeRelationModal() {
      this.relationModalOpen = false
      Nova.$emit('create-relation-modal-closed')
    },

    clearResourceSelection() {
      this.clearSelection()

      if (!this.isSearchable) {
        this.initializingWithExistingResource = false
        this.getAvailableResources()
      }
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
        this.submittedViaAttachResource ||
        this.submittedViaAttachAndAttachAnother
      )
    },

    /**
     * Return the heading for the view
     */
    headingTitle() {
      return this.__('Attach :resource', {
        resource: this.relatedResourceLabel,
      })
    },

    shouldShowTrashed() {
      return (
        Boolean(this.softDeletes) &&
        !this.field.readonly &&
        this.field.displaysWithTrashed
      )
    },

    authorizedToCreate() {
      return (
        Nova.config('resources').find(resource => {
          return resource.uriKey == this.field.resourceName
        })?.authorizedToCreate || false
      )
    },

    canShowNewRelationModal() {
      return this.field.showCreateRelationButton && this.authorizedToCreate
    },

    selectedResource() {
      return this.availableResources.find(r =>
        this.isSelectedResourceId(r.value)
      )
    },
  },
}
</script>
