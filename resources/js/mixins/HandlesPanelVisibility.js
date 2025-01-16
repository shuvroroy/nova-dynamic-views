import { usePanelVisibility } from '../composables/usePanelVisibility'

export default {
  emits: ['field-shown', 'field-hidden'],

  data: () => ({
    visibleFieldsForPanel: null,
  }),

  created() {
    this.visibleFieldsForPanel = usePanelVisibility(this.panel, this.$emit)
  },

  methods: {
    /**
     * @param {string} field
     */
    handleFieldShown(field) {
      this.visibleFieldsForPanel.handleFieldShown(field)
    },

    /**
     * @param {string} field
     */
    handleFieldHidden(field) {
      this.visibleFieldsForPanel.handleFieldHidden(field)
    },
  },

  computed: {
    /**
     * @returns {number}
     */
    visibleFieldsCount() {
      return this.visibleFieldsForPanel.visibleFieldsCount
    },
  },
}
