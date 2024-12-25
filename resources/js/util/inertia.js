import { router } from '@inertiajs/vue3'
import debounce from 'lodash/debounce'

export function setupInertia(app, store) {
  document.addEventListener('inertia:before', () => {
    ;(async () => {
      app.debug('Syncing Inertia props to the store via `inertia:before`...')
      await store.dispatch('assignPropsFromInertia')
    })()
  })

  document.addEventListener('inertia:navigate', () => {
    ;(async () => {
      app.debug('Syncing Inertia props to the store via `inertia:navigate`...')
      await store.dispatch('assignPropsFromInertia')
    })()
  })
}
