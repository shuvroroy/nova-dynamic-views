import get from 'lodash/get'
import { mapProps } from './propTypes'
import FormEvents from './FormEvents'

export default {
  extends: FormEvents,

  props: {
    ...mapProps([
      'nested',
      'shownViaNewRelationModal',
      'field',
      'viaResource',
      'viaResourceId',
      'viaRelationship',
      'resourceName',
      'resourceId',
      'showHelpText',
      'mode',
    ]),
  },

  emits: ['field-changed'],

  data() {
    return {
      value: this.fieldDefaultValue(),
    }
  },

  created() {
    this.setInitialValue()
  },

  mounted() {
    // Add a default fill method for the field
    this.field.fill = this.fill

    // Register a global event for setting the field's value
    Nova.$on(this.fieldAttributeValueEventName, this.listenToValueChanges)
  },

  beforeUnmount() {
    Nova.$off(this.fieldAttributeValueEventName, this.listenToValueChanges)
  },

  methods: {
    /*
     * Set the initial value for the field
     */
    setInitialValue() {
      this.value = !(
        this.field.value === undefined || this.field.value === null
      )
        ? this.field.value
        : this.fieldDefaultValue()
    },

    /**
     * Return the field default value.
     *
     * @returns {string}
     */
    fieldDefaultValue() {
      return ''
    },

    /**
     * Provide a function that fills a passed FormData object with the
     * field's internal value attribute.
     *
     * @param {FormData} formData
     */
    fill(formData) {
      this.fillIfVisible(formData, this.fieldAttribute, String(this.value))
    },

    /**
     * Provide a function to fills FormData when field is visible.
     *
     * @param {FormData} formData
     * @param {string} attribute
     * @param {any} value
     */
    fillIfVisible(formData, attribute, value) {
      if (this.isVisible) {
        formData.append(attribute, value)
      }
    },

    /**
     * Update the field's internal value..
     *
     * @param {Event} event
     */
    handleChange(event) {
      this.value = event.target.value

      if (this.field) {
        this.emitFieldValueChange(this.fieldAttribute, this.value)
        this.$emit('field-changed')
      }
    },

    /**
     * Clean up any side-effects when removing this field dynamically (Repeater).
     */
    beforeRemove() {
      //
    },

    /**
     * @param {any} value
     */
    listenToValueChanges(value) {
      this.value = value
    },
  },

  computed: {
    /**
     * Determine the current field.
     *
     * @returns {object}
     */
    currentField() {
      return this.field
    },

    /**
     * Determine if the field should use all the available white-space.
     *
     * @returns {boolean}
     */
    fullWidthContent() {
      return this.currentField.fullWidth || this.field.fullWidth
    },

    /**
     * Return the placeholder text for the field.
     *
     * @returns {string}
     */
    placeholder() {
      return this.currentField.placeholder || this.field.name
    },

    /**
     * Determine if the field is in visible mode
     *
     * @returns {boolean}
     */
    isVisible() {
      return this.field.visible
    },

    /**
     * Determine if the field is in readonly mode.
     *
     * @returns {boolean}
     */
    isReadonly() {
      return Boolean(
        this.field.readonly || get(this.field, 'extraAttributes.readonly')
      )
    },

    /**
     * Determine if the field is accessed from Action.
     *
     * @returns {boolean}
     */
    isActionRequest() {
      return ['action-fullscreen', 'action-modal'].includes(this.mode)
    },
  },
}
