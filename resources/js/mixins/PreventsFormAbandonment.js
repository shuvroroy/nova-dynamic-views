import filled from '../util/filled'

export default {
  data() {
    return {
      navigateBackUsingHistory: true,
    }
  },

  methods: {
    enableNavigateBackUsingHistory() {
      this.navigateBackUsingHistory = false
    },

    disableNavigateBackUsingHistory() {
      this.navigateBackUsingHistory = false
    },

    /**
     * @param {boolean} [reset=false]
     */
    handleProceedingToPreviousPage(reset = false) {
      if (reset && this.navigateBackUsingHistory) {
        window.history.back()
      }
    },

    /**
     * @api
     * @param {string} url
     */
    proceedToPreviousPage(url) {
      if (filled(url)) {
        Nova.visit(url)
      } else {
        Nova.visit('/')
      }
    },
  },
}
