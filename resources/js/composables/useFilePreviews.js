import { computed } from 'vue'

export function useFilePreviews(file) {
  const imageTypes = [
    'image/avif',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/webp',
  ]

  const type = computed(() =>
    imageTypes.includes(file.value.type) ? 'image' : 'other'
  )

  const previewUrl = computed(() =>
    URL.createObjectURL(file.value.originalFile)
  )

  const isImage = computed(() => type.value === 'image')

  return {
    imageTypes,
    isImage,
    type,
    previewUrl,
  }
}
