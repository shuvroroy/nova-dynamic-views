import CreateForm from './components/CreateForm'
import ResourceIndex from './views/Index'
import ResourceDetail from './views/Detail'
import Attach from './views/Attach'
import UpdateAttached from './views/UpdateAttached'
import ResourceUpdate from './views/Update'
import ResourceLens from './views/Lens'

const pages = Nova.pages

Nova.booting((app) => {
  app.component('CreateForm', CreateForm)
  app.component('ResourceIndex', ResourceIndex)
  app.component('ResourceDetail', ResourceDetail)
  app.component('AttachResource', Attach)
  app.component('UpdateAttachedResource', UpdateAttached)

  pages['Nova.Update'] = ResourceUpdate
  pages['Nova.Lens'] = ResourceLens

  const components = [
    'attach-header',
    'create-header',
    'detail-header',
    'detail-toolbar',
    'index-header',
    'index-toolbar',
    'update-attach-header',
    'update-header',
    'lens-header',
    'lens-toolbar',
  ];

  components.forEach((component) => {
    app.component('custom-' + component, {
      props: [
        'resourceName',
        'resourceId',
        'relatedResourceName',
        'relatedResourceId',
        'viaResource',
        'viaResourceId',
        'viaRelationship',
      ],

      template: '<div :class="componentClass"><span v-for="(comp, index) in customComponents" :key="index">' +
        '<component :is="comp.name" v-bind="comp.meta"></component>' +
        '</span></div>',

      data() {
        return {
          customComponents: [],
          componentClass: '',
          componentName: component
        }
      },

      mounted() {
        let url = '/nova-vendor/nova-dynamic-views/' + this.resourceName + '/' + this.componentName

        let queryParams = {}

        if (this.viaRelationship) {
          queryParams.viaRelationship = this.viaRelationship
        }

        if (this.viaResource) {
          queryParams.viaResource = this.viaResource
        }

        if (this.viaResourceId) {
          queryParams.viaResourceId = this.viaResourceId
        }

        if (this.resourceId) {
          queryParams.id = this.resourceId
        }

        let queryString = new URLSearchParams(queryParams).toString();

        if (queryString) {
          url += '?' + queryString;
        }

        Nova.request().get(url)
          .then(res => {
            let items = res.data.items || []
            if (items) {
              for (let i in items) {
                for (let j in this.$props) {
                  if (!items[i].meta) items[i].meta = {}
                  items[i].meta[j] = this[j]
                }
              }
            }

            this.customComponents = items
            this.componentClass = res.data.class
          })
      }
    })
  })
})
