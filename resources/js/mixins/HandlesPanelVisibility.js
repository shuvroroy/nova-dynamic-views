export default {
  emits: ['field-shown', 'field-hidden'],

  data: () => ({
    visibleFieldsForPanel: {},
  }),

  created() {
    this.panel.fields.forEach(field => {
      this.visibleFieldsForPanel[field.attribute] = field.visible
    })
  },

  methods: {
    /**
     * @param {string} field
     */
    handleFieldShown(field) {
      this.visibleFieldsForPanel[field] = true
      this.$emit('field-shown', field)
    },

    /**
     * @param {string} field
     */
    handleFieldHidden(field) {
      this.visibleFieldsForPanel[field] = false
      this.$emit('field-hidden', field)
    },
  },

  computed: {
    /**
     * @returns {number}
     */
    visibleFieldsCount() {
      return Object.values(this.visibleFieldsForPanel).filter(
        visible => visible === true
      ).length
    },
  },
}
