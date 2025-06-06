import debounce from 'lodash/debounce'

export default {
  data: () => ({
    search: '',
    selectedResourceId: null,
    availableResources: [],
  }),

  methods: {
    /**
     * Set the currently selected resource.
     *
     * @param {object} resource
     */
    selectResource(resource) {
      this.selectedResourceId = resource?.value ?? null

      if (this.field) {
        if (typeof this['emitFieldValueChange'] == 'function') {
          this.emitFieldValueChange(
            this.fieldAttribute,
            this.selectedResourceId
          )
        } else {
          Nova.$emit(this.fieldAttribute + '-change', this.selectedResourceId)
        }
      }
    },

    /**
     * Handle the search box being cleared.
     */
    handleSearchCleared() {
      this.availableResources = []
    },

    /**
     * Clear the selected resource and availableResources
     */
    clearSelection() {
      this.selectedResourceId = null
      this.availableResources = []

      if (this.field) {
        if (typeof this['emitFieldValueChange'] == 'function') {
          this.emitFieldValueChange(this.fieldAttribute, null)
        } else {
          Nova.$emit(this.fieldAttribute + '-change', null)
        }
      }
    },

    /**
     * Perform a search to get the relatable resources.
     *
     * @param {string} search
     */
    performSearch(search) {
      this.search = search

      const trimmedSearch = search.trim()
      // If the user performs an empty search, it will load all the results
      // so let's just set the availableResources to an empty array to avoid
      // loading a huge result set
      if (trimmedSearch == '') {
        return
      }

      this.searchDebouncer(() => {
        this.getAvailableResources(trimmedSearch)
      }, 500)
    },

    /**
     * Debounce function for the search handler
     */
    searchDebouncer: debounce(callback => callback(), 500),
  },
}
