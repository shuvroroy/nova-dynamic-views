import omitBy from 'lodash/omitBy'

export default {
  computed: {
    /**
     * @returns {string}
     */
    suggestionsId() {
      return `${this.fieldAttribute}-list`
    },

    /**
     * @returns {string[]}
     */
    suggestions() {
      let field = this.syncedField != null ? this.syncedField : this.field

      if (field.suggestions == null) {
        return []
      }

      return field.suggestions
    },

    /**
     * @returns {{[key: string]: any}}
     */
    suggestionsAttributes() {
      return {
        ...omitBy(
          {
            list: this.suggestions.length > 0 ? this.suggestionsId : null,
          },
          value => value == null
        ),
      }
    },
  },
}
