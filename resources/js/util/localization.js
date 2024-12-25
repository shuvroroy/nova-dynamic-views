/**
 * @param {string} key
 * @param {string} replace
 * @returns {string}
 */
export default function __(key, replace) {
  /** @type {string} */
  let translation = Nova.config('translations')[key]
    ? Nova.config('translations')[key]
    : key

  Object.entries(replace ?? {}).forEach(([key, value]) => {
    key = new String(key)

    if (value === null) {
      console.error(
        `Translation '${translation}' for key '${key}' contains a null replacement.`
      )

      return
    }

    value = new String(value)

    const searches = [
      ':' + key,
      ':' + key.toUpperCase(),
      ':' + key.charAt(0).toUpperCase() + key.slice(1),
    ]

    const replacements = [
      value,
      value.toUpperCase(),
      value.charAt(0).toUpperCase() + value.slice(1),
    ]

    for (let i = searches.length - 1; i >= 0; i--) {
      translation = translation.replace(searches[i], replacements[i])
    }
  })

  return translation
}
