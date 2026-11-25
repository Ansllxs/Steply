import { useState } from 'react'

export default function MediaImage({ src, className, width, height, fallback = null }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) return fallback

  return (
    <img
      className={className}
      src={src}
      alt=""
      width={width}
      height={height}
      onError={() => setFailed(true)}
    />
  )
}
