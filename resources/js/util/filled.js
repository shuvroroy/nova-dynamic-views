/**
 * @param {any} value
 * @returns {boolean}
 */
export default function filled(value) {
  return Boolean(value != null && value !== '')
}
