import { ref } from 'vue'

export function useDragAndDrop(emitter) {
  const startedDrag = ref(false)
  const files = ref([])

  const handleOnDragEnter = () => (startedDrag.value = true)

  const handleOnDragLeave = () => (startedDrag.value = false)

  const handleOnDrop = e => {
    files.value = e.dataTransfer.files
    emitter('fileChanged', e.dataTransfer.files)
  }

  return {
    startedDrag,
    handleOnDragEnter,
    handleOnDragLeave,
    handleOnDrop,
  }
}
