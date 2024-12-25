import lowerCase from 'lodash/lowerCase'
import slug from 'slugify'

/**
 * @param {string} value
 * @param {string} [separator=-]
 * @returns {string}
 */
const slugify = (value, separator = '-') => {
  return slug(lowerCase(value), separator)
}

export default slugify
