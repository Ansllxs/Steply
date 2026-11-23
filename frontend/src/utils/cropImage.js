const OUTPUT_SIZE = 512

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('decode'))
    image.src = url
  })
}

export async function cropImageToBlob(imageUrl, pixelCrop, size = OUTPUT_SIZE) {
  const image = await loadImage(imageUrl)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')

  if (!context || !pixelCrop) {
    throw new Error('export')
  }

  const sourceX = Math.min(Math.max(0, pixelCrop.x), Math.max(0, image.naturalWidth - 1))
  const sourceY = Math.min(Math.max(0, pixelCrop.y), Math.max(0, image.naturalHeight - 1))
  const sourceWidth = Math.max(1, Math.min(pixelCrop.width, image.naturalWidth - sourceX))
  const sourceHeight = Math.max(1, Math.min(pixelCrop.height, image.naturalHeight - sourceY))

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, size, size)

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('export'))
    }, 'image/jpeg', 0.92)
  })

  return blob
}
