export default {
  props: {
    formUniqueId: {
      type: String,
    },
  },

  methods: {
    /**
     * @param {string} attribute
     * @param {any} value
     */
    emitFieldValue(attribute, value) {
      Nova.$emit(`${attribute}-value`, value)

      if (this.hasFormUniqueId === true) {
        Nova.$emit(`${this.formUniqueId}-${attribute}-value`, value)
      }
    },

    /**
     * @param {string} attribute
     * @param {any} value
     */
    emitFieldValueChange(attribute, value) {
      Nova.$emit(`${attribute}-change`, value)

      if (this.hasFormUniqueId === true) {
        Nova.$emit(`${this.formUniqueId}-${attribute}-change`, value)
      }
    },

    /**
     * Get field attribute value event name.
     *
     * @param {string} attribute
     * @returns {string}
     */
    getFieldAttributeValueEventName(attribute) {
      return this.hasFormUniqueId === true
        ? `${this.formUniqueId}-${attribute}-value`
        : `${attribute}-value`
    },

    /**
     * Get field attribue value event name.
     *
     * @param {string} attribute
     * @returns {string}
     */
    getFieldAttributeChangeEventName(attribute) {
      return this.hasFormUniqueId === true
        ? `${this.formUniqueId}-${attribute}-change`
        : `${attribute}-change`
    },
  },

  computed: {
    /**
     * Return the field attribute.
     *
     * @returns {string}
     */
    fieldAttribute() {
      return this.field.attribute
    },

    /**
     * Determine if the field has Form Unique ID.
     *
     * @returns {boolean}
     */
    hasFormUniqueId() {
      return this.formUniqueId != null && this.formUniqueId !== ''
    },

    /**
     * Get field attribue value event name.
     *
     * @returns {string}
     */
    fieldAttributeValueEventName() {
      return this.getFieldAttributeValueEventName(this.fieldAttribute)
    },

    /**
     * Get field attribue value event name.
     *
     * @returns {string}
     */
    fieldAttributeChangeEventName() {
      return this.getFieldAttributeChangeEventName(this.fieldAttribute)
    },
  },
}
