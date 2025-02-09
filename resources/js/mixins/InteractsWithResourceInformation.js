import { useResourceInformation } from '../composables/useResourceInformation'

const { resourceInformation, viaResourceInformation, authorizedToCreate } =
  useResourceInformation()

export default {
  computed: {
    /**
     * Get the resource information object for the current resource.
     *
     * @returns {object|null}
     */
    resourceInformation() {
      return resourceInformation(this.resourceName)
    },

    /**
     * Get the resource information object for the current resource.
     *
     * @returns {object|null}
     */
    viaResourceInformation() {
      return viaResourceInformation(this.viaResource)
    },

    /**
     * Determine if the user is authorized to create the current resource.
     *
     * @returns {boolean}
     */
    authorizedToCreate() {
      return authorizedToCreate(this.resourceName, this.relationshipType)
    },
  },
}
