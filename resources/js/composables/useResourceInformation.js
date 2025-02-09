export function useResourceInformation() {
  const resourceInformation = resourceName => {
    return (
      Nova.config('resources').find(resource => {
        return resource.uriKey === resourceName
      }) || null
    )
  }

  const viaResourceInformation = viaRelation => {
    return (
      Nova.config('resources').find(resource => {
        return resource.uriKey === viaRelation
      }) || null
    )
  }

  const authorizedToCreate = (resourceName, relationshipType = null) => {
    if (['hasOneThrough', 'hasManyThrough'].indexOf(relationshipType) >= 0) {
      return false
    }

    return resourceInformation(resourceName).authorizedToCreate || false
  }

  return {
    resourceInformation,
    viaResourceInformation,
    authorizedToCreate,
  }
}
