import { Errors } from '@/mixins'
import { computed, nextTick, reactive } from 'vue'
import filter from 'lodash/filter'
import isObject from 'lodash/isObject'
import range from 'lodash/range'
import tap from 'lodash/tap'
import trim from 'lodash/trim'
import { useLocalization } from '@/composables/useLocalization'

const { __ } = useLocalization()

export function useActions(props, emitter, store) {
  const state = reactive({
    working: false,
    errors: new Errors(),
    actionModalVisible: false,
    responseModalVisible: false,
    selectedActionKey: '',
    endpoint: props.endpoint || `/nova-api/${props.resourceName}/action`,
    actionModalReponseData: null,
  })

  const selectedResources = computed(() => props.selectedResources)

  const selectedAction = computed(() => {
    if (state.selectedActionKey) {
      return allActions.value.find(a => a.uriKey === state.selectedActionKey)
    }
  })

  const allActions = computed(() =>
    props.actions.concat(props.pivotActions?.actions || [])
  )

  const encodedFilters = computed(
    () => store.getters[`${props.resourceName}/currentEncodedFilters`]
  )

  const searchParameter = computed(() =>
    props.viaRelationship
      ? props.viaRelationship + '_search'
      : props.resourceName + '_search'
  )

  const currentSearch = computed(
    () => store.getters.queryStringParams[searchParameter.value] || ''
  )

  const trashedParameter = computed(() =>
    props.viaRelationship
      ? props.viaRelationship + '_trashed'
      : props.resourceName + '_trashed'
  )

  const currentTrashed = computed(
    () => store.getters.queryStringParams[trashedParameter.value] || ''
  )

  const availableActions = computed(() => {
    return props.actions.filter(
      action => selectedResources.value.length > 0 && !action.standalone
    )
  })

  const availablePivotActions = computed(() => {
    if (!props.pivotActions) {
      return []
    }

    return props.pivotActions.actions.filter(action => {
      if (selectedResources.value.length === 0) {
        return action.standalone
      }

      return true
    })
  })

  const hasPivotActions = computed(() => availablePivotActions.value.length > 0)

  const selectedActionIsPivotAction = computed(() => {
    return (
      hasPivotActions.value &&
      Boolean(props.pivotActions.actions.find(a => a === selectedAction.value))
    )
  })

  const actionRequestQueryString = computed(() => {
    return {
      action: state.selectedActionKey,
      pivotAction: selectedActionIsPivotAction.value,
      search: currentSearch.value,
      filters: encodedFilters.value,
      trashed: currentTrashed.value,
      viaResource: props.viaResource,
      viaResourceId: props.viaResourceId,
      viaRelationship: props.viaRelationship,
    }
  })

  const actionFormData = computed(() => {
    return tap(new FormData(), formData => {
      if (selectedResources.value === 'all') {
        formData.append('resources', 'all')
      } else {
        let pivotIds = filter(
          selectedResources.value.map(resource =>
            isObject(resource) ? resource.id.pivotValue : null
          )
        )

        selectedResources.value.forEach(resource =>
          formData.append(
            'resources[]',
            isObject(resource) ? resource.id.value : resource
          )
        )

        if (
          selectedResources.value !== 'all' &&
          selectedActionIsPivotAction.value === true &&
          pivotIds.length > 0
        ) {
          pivotIds.forEach(pivotId => formData.append('pivots[]', pivotId))
        }
      }

      selectedAction.value.fields.forEach(field => {
        field.fill(formData)
      })
    })
  })

  function determineActionStrategy() {
    if (selectedAction.value.withoutConfirmation) {
      executeAction()
    } else {
      openConfirmationModal()
    }
  }

  function openConfirmationModal() {
    state.errors = new Errors()
    state.actionModalVisible = true
  }

  function closeConfirmationModal() {
    state.actionModalVisible = false
  }

  function openResponseModal() {
    state.responseModalVisible = true
  }

  function closeResponseModal() {
    state.responseModalVisible = false
  }

  function emitResponseCallback(callback) {
    emitter('actionExecuted')
    Nova.$emit('action-executed')

    if (typeof callback === 'function') {
      callback()
    }
  }

  function showActionResponseMessage(data) {
    if (data.danger) {
      return Nova.error(data.danger)
    }

    Nova.success(data.message || __('The action was executed successfully.'))
  }

  function executeAction(then) {
    state.working = true
    Nova.$progress.start()

    let responseType = selectedAction.value.responseType ?? 'json'

    Nova.request({
      method: 'post',
      url: state.endpoint,
      params: actionRequestQueryString.value,
      data: actionFormData.value,
      responseType,
    })
      .then(async response => {
        closeConfirmationModal()
        handleActionResponse(response.data, response.headers, then)
      })
      .catch(error => {
        if (error.response && range(400, 500).includes(error.response.status)) {
          if (responseType === 'blob') {
            error.response.data.text().then(data => {
              state.errors = new Errors(JSON.parse(data).errors)
            })
          } else {
            state.errors = new Errors(error.response.data.errors)
          }

          Nova.error(__('There was a problem executing the action.'))
        }
      })
      .finally(() => {
        state.working = false
        Nova.$progress.done()
      })
  }

  function handleActionResponse(data, headers, then) {
    let contentDisposition = headers['content-disposition']

    if (
      data instanceof Blob &&
      contentDisposition == null &&
      data.type === 'application/json'
    ) {
      data.text().then(jsonStringData => {
        handleActionResponse(JSON.parse(jsonStringData), headers)
      })

      return
    }

    if (data instanceof Blob) {
      return emitResponseCallback(async () => {
        let fileName = 'unknown'

        if (contentDisposition) {
          let fileNameMatch = contentDisposition
            .split(';')[1]
            .match(/filename=(.+)/)
          if (fileNameMatch.length === 2) fileName = trim(fileNameMatch[1], '"')
        }

        await nextTick(() => {
          let url = window.URL.createObjectURL(new Blob([data]))
          let link = document.createElement('a')

          link.href = url
          link.setAttribute('download', fileName)
          document.body.appendChild(link)
          link.click()
          link.remove()

          window.URL.revokeObjectURL(url)
        })
      })
    }

    if (data.event) {
      Nova.$emit(data.event.key, data.event.payload)
    }

    if (data.modal) {
      state.actionModalReponseData = data.modal

      showActionResponseMessage(data)

      return openResponseModal()
    }

    if (data.download) {
      return emitResponseCallback(async () => {
        showActionResponseMessage(data)

        await nextTick(() => {
          let link = document.createElement('a')
          link.href = data.download.url
          link.download = data.download.name
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        })
      })
    }

    if (data.deleted) {
      return emitResponseCallback(() => showActionResponseMessage(data))
    }

    if (data.redirect) {
      if (data.redirect.openInNewTab) {
        return emitResponseCallback(() =>
          window.open(data.redirect.url, '_blank')
        )
      } else {
        window.location = data.redirect.url
      }
    }

    if (data.visit) {
      showActionResponseMessage(data)

      return Nova.visit({
        url: Nova.url(data.visit.path, data.visit.options),
        remote: false,
      })
    }

    emitResponseCallback(() => showActionResponseMessage(data))
  }

  function handleActionClick(uriKey) {
    state.selectedActionKey = uriKey
    determineActionStrategy()
  }

  function setSelectedActionKey(key) {
    state.selectedActionKey = key
  }

  return {
    errors: computed(() => state.errors),
    working: computed(() => state.working),
    actionModalVisible: computed(() => state.actionModalVisible),
    responseModalVisible: computed(() => state.responseModalVisible),
    selectedActionKey: computed(() => state.selectedActionKey),
    determineActionStrategy,
    setSelectedActionKey,
    openConfirmationModal,
    closeConfirmationModal,
    openResponseModal,
    closeResponseModal,
    handleActionClick,
    selectedAction,
    allActions,
    availableActions,
    availablePivotActions,
    executeAction,
    actionModalReponseData: computed(() => state.actionModalReponseData),
  }
}
