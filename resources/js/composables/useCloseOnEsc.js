import { useEventListener } from '@vueuse/core'

export function useCloseOnEsc(callback) {
  return {
    closeOnEsc: useEventListener(document, 'keydown', event => {
      if (event.key === 'Escape') callback()
    }),
  }
}
