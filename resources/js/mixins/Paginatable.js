export default {
  methods: {
    /**
     * Select the previous page.
     */
    selectPreviousPage() {
      this.pushAfterUpdatingQueryString({
        [this.pageParameter]: this.currentPage - 1,
      })
    },

    /**
     * Select the next page.
     */
    selectNextPage() {
      this.pushAfterUpdatingQueryString({
        [this.pageParameter]: this.currentPage + 1,
      })
    },
  },

  computed: {
    /**
     * Get the current page from the query string.
     *
     * @returns {number}
     */
    currentPage() {
      return parseInt(this.queryStringParams[this.pageParameter] || 1)
    },
  },
}
