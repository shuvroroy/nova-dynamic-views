import { onBeforeUnmount, onMounted } from 'vue'
import { useLocalization } from './useLocalization'

export function useInteractsWithErrors() {
  const { __ } = useLocalization()

  const sessionTokenExpiredHandler = () => {
    Nova.$toasted.show(__('Sorry, your session has expired.'), {
      action: {
        onClick: () => Nova.redirectToLogin(),
        text: __('Reload'),
      },
      duration: null,
      type: 'error',
    })

    setTimeout(() => {
      Nova.redirectToLogin()
    }, 5000)
  }

  const genericErrorHandler = message => {
    Nova.error(message)
  }

  onMounted(() => {
    Nova.$on('error', genericErrorHandler)
    Nova.$on('token-expired', sessionTokenExpiredHandler)
  })

  onBeforeUnmount(() => {
    Nova.$off('error', genericErrorHandler)
    Nova.$off('token-expired', sessionTokenExpiredHandler)
  })

  return {
    sessionTokenExpiredHandler,
    genericErrorHandler,
  }
}
