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

  pages['Nova.Update'].components.ResourceUpdate = ResourceUpdate
  pages['Nova.Lens'].components.ResourceLens = ResourceLens

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
  ];

  components.forEach((component) => {
    app.component('custom-' + component, {
      props: ['resourceName'],

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
        let url = '/nova-vendor/nova-dynamic-views/' + this.resourceName + '/' + this.componentName;

        let queryParams = {};

        if (Nova.$router.page.props && Nova.$router.page.props.viaRelationship) {
          queryParams.viaRelationship = Nova.$router.page.props.viaRelationship;
        }
        if (Nova.$router.page.props && Nova.$router.page.props.viaResource) {
          queryParams.viaResource = Nova.$router.page.props.viaResource;
        }
        if (Nova.$router.page.props && Nova.$router.page.props.viaResourceId) {
          queryParams.viaResourceId = Nova.$router.page.props.viaResourceId;
        }
        if (Nova.$router.page.props && Nova.$router.page.props.resourceId) {
          queryParams.id = Nova.$router.page.props.resourceId;
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
