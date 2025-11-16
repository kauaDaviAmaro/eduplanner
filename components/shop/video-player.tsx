'use client'

interface VideoPlayerProps {
  videoUrl: string
  title?: string
  className?: string
}

export function VideoPlayer({ videoUrl, title, className = '' }: VideoPlayerProps) {
  if (!videoUrl) {
    return null
  }

  return (
    <div className={`w-full ${className}`}>
      <video
        controls
        className="w-full rounded-lg"
        preload="metadata"
        title={title}
      >
        <source src={videoUrl} type="video/mp4" />
        <source src={videoUrl} type="video/webm" />
        <source src={videoUrl} type="video/ogg" />
        Seu navegador não suporta a tag de vídeo.
      </video>
    </div>
  )
}

