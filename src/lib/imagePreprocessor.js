/**
 * imagePreprocessor.js
 *
 * Normalizes an uploaded image file for multi-modal API requests:
 * - Fills transparent background with white (avoids black-channel artifacts)
 * - Scales to max 1024px on the longer side (maintains aspect ratio)
 * - Returns a base64 JPEG data URI
 */

const MAX_PX = 1024

export function preprocessImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(MAX_PX / img.width, MAX_PX / img.height, 1)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h

        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)

        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target.result
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
