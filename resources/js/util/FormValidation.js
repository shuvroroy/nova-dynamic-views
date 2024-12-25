/**
 * Class extracted from https://github.com/spatie/form-backend-validation
 */

const reservedFieldNames = [
  '__http',
  '__options',
  '__validateRequestType',
  'clear',
  'data',
  'delete',
  'errors',
  'getError',
  'getErrors',
  'hasError',
  'initial',
  'onFail',
  'only',
  'onSuccess',
  'patch',
  'populate',
  'post',
  'processing',
  'successful',
  'put',
  'reset',
  'submit',
  'withData',
  'withErrors',
  'withOptions',
]

/**
 * @param {string} fieldName
 * @throws {Error}
 */
function guardAgainstReservedFieldName(fieldName) {
  if (reservedFieldNames.indexOf(fieldName) !== -1) {
    throw new Error(
      `Field name ${fieldName} isn't allowed to be used in a Form or Errors instance.`
    )
  }
}

/**
 * @param {any} object
 * @returns {boolean}
 */
function isArray(object) {
  return Object.prototype.toString.call(object) === '[object Array]'
}

/**
 * @param {File|FileList|any} object
 * @returns {boolean}
 */
function isFile(object) {
  return object instanceof File || object instanceof FileList
}

function merge(a, b) {
  for (const key in b) {
    a[key] = cloneDeep(b[key])
  }
}

function cloneDeep(object) {
  if (object === null) {
    return null
  }

  if (isFile(object)) {
    return object
  }

  if (Array.isArray(object)) {
    const clone = []

    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        clone[key] = cloneDeep(object[key])
      }
    }

    return clone
  }

  if (typeof object === 'object') {
    const clone = {}

    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        clone[key] = cloneDeep(object[key])
      }
    }

    return clone
  }

  return object
}

/**
 *
 * @param {FormPayloads} object
 * @param {FormData} formData
 * @param {string|null} [parent=null]
 * @returns {FormData|void}
 */
function objectToFormData(object, formData = new FormData(), parent = null) {
  if (object === null || object === 'undefined' || object.length === 0) {
    return formData.append(parent, object)
  }

  for (const property in object) {
    if (object.hasOwnProperty(property)) {
      appendToFormData(formData, getKey(parent, property), object[property])
    }
  }

  return formData
}

/**
 * @param {string|null} parent
 * @param {string} property
 * @returns {string}
 */
function getKey(parent, property) {
  return parent ? parent + '[' + property + ']' : property
}

/**
 * @param {FormData} formData
 * @param {string} key
 * @param {any} value
 * @returns {void}
 */
function appendToFormData(formData, key, value) {
  if (value instanceof Date) {
    return formData.append(key, value.toISOString())
  }

  if (value instanceof File) {
    return formData.append(key, value, value.name)
  }

  if (typeof value === 'boolean') {
    return formData.append(key, value ? '1' : '0')
  }

  if (value === null) {
    return formData.append(key, '')
  }

  if (typeof value !== 'object') {
    return formData.append(key, value)
  }

  objectToFormData(value, formData, key)
}

/**
 * @typedef {import('axios').AxiosInstance} AxiosInstance
 * @typedef {import('axios').AxiosResponse} AxiosResponse
 * @typedef {{[key: string]: any}} FormPayloads
 * @typedef {{http?: AxiosInstance, resetOnSuccess?: boolean, onSuccess?: Function, onFail?: Function}} FormOptions
 */

export class Form {
  /**
   * Create a new Form instance.
   *
   * @param {FormPayloads} data
   * @param {FormOptions} options
   */
  constructor(data = {}, options = {}) {
    this.processing = false
    this.successful = false

    this.withData(data).withOptions(options).withErrors({})
  }

  /**
   * @param {FormPayloads} data
   */
  withData(data) {
    if (isArray(data)) {
      data = data.reduce((carry, element) => {
        carry[element] = ''
        return carry
      }, {})
    }

    this.setInitialValues(data)

    this.errors = new Errors()
    this.processing = false
    this.successful = false

    for (const field in data) {
      guardAgainstReservedFieldName(field)

      this[field] = data[field]
    }

    return this
  }

