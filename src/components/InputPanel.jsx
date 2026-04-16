import { useRef, useState } from 'react'
import { preprocessImage } from '../lib/imagePreprocessor'

const MAX_IMAGES = 4

/**
 * InputPanel — textarea (text tab) or 2×2 image upload grid (image tab).
 * onImagesChange(base64DataUri[]) is called whenever the slot array changes.
 */
export default function InputPanel({
  inputText, setInputText,
  activeTab, isDragOver, setIsDragOver,
  referenceImages, onImagesChange,
}) {
  const fileInputRef = useRef(null)
  const [targetSlot, setTargetSlot] = useState(null)  // which slot index triggered the file picker
  const [slotDragOver, setSlotDragOver] = useState(null)

  const images = referenceImages ?? []

  const processFile = async (file, slotIndex) => {
    if (!file || !file.type.startsWith('image/')) return
    try {
      const dataUri = await preprocessImage(file)
      const next = [...images]
      if (slotIndex != null && slotIndex < next.length) {
        next[slotIndex] = dataUri          // replace existing slot
      } else {
        next.push(dataUri)                 // fill next empty slot
      }
      onImagesChange(next.slice(0, MAX_IMAGES))
    } catch (err) {
      console.error('Image preprocessing failed:', err)
    }
  }

  const handleFileInput = (e) => {
    processFile(e.target.files[0], targetSlot)
    e.target.value = ''
  }

  const handleSlotClick = (index) => {
    setTargetSlot(index < images.length ? index : null)
    fileInputRef.current?.click()
  }

  const handleRemove = (e, index) => {
    e.stopPropagation()
    const next = images.filter((_, i) => i !== index)
    onImagesChange(next)
  }

  const handleDrop = (e, slotIndex) => {
    e.preventDefault()
    setSlotDragOver(null)
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    processFile(file, slotIndex)
  }

  // Render 4 slots: filled ones show image, empty ones show dashed + prompt
  const slots = Array.from({ length: MAX_IMAGES }, (_, i) => {
    const img = images[i] ?? null
    const isNextEmpty = i === images.length  // first available empty slot
    const isDragTarget = slotDragOver === i

    if (img) {
      return (
        <div
          key={i}
          className="vf-upload-slot vf-upload-slot--filled"
          onClick={() => handleSlotClick(i)}
          onDragOver={e => { e.preventDefault(); setSlotDragOver(i) }}
          onDragLeave={() => setSlotDragOver(null)}
          onDrop={e => handleDrop(e, i)}
        >
          <img src={img} alt={`Reference ${i + 1}`} />
          <button className="vf-upload-slot-remove" onClick={e => handleRemove(e, i)}>×</button>
        </div>
      )
    }

    // Empty slot — only the first empty slot shows the "add" affordance actively
    return (
      <div
        key={i}
        className={`vf-upload-slot${isDragTarget ? ' vf-upload-slot--over' : ''}`}
        style={!isNextEmpty ? { opacity: 0.35, cursor: 'default', pointerEvents: 'none' } : {}}
        onClick={isNextEmpty ? () => handleSlotClick(null) : undefined}
        onDragOver={isNextEmpty ? e => { e.preventDefault(); setSlotDragOver(i) } : undefined}
        onDragLeave={isNextEmpty ? () => setSlotDragOver(null) : undefined}
        onDrop={isNextEmpty ? e => handleDrop(e, null) : undefined}
      >
        <span className="vf-upload-slot-plus">+</span>
        <span>{isNextEmpty ? 'Add image' : ''}</span>
      </div>
    )
  })

  return (
    <div className="vf-card" style={{ padding: '33px', display: 'flex', flexDirection: 'column' }}>
      {activeTab === 'text' ? (
        <textarea
          className="vf-textarea"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Describe your vision..."
        />
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
          <div className="vf-upload-grid">
            {slots}
          </div>
        </>
      )}
    </div>
  )
}
