export default {
  computed: {
    /**
     * Get the resource information object for the current resource.
     *
     * @returns {object|null}
     */
    resourceInformation() {
      return (
        Nova.config('resources').find(resource => {
          return resource.uriKey === this.resourceName
        }) || null
      )
    },

    /**
     * Get the resource information object for the current resource.
     *
     * @returns {object|null}
     */
    viaResourceInformation() {
      if (!this.viaResource) {
        return
      }

      return (
        Nova.config('resources').find(resource => {
          return resource.uriKey === this.viaResource
        }) || null
      )
    },

    /**
     * Determine if the user is authorized to create the current resource.
     *
     * @returns {boolean}
     */
    authorizedToCreate() {
      if (
        ['hasOneThrough', 'hasManyThrough'].indexOf(this.relationshipType) >= 0
      ) {
        return false
      }

      return this.resourceInformation?.authorizedToCreate || false
    },
  },
}
