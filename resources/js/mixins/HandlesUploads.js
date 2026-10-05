export default {
  data: () => ({ isWorkingOnFileUploads: false, fileUploadsCount: 0 }),

  methods: {
    /**
     * Handle file upload finishing
     */
    handleFileUploadFinished() {
      this.fileUploadsCount--

      if (this.fileUploadsCount < 1) {
        this.fileUploadsCount = 0
        this.cancelWorkingOnFileUploads()
      }
    },

    /**
     * Handle file upload starting
     */
    handleFileUploadStarted() {
      this.isWorkingOnFileUploads = true
      this.fileUploadsCount++
    },

    cancelWorkingOnFileUploads() {
      this.isWorkingOnFileUploads = false
    },
  },
}
