export default {
  props: {
    collapsable: {
      type: Boolean,
      default: true,
    },
  },

  data: () => ({ collapsed: false }),

  created() {
    const value = localStorage.getItem(this.localStorageKey)

    if (value !== 'undefined' && this.collapsable === true) {
      this.collapsed = JSON.parse(value) ?? this.collapsedByDefault
    }
  },

  unmounted() {
    localStorage.setItem(this.localStorageKey, this.collapsed)
  },

  methods: {
    toggleCollapse() {
      this.collapsed = !this.collapsed
      localStorage.setItem(this.localStorageKey, this.collapsed)
    },
  },

  computed: {
    /**
     * @returns {string}
     */
    ariaExpanded() {
      return this.collapsed === false ? 'true' : 'false'
    },

    /**
     * @returns {boolean}
     */
    shouldBeCollapsed() {
      return this.collapsed
    },

    /**
     * @returns {string}
     */
    localStorageKey() {
      return `nova.navigation.${this.item.key}.collapsed`
    },

    /**
     * @returns {boolean}
     */
    collapsedByDefault() {
      return false
    },
  },
}
