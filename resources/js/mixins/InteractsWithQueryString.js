import { mapActions, mapGetters } from 'vuex'
import isNull from 'lodash/isNull'

export default {
  async created() {
    this.syncQueryString()
  },

  methods: {
    ...mapActions(['syncQueryString', 'updateQueryString']),

    pushAfterUpdatingQueryString(value) {
      return this.updateQueryString(value).then(
        ({ searchParams, nextUrl, page }) => {
          return new Promise((resolve, reject) => {
            if (!isNull(nextUrl)) {
              Nova.debug(`Router.push: "${nextUrl}"`)
              Nova.$router.push({
                component: page.component,
                url: nextUrl,
                // clearHistory: page.clearHistory,
                encryptHistory: page.encryptHistory,
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => resolve({ searchParams, nextUrl, page }),
              })
            } else {
              resolve({ searchParams, nextUrl, page })
            }
          })
        }
      )
    },

    visitAfterUpdatingQueryString(value) {
      return this.updateQueryString(value).then(({ searchParams, nextUrl }) => {
        if (!isNull(nextUrl)) {
          Nova.debug(`Router.visit: "${nextUrl}"`)
          Nova.$router.visit(nextUrl)
        }

        return new Promise((resolve, reject) => {
          resolve({ searchParams, nextUrl, page })
        })
      })
    },
  },
  computed: mapGetters(['queryStringParams']),
}
