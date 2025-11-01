import { mapProps } from './propTypes'
import filled from '../util/filled'

export default {
  props: mapProps([
    'field',
    'resourceName',
    'resourceId',
    'viaResource',
    'viaResourceId',
    'viaRelationship',
    'relatedResourceName',
    'relatedResourceId',
    'mode',
  ]),

  methods: {
    async fetchPreviewContent(value) {
      Nova.$progress.start()

      let editMode = !filled(this.resourceId) ? 'create' : 'update'
      let endpoint = !filled(this.resourceId)
        ? `/nova-api/${this.resourceName}/field/${this.field.attribute}/preview`
        : `/nova-api/${this.resourceName}/${this.resourceId}/field/${this.field.attribute}/preview`

      if (filled(this.relatedResourceName)) {
        editMode = this.relatedResourceId == null ? 'attach' : 'update-attached'

        endpoint = `${endpoint}/${this.relatedResourceName}`
      }

      const {
        data: { preview },
      } = await Nova.request().post(
        endpoint,
        { value },
        {
          params: {
            editing: true,
            editMode: editMode,
            viaResource: this.viaResource,
            viaResourceId: this.viaResourceId,
            viaRelationship: this.viaRelationship,
          },
        }
      )

      Nova.$progress.done()

      return preview
    },
  },
}
