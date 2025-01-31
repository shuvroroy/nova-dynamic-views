import identity from 'lodash/identity'
import pickBy from 'lodash/pickBy'

export default {
  data: () => ({
    filterHasLoaded: false,
    filterIsActive: false,
    filtersAreApplied: false,
  }),

  watch: {
    encodedFilters(newValue, oldValue) {
      if (
        this.filterHasLoaded == false ||
        newValue === this.initialEncodedFilters ||
        ('' === this.initialEncodedFilters && this.filtersAreApplied === false)
      ) {
        return
      }

      Nova.$emit('filter-changed', [newValue])

      const query = {
        [this.filterParameter]: this.encodedFilters,
      }

      if (newValue !== oldValue) {
        query[this.pageParameter] = 1
      }

      this.pushAfterUpdatingQueryString(query)
    },
  },

  created() {
    this.filterCurrentEncoded = this.encodedFilters
  },

  methods: {
    /**
     * Clear filters and reset the resource table.
     *
     * @param {string|null} lens
     */
    async clearSelectedFilters(lens) {
      if (lens) {
        await this.$store.dispatch(`${this.resourceName}/resetFilterState`, {
          resourceName: this.resourceName,
          lens,
        })
      } else {
        await this.$store.dispatch(`${this.resourceName}/resetFilterState`, {
          resourceName: this.resourceName,
        })
      }

      this.pushAfterUpdatingQueryString({
        [this.pageParameter]: 1,
        [this.filterParameter]: '',
      })

      Nova.$emit('filter-reset')
    },

    /**
     * Handle a filter state change.
     */
    filterChanged() {
      this.filtersAreApplied =
        this.$store.getters[`${this.resourceName}/filtersAreApplied`]

      if (this.filtersAreApplied || this.filterIsActive) {
        this.filterIsActive = true
      }
    },

    /**
     * Set up filters for the current view.
     *
     * @param {string|null} lens
     */
    async initializeFilters(lens) {
      if (this.filterHasLoaded === true) {
        return
      }

      // Clear out the filters from the store first
      this.$store.commit(`${this.resourceName}/clearFilters`)

      await this.$store.dispatch(
        `${this.resourceName}/fetchFilters`,
        pickBy(
          {
            resourceName: this.resourceName,
            viaResource: this.viaResource,
            viaResourceId: this.viaResourceId,
            viaRelationship: this.viaRelationship,
            relationshipType: this.relationshipType,
            lens,
          },
          identity
        )
      )

      await this.initializeState(lens)

      this.filterHasLoaded = true
    },

    /**
     * Initialize the filter state.
     *
     * @param {string|null} lens
     */
    async initializeState(lens) {
      this.initialEncodedFilters
        ? await this.$store.dispatch(
            `${this.resourceName}/initializeCurrentFilterValuesFromQueryString`,
            this.initialEncodedFilters
          )
        : await this.$store.dispatch(`${this.resourceName}/resetFilterState`, {
            resourceName: this.resourceName,
            lens,
          })
    },
  },

  computed: {
    /**
     * Get the name of the filter query string variable.
     *
     * @param {string}
     */
    filterParameter() {
      return `${this.resourceName}_filter`
    },

    /**
     * Return the currently encoded filter string from the store.
     *
     * @param {string}
     */
    encodedFilters() {
      return this.$store.getters[`${this.resourceName}/currentEncodedFilters`]
    },
  },
}
