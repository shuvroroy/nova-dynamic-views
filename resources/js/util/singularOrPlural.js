import inflector from 'inflector-js'
import isString from 'lodash/isString'

/**
 *
 * @param {number} value
 * @param {any} suffix
 * @returns {string}
 */
export default function singularOrPlural(value, suffix) {
  if (isString(suffix) && suffix.match(/^(.*)[A-Za-zÀ-ÖØ-öø-ÿ]$/) == null)
    return suffix
  if (value > 1 || value == 0) return inflector.pluralize(suffix)
  return inflector.singularize(suffix)
}
