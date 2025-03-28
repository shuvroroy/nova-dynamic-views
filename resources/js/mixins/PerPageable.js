export default {
  data: () => ({ perPage: 25 }),

  methods: {
    /**
     * Sync the per page values from the query string.
     */
    initializePerPageFromQueryString() {
      this.perPage = this.currentPerPage
    },

    /**
     * Update the desired amount of resources per page.
     */
    perPageChanged() {
      this.pushAfterUpdatingQueryString({
        [this.perPageParameter]: this.perPage,
      })
    },
  },

  computed: {
    /**
     * Get the current per page value from the query string.
     *
     * @returns {number}
     */
    currentPerPage() {
      return this.queryStringParams[this.perPageParameter] || 25
    },
  },
}
