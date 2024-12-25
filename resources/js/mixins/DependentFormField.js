import { CancelToken, isCancel } from 'axios'
import debounce from 'lodash/debounce'
import forIn from 'lodash/forIn'
import get from 'lodash/get'
import identity from 'lodash/identity'
import isEmpty from 'lodash/isEmpty'
import pickBy from 'lodash/pickBy'
import FormField from './FormField'
import { mapProps } from './propTypes'
import filled from '../util/filled'
import { escapeUnicode } from '../util/escapeUnicode'

export default {
  extends: FormField,

  emits: ['field-shown', 'field-hidden'],

  props: {
    ...mapProps([
      'shownViaNewRelationModal',
      'field',
      'viaResource',
      'viaResourceId',
      'viaRelationship',
      'resourceName',
      'resourceId',
      'relatedResourceName',
      'relatedResourceId',
    ]),

    syncEndpoint: { type: String, required: false },
  },

  data: () => ({
    dependentFieldDebouncer: null,
    canceller: null,
    watchedFields: {},
    watchedEvents: {},
    syncedField: null,
    pivot: false,
    editMode: 'create',
  }),

  created() {
    this.dependentFieldDebouncer = debounce(callback => callback(), 50)
  },

  mounted() {
    if (filled(this.relatedResourceName)) {
      this.pivot = true

      if (filled(this.relatedResourceId)) {
        this.editMode = 'update-attached'
      } else {
        this.editMode = 'attach'
      }
    } else {
      if (filled(this.resourceId)) {
        this.editMode = 'update'
      }
    }

    if (!isEmpty(this.dependsOn)) {
      forIn(this.dependsOn, (defaultValue, dependsOn) => {
        this.watchedEvents[dependsOn] = value => {
          this.watchedFields[dependsOn] = value

          this.dependentFieldDebouncer(() => {
            this.watchedFields[dependsOn] = value

            this.syncField()
          })
        }

        this.watchedFields[dependsOn] = defaultValue

        Nova.$on(
          this.getFieldAttributeChangeEventName(dependsOn),
          this.watchedEvents[dependsOn]
        )
      })
    }
  },

  beforeUnmount() {
    if (this.canceller !== null) this.canceller()

    if (!isEmpty(this.watchedEvents)) {
      forIn(this.watchedEvents, (event, dependsOn) => {
        Nova.$off(this.getFieldAttributeChangeEventName(dependsOn), event)
      })
    }
  },

  methods: {
    /*
     * Set the initial value for the field
     */
    setInitialValue() {
      this.value = !(
        this.currentField.value === undefined ||
        this.currentField.value === null
      )
        ? this.currentField.value
        : this.value
    },

    /**
     * Provide a function to fills FormData when field is visible.
     *
     * @param {FormData} formData
     * @param {string} attribute
     * @param {any} value
     */
    fillIfVisible(formData, attribute, value) {
      if (this.currentlyIsVisible) {
        formData.append(attribute, value)
      }
    },

    syncField() {
      if (this.canceller !== null) this.canceller()

      Nova.request()
        .patch(
          this.syncEndpoint || this.syncFieldEndpoint,
          this.dependentFieldValues,
          {
            params: pickBy(
              {
                editing: true,
                editMode: this.editMode,
                viaResource: this.viaResource,
                viaResourceId: this.viaResourceId,
                viaRelationship: this.viaRelationship,
                field: this.fieldAttribute,
                inline: this.shownViaNewRelationModal,
                component: this.field.dependentComponentKey,
              },
              identity
            ),
            cancelToken: new CancelToken(canceller => {
              this.canceller = canceller
            }),
          }
        )
        .then(response => {
          let snapshot = JSON.parse(JSON.stringify(this.currentField))
          let wasVisible = this.currentlyIsVisible

          this.syncedField = response.data

          if (this.syncedField.visible !== wasVisible) {
            this.$emit(
              this.syncedField.visible === true
                ? 'field-shown'
                : 'field-hidden',
              this.fieldAttribute
            )
          }

          if (this.syncedField.value == null) {
            this.syncedField.value = snapshot.value
            this.revertSyncedFieldToPreviousValue(snapshot)
          } else {
            this.setInitialValue()
          }

          let emitChangesEvent = !this.syncedFieldValueHasNotChanged()

          this.onSyncedField()

          if (
            this.syncedField.dependentShouldEmitChangesEvent &&
            emitChangesEvent
          ) {
            this.emitOnSyncedFieldValueChange()
          }
        })
        .catch(e => {
          if (isCancel(e)) {
            return
          }

          throw e
        })
    },

    revertSyncedFieldToPreviousValue(field) {
      //
    },

    onSyncedField() {
      //
    },

    emitOnSyncedFieldValueChange() {
      this.emitFieldValueChange(this.field.attribute, this.currentField.value)
    },

    /**
     * @returns {boolean}
     */
    syncedFieldValueHasNotChanged() {
      const value = this.currentField.value

      if (filled(value)) {
        return !filled(this.value)
      }

      return value != null && value?.toString() === this.value?.toString()
    },
  },

  computed: {
    /**
     * Determine the current field
     *
     * @returns {object}
     */
    currentField() {
      return this.syncedField || this.field
    },

    /**
     * Determine if the field is in visible mode.
     *
     * @returns {boolean}
     */
    currentlyIsVisible() {
      return this.currentField.visible
    },

    /**
     * Determine if the field is in readonly mode.
     *
     * @returns {boolean}
     */
    currentlyIsReadonly() {
      if (this.syncedField !== null) {
        return Boolean(
          this.syncedField.readonly ||
            get(this.syncedField, 'extraAttributes.readonly')
        )
      }

      return Boolean(
        this.field.readonly || get(this.field, 'extraAttributes.readonly')
      )
    },

    /**
     * @returns {string[]}
     */
    dependsOn() {
      return this.field.dependsOn || []
    },

    /**
     * @returns {{[key: string]: any}}
     */
    currentFieldValues() {
      return {
        [this.fieldAttribute]: this.value,
      }
    },

    /**
     * @returns {{[key: string]: any}}
     */
    dependentFieldValues() {
      return {
        ...this.currentFieldValues,
        ...this.watchedFields,
      }
    },

    /**
     * @returns {string}
     */
    encodedDependentFieldValues() {
      return btoa(escapeUnicode(JSON.stringify(this.dependentFieldValues)))
    },

    /**
     * Get the correct field sync endpoint URL.
     *
     * @returns {string}
     */
    syncFieldEndpoint() {
      if (this.editMode === 'update-attached') {
        return `/nova-api/${this.resourceName}/${this.resourceId}/update-pivot-fields/${this.relatedResourceName}/${this.relatedResourceId}`
      } else if (this.editMode === 'attach') {
        return `/nova-api/${this.resourceName}/${this.resourceId}/creation-pivot-fields/${this.relatedResourceName}`
      } else if (this.editMode === 'update') {
        return `/nova-api/${this.resourceName}/${this.resourceId}/update-fields`
      }

      return `/nova-api/${this.resourceName}/creation-fields`
    },
  },
}
