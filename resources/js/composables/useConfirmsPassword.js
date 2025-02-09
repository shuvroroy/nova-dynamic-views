import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import isFunction from 'lodash/isFunction'

export function useConfirmsPassword(emitter) {
  const store = useStore()

  const confirming = ref(false)
  const confirmed = computed(() => store.getters.currentUserPasswordConfirmed)

  const passwordConfirmed = () => {
    confirming.value = false
    emitter('confirmed')
    store.dispatch('passwordConfirmed')
  }

  const cancelConfirming = () => {
    confirming.value = false
    store.dispatch('passwordUnconfirmed')
  }

  const confirmingPassword = ({
    verifyUsing,
    confirmedUsing,
    mode,
    required,
  }) => {
    if (confirmed == null) {
      store.dispatch('confirmedPasswordStatus')
    }

    if (confirmedUsing == null) {
      confirmedUsing = () => passwordConfirmed()
    }

    if (
      mode === 'timeout' &&
      (required === false || confirmed.value === true)
    ) {
      confirming.value = false
      if (isFunction(confirmedUsing)) confirmedUsing()

      return
    }

    confirming.value = true
    if (isFunction(verifyUsing)) verifyUsing()
  }

  return {
    confirming,
    confirmed,
    confirmingPassword,
    passwordConfirmed,
    cancelConfirming,
  }
}
