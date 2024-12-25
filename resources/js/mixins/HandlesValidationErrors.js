import { Errors } from '../util/FormValidation'

export default {
  props: {
    errors: { default: () => new Errors() },
  },

  inject: { index: { default: null }, viaParent: { default: null } },

  data: () => ({
    errorClass: 'form-control-bordered-error',
  }),

  computed: {
    /**
     * @returns {string[]}
     */
    errorClasses() {
      return this.hasError ? [this.errorClass] : []
    },

    /**
     * @returns {string}
     */
    fieldAttribute() {
      return this.field.attribute
    },

    /**
     * @returns {string}
     */
    validationKey() {
      return this.nestedValidationKey || this.field.validationKey
    },

    /**
     * @returns {boolean}
     */
    hasError() {
      return this.errors.has(this.validationKey)
    },

    /**
     * @returns {string}
     */
    firstError() {
      if (this.hasError) {
        return this.errors.first(this.validationKey)
      }
    },

    /**
     * @returns {string|null}
     */
    nestedAttribute() {
      if (this.viaParent) {
        return `${this.viaParent}[${this.index}][${this.field.attribute}]`
      }
    },

    /**
     * @returns {string|null}
     */
    nestedValidationKey() {
      if (this.viaParent) {
        return `${this.viaParent}.${this.index}.fields.${this.field.attribute}`
      }
    },
  },
}
