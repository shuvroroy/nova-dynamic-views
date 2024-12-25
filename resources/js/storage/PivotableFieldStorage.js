import filled from '@/util/filled'

export default {
  fetchAvailableResources(resourceName, resourceId, fieldAttribute, options) {
    const endpoint = filled(resourceId)
      ? `/nova-api/${resourceName}/${resourceId}/attachable/${fieldAttribute}`
      : `/nova-api/${resourceName}/attachable/${fieldAttribute}`

    return Nova.request().get(endpoint, options)
  },

  determineIfSoftDeletes(resourceName) {
    return Nova.request().get(`/nova-api/${resourceName}/soft-deletes`)
  },
}
