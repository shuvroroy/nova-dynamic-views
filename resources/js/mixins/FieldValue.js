import filled from '../util/filled'
import isArray from 'lodash/isArray'

export default {
  props: ['field'],

  methods: {
    isEqualsToValue(value) {
      if (isArray(this.field.value) && filled(value)) {
        return Boolean(
          this.field.value.includes(value) ||
            this.field.value.includes(value.toString())
        )
      }

      return Boolean(
        this.field.value === value ||
          this.field.value?.toString() === value ||
          this.field.value === value?.toString() ||
          this.field.value?.toString() === value?.toString()
      )
    },
  },

  computed: {
    fieldAttribute() {
      return this.field.attribute
    },

    fieldHasValue() {
      return filled(this.field.value)
    },

    usesCustomizedDisplay() {
      return this.field.usesCustomizedDisplay && filled(this.field.displayedAs)
    },

    fieldHasValueOrCustomizedDisplay() {
      return this.usesCustomizedDisplay || this.fieldHasValue
    },

    fieldValue() {
      if (!this.fieldHasValueOrCustomizedDisplay) {
        return null
      }

      return String(this.field.displayedAs ?? this.field.value)
    },

    shouldDisplayAsHtml() {
      return this.field.asHtml
    },
  },
}
