import { reactive, ref, watch } from 'vue'

export function usePanelVisibility(
  panel = { attribute: 'default', fields: [] },
  emitter = null
) {
  const visibleFieldsForPanel = {}
  const visibleFieldsCount = ref(0)

  panel.fields.forEach(field => {
    visibleFieldsForPanel[field.attribute] = field.visible
  })

  const handleFieldShown = field => {
    visibleFieldsForPanel[field] = true

    if (emitter !== null) {
      emitter('field-shown', field)
    }

    syncVisibleFieldsCount(visibleFieldsForPanel)
  }

  const handleFieldHidden = field => {
    visibleFieldsForPanel[field] = false

    if (emitter !== null) {
      emitter('field-shown', field)
    }

    syncVisibleFieldsCount(visibleFieldsForPanel)
  }

  const syncVisibleFieldsCount = fields => {
    visibleFieldsCount.value = Object.values(fields).filter(
      visible => visible === true
    ).length
  }

  syncVisibleFieldsCount(visibleFieldsForPanel)

  return {
    handleFieldShown,
    handleFieldHidden,
    visibleFieldsCount,
  }
}
