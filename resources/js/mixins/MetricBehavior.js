import minimum from '../util/minimum'

export default {
  props: {
    card: {
      type: Object,
      required: true,
    },

    dashboard: {
      type: String,
      required: false,
    },

    resourceName: {
      type: String,
      default: '',
    },

    resourceId: {
      type: [Number, String],
      default: '',
    },

    lens: {
      type: String,
      default: '',
    },
  },

  created() {
    Nova.$on('metric-refresh', this.fetch)

    Nova.$on('resources-deleted', this.fetch)
    Nova.$on('resources-detached', this.fetch)
    Nova.$on('resources-restored', this.fetch)

    if (this.card.refreshWhenActionRuns) {
      Nova.$on('action-executed', this.fetch)
    }
  },

  beforeUnmount() {
    Nova.$off('metric-refresh', this.fetch)
    Nova.$off('resources-deleted', this.fetch)
    Nova.$off('resources-detached', this.fetch)
    Nova.$off('resources-restored', this.fetch)
    Nova.$off('action-executed', this.fetch)
  },

  methods: {
    fetch() {
      this.loading = true

      minimum(Nova.request().get(this.metricEndpoint, this.metricPayload)).then(
        this.handleFetchCallback()
      )
    },

    /**
     * @returns [Function]
     */
    handleFetchCallback() {
      return () => {
        return
      }
    },
  },

  computed: {
    /**
     * @returns {string}
     */
    metricEndpoint() {
      const lens = this.lens !== '' ? `/lens/${this.lens}` : ''
      if (this.resourceName && this.resourceId) {
        return `/nova-api/${this.resourceName}${lens}/${this.resourceId}/metrics/${this.card.uriKey}`
      } else if (this.resourceName) {
        return `/nova-api/${this.resourceName}${lens}/metrics/${this.card.uriKey}`
      }

      return `/nova-api/dashboards/cards/${this.dashboard}/metrics/${this.card.uriKey}`
    },

    /**
     * @returns {{[key: string]: any}}
     */
    metricPayload() {
      return {}
    },
  },
}