  /**
   * @param {ErrorCollection} errors
   */
  withErrors(errors) {
    this.errors = new Errors(errors)

    return this
  }

  /**
   * @param {FormOptions} options
   */
  withOptions(options) {
    /** @private */
    this.__options = {
      resetOnSuccess: true,
    }

    if (options.hasOwnProperty('resetOnSuccess')) {
      this.__options.resetOnSuccess = options.resetOnSuccess
    }

    if (options.hasOwnProperty('onSuccess')) {
      this.onSuccess = options.onSuccess
    }

    if (options.hasOwnProperty('onFail')) {
      this.onFail = options.onFail
    }

    const windowAxios = typeof window === 'undefined' ? false : window.axios

    /**
     * @protected
     * @type {AxiosInstance}
     */
    this.__http = options.http || windowAxios || require('axios')

    if (!this.__http) {
      throw new Error(
        'No http library provided. Either pass an http option, or install axios.'
      )
    }

    return this
  }

  /**
   * Fetch all relevant data for the form.
   *
   * @returns {FormPayloads}
   */
  data() {
    const data = {}

    for (const property in this.initial) {
      data[property] = this[property]
    }

    return data
  }

  /**
   * Fetch specific data for the form.
   *
   * @param {string[]} fields
   * @returns {FormPayloads}
   */
  only(fields) {
    return fields.reduce((filtered, field) => {
      filtered[field] = this[field]
      return filtered
    }, {})
  }

  /**
   * Reset the form fields.
   */
  reset() {
    merge(this, this.initial)

    this.errors.clear()
  }

  /**
   * @param {FormPayloads} values
   */
  setInitialValues(values) {
    /** @private */
    this.initial = {}

    merge(this.initial, values)
  }

  /**
   * @param {FormPayloads} data
   */
  populate(data) {
    Object.keys(data).forEach(field => {
      guardAgainstReservedFieldName(field)

      if (this.hasOwnProperty(field)) {
        merge(this, { [field]: data[field] })
      }
    })

    return this
  }

  /**
   * Clear the form fields.
   */
  clear() {
    for (const field in this.initial) {
      this[field] = ''
    }

    this.errors.clear()
  }

  /**
   * Send a POST request to the given URL.
   *
   * @param {string} url
   */
  post(url) {
    return this.submit('post', url)
  }

  /**
   * Send a PUT request to the given URL.
   *
   * @param {string} url
   */
  put(url) {
    return this.submit('put', url)
  }

  /**
   * Send a PATCH request to the given URL.
   *
   * @param {string} url
   */
  patch(url) {
    return this.submit('patch', url)
  }

  /**
   * Send a DELETE request to the given URL.
   *
   * @param {string} url
   */
  delete(url) {
    return this.submit('delete', url)
  }

  /**
   * Submit the form.
   *
   * @param {string} requestType
   * @param {string} url
   */
  submit(requestType, url) {
    this.__validateRequestType(requestType)
    this.errors.clear()
    this.processing = true
    this.successful = false

    return new Promise((resolve, reject) => {
      this.__http[requestType](
        url,
        this.hasFiles() ? objectToFormData(this.data()) : this.data()
      )
        .then(response => {
          this.processing = false
          this.onSuccess(response.data)

          resolve(response.data)
        })
        .catch(error => {
          this.processing = false
          this.onFail(error)

          reject(error)
        })
    })
  }

  /**
   * @returns {boolean}
   */
  hasFiles() {
    for (const property in this.initial) {
      if (this.hasFilesDeep(this[property])) {
        return true
      }
    }

    return false
  }

