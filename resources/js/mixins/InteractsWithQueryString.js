import { mapActions, mapGetters } from 'vuex'

export default {
  async created() {
    this.syncQueryString()
  },

  methods: mapActions(['syncQueryString', 'updateQueryString']),
  computed: mapGetters(['queryStringParams']),
}
