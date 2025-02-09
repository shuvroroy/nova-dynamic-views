import __ from '../util/localization'

export function useLocalization() {
  return {
    /**
     * @param {string} key
     * @param {{[key: string]: string}} replace
     * @returns {string}
     */
    __: (key, replace) => __(key, replace),
  }
}