  /**
   * @param {Object|Array} object
   * @returns {boolean}
   */
  hasFilesDeep(object) {
    if (object === null) {
      return false
    }

    if (typeof object === 'object') {
      for (const key in object) {
        if (object.hasOwnProperty(key)) {
          if (this.hasFilesDeep(object[key])) {
            return true
          }
        }
      }
    }

    if (Array.isArray(object)) {
      for (const key in object) {
        if (object.hasOwnProperty(key)) {
          return this.hasFilesDeep(object[key])
        }
      }
    }

    return isFile(object)
  }

  /**
   * Handle a successful form submission.
   *
   * @param {any} data
   */
  onSuccess(data) {
    this.successful = true

    if (this.__options.resetOnSuccess) {
      this.reset()
    }
  }

  /**
   * Handle a failed form submission.
   *
   * @param {AxiosResponse} error
   */
  onFail(error) {
    this.successful = false

    if (error.response && error.response.data.errors) {
      this.errors.record(error.response.data.errors)
    }
  }

  /**
   * Get the error message(s) for the given field.
   *
   * @param {string} field
   * @returns {boolean}
   */
  hasError(field) {
    return this.errors.has(field)
  }

  /**
   * Get the first error message for the given field.
   *
   * @param {string} field
   * @returns {string|null}
   */
  getError(field) {
    return this.errors.first(field)
  }

  /**
   * Get the error messages for the given field.
   *
   * @param {string} field
   * @returns {string[]}
   */
  getErrors(field) {
    return this.errors.get(field)
  }

  /**
   * @param {string} requestType
   */
  __validateRequestType(requestType) {
    const requestTypes = ['get', 'delete', 'head', 'post', 'put', 'patch']

    if (requestTypes.indexOf(requestType) === -1) {
      throw new Error(
        `\`${requestType}\` is not a valid request type, ` +
          `must be one of: \`${requestTypes.join('`, `')}\`.`
      )
    }
  }

  static create(data = {}) {
    return new Form().withData(data)
  }
}

/**
 * @typedef {{[key: string]: string[]}} ErrorCollection
 */

export class Errors {
  /**
   * Create a new Errors instance.
   *
   * @param {ErrorCollection} [errors={}]
   */
  constructor(errors = {}) {
    this.record(errors)
  }

  /**
   * Get all the errors.
   *
   * @returns {ErrorCollection}
   */
  all() {
    return this.errors
  }

  /**
   * Determine if any errors exists for the given field or object.
   *
   * @param {string} field
   * @returns {boolean}
   */
  has(field) {
    let hasError = this.errors.hasOwnProperty(field)

    if (!hasError) {
      const errors = Object.keys(this.errors).filter(
        e => e.startsWith(`${field}.`) || e.startsWith(`${field}[`)
      )

      hasError = errors.length > 0
    }

    return hasError
  }

  /**
   * Get the first error for the given field or object.
   *
   * @param {string} field
   * @returns {string|null}
   */
  first(field) {
    return this.get(field)[0]
  }

  /**
   * Get the errors for the given field or object.
   *
   * @param {string} field
   * @returns {string[]}
   */
  get(field) {
    return this.errors[field] || []
  }

  /**
   * Determine if we have any errors.
   * Or return errors for the given keys.
   *
   * @param {string[]} [keys=[]]
   * @returns {ErrorCollection}
   */
  any(keys = []) {
    if (keys.length === 0) {
      return Object.keys(this.errors).length > 0
    }

    let errors = {}

    keys.forEach(key => (errors[key] = this.get(key)))

    return errors
  }

  /**
   * Record the new errors.
   *
   * @param {ErrorCollection} [errors={}]
   */
  record(errors = {}) {
    /** @type {ErrorCollection} */
    this.errors = errors
  }

  /**
   * Clear a specific field, object or all error fields.
   *
   * @param {string|null} field
   */
  clear(field) {
    if (!field) {
      this.errors = {}

      return
    }

    let errors = Object.assign({}, this.errors)

    Object.keys(errors)
      .filter(
        e =>
          e === field || e.startsWith(`${field}.`) || e.startsWith(`${field}[`)
      )
      .forEach(e => delete errors[e])

    this.errors = errors
  }
}
