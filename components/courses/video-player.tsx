'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import ReactPlayer from 'react-player'

interface VideoPlayerProps {
  lessonId: string
  title?: string
  onTimeUpdate?: (currentTime: number) => void
  onEnded?: () => void
  onProgressUpdate?: (timeWatched: number, isCompleted: boolean) => void
  initialTime?: number
}

export function VideoPlayer({ 
  lessonId, 
  title, 
  onTimeUpdate, 
  onEnded,
  onProgressUpdate,
  initialTime = 0
}: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const progressSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedTimeRef = useRef<number>(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSavingProgress, setIsSavingProgress] = useState(false)
  const [hasLoadedProgress, setHasLoadedProgress] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [played, setPlayed] = useState(0)
  const [playedSeconds, setPlayedSeconds] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [showControls, setShowControls] = useState(true)
  const [showEndOverlay, setShowEndOverlay] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Format time helper
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Load progress for this lesson
  const loadProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/progress?lessonId=${lessonId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.progress && data.progress.timeWatched > 0) {
          const timeToSeek = data.progress.timeWatched
          lastSavedTimeRef.current = timeToSeek
          if (playerRef.current) {
            playerRef.current.seekTo(timeToSeek, 'seconds')
          }
          setPlayedSeconds(timeToSeek)
          if (duration > 0) {
            setPlayed(timeToSeek / duration)
          }
        }
      }
    } catch (err) {
      console.error('Error loading progress:', err)
    }
  }, [lessonId, duration])

  // Save progress to API
  const saveProgress = useCallback(async (timeWatched: number, isCompleted: boolean = false) => {
    // Only save if time changed significantly (at least 5 seconds) or if completed
    const timeDiff = Math.abs(timeWatched - lastSavedTimeRef.current)
    if (!isCompleted && timeDiff < 5) {
      return
    }

    try {
      setIsSavingProgress(true)
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          timeWatched,
          isCompleted,
        }),
      })

      if (response.ok) {
        lastSavedTimeRef.current = timeWatched
        if (onProgressUpdate) {
          onProgressUpdate(timeWatched, isCompleted)
        }
      }
    } catch (err) {
      console.error('Error saving progress:', err)
    } finally {
      setIsSavingProgress(false)
    }
  }, [lessonId, onProgressUpdate])

  // Fetch signed URL from API
  const fetchVideoUrl = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/videos/${lessonId}`)
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('Você não tem acesso a esta aula. Faça upgrade do seu plano.')
        } else if (response.status === 401) {
          setError('Você precisa estar logado para assistir esta aula.')
        } else {
          setError('Erro ao carregar o vídeo. Tente novamente.')
        }
        return
      }

      const data = await response.json()
      setVideoUrl(data.url)

      // Load progress after URL is set (only if initialTime not provided)
      if (!hasLoadedProgress && initialTime === 0) {
        await loadProgress()
        setHasLoadedProgress(true)
      } else if (initialTime > 0) {
        // If initialTime is provided, use it directly
        lastSavedTimeRef.current = initialTime
        setHasLoadedProgress(true)
        if (playerRef.current) {
          playerRef.current.seekTo(initialTime, 'seconds')
        }
        setPlayedSeconds(initialTime)
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Refresh URL before it expires (refresh at 4 minutes, expires at 5)
      timeoutRef.current = setTimeout(() => {
        refreshVideoUrl()
      }, 4 * 60 * 1000) // 4 minutes
    } catch (err) {
      console.error('Error fetching video URL:', err)
      setError('Erro ao carregar o vídeo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Refresh the signed URL before it expires
  const refreshVideoUrl = async () => {
    if (isRefreshing) return
    
    try {
      setIsRefreshing(true)
      const response = await fetch(`/api/videos/${lessonId}`)
      
      if (response.ok) {
        const data = await response.json()
        const currentTime = playedSeconds
        const wasPlaying = playing
        
        setVideoUrl(data.url)
        
        // Restore playback state after URL refresh
        if (playerRef.current && currentTime > 0) {
          setTimeout(() => {
            if (playerRef.current) {
              playerRef.current.seekTo(currentTime, 'seconds')
              if (wasPlaying) {
                setPlaying(true)
              }
            }
          }, 500)
        }
      }
    } catch (err) {
      console.error('Error refreshing video URL:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement?.tagName !== 'BODY') {
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          setPlaying(!playing)
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (playerRef.current) {
            const newTime = Math.max(0, playedSeconds - 10)
            playerRef.current.seekTo(newTime, 'seconds')
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (playerRef.current) {
            const newTime = Math.min(duration, playedSeconds + 10)
            playerRef.current.seekTo(newTime, 'seconds')
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(Math.min(1, volume + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(Math.max(0, volume - 0.1))
          break
        case 'm':
        case 'M':
          e.preventDefault()
          setMuted(!muted)
          break
        case 'f':
        case 'F':
          e.preventDefault()
          if (containerRef.current) {
            if (document.fullscreenElement) {
              document.exitFullscreen()
            } else {
              containerRef.current.requestFullscreen()
            }
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [playing, playedSeconds, duration, volume, muted])

  // Auto-hide controls
  useEffect(() => {
    if (playing) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    } else {
      setShowControls(true)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [playing])

  useEffect(() => {
    setHasLoadedProgress(false)
    lastSavedTimeRef.current = 0
    setShowEndOverlay(false)
    setPlayed(0)
    setPlayedSeconds(0)
    fetchVideoUrl()
    
    // Cleanup timeouts on unmount or lessonId change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current)
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId])

  // Handle progress updates with auto-save
  useEffect(() => {
    if (playedSeconds > 0 && duration > 0) {
      if (onTimeUpdate) {
        onTimeUpdate(playedSeconds)
      }

      // Auto-save progress every 10 seconds
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current)
      }

      progressSaveTimeoutRef.current = setTimeout(() => {
        saveProgress(playedSeconds, false)
      }, 10000)
    }

    return () => {
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current)
      }
    }
  }, [playedSeconds, duration, onTimeUpdate, saveProgress])

  // Handle video ended
  const handleEnded = useCallback(async () => {
    setPlaying(false)
    setShowEndOverlay(true)
    setShowControls(true)
    
    if (duration > 0) {
      await saveProgress(duration, true)
    }
    
    if (onEnded) {
      onEnded()
    }
  }, [duration, saveProgress, onEnded])

  // Handle seek
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setPlayed(newTime)
    if (playerRef.current) {
      playerRef.current.seekTo(newTime, 'fraction')
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }

  if (loading) {
    return (
      <div className="w-full aspect-video bg-gray-900 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white">Carregando vídeo...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full aspect-video bg-gray-900 flex items-center justify-center rounded-lg">
        <div className="text-white text-center p-4">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchVideoUrl}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (!videoUrl) {
    return (
      <div className="w-full aspect-video bg-gray-900 flex items-center justify-center rounded-lg">
        <div className="text-white">URL do vídeo não disponível</div>
      </div>
    )
  }

  const progressPercentage = duration > 0 ? (playedSeconds / duration) * 100 : 0
  const timeRemaining = duration - playedSeconds

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
      )}
      <div 
        ref={containerRef}
        className="w-full aspect-video bg-black rounded-lg overflow-hidden relative group"
        onMouseMove={() => {
          setShowControls(true)
          if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current)
          }
          if (playing) {
            controlsTimeoutRef.current = setTimeout(() => {
              setShowControls(false)
            }, 3000)
          }
        }}
        onMouseLeave={() => {
          if (playing) {
            setShowControls(false)
          }
        }}
      >
        {/* Video Player */}
        <div className="w-full h-full">
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            playing={playing}
            volume={volume}
            muted={muted}
            playbackRate={playbackRate}
            width="100%"
            height="100%"
            onProgress={(state) => {
              setPlayed(state.played)
              setPlayedSeconds(state.playedSeconds)
            }}
            onDuration={(duration) => {
              setDuration(duration)
              if (initialTime > 0 && !hasLoadedProgress) {
                setPlayed(initialTime / duration)
                setHasLoadedProgress(true)
              }
            }}
            onEnded={handleEnded}
            onError={(err) => {
              console.error('Video error:', err)
              setError('Erro ao carregar o vídeo. Tente recarregar a página.')
            }}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload',
                },
              },
            }}
          />
        </div>

        {/* End Overlay */}
        {showEndOverlay && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 animate-fadeIn">
            <div className="text-center p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <div className="mb-6">
                <svg className="w-20 h-20 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-2xl font-bold text-white mb-2">Aula Concluída!</h3>
                <p className="text-gray-300">Parabéns por completar esta aula</p>
              </div>
              <button
                onClick={() => {
                  setShowEndOverlay(false)
                  if (onEnded) {
                    onEnded()
                  }
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Custom Controls Overlay */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/50 cursor-pointer group/progress">
            <div 
              className="h-full bg-purple-600 transition-all duration-150"
              style={{ width: `${progressPercentage}%` }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 h-4 w-4 bg-purple-600 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPercentage}% - 8px)` }}
            />
          </div>

          {/* Controls Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
            {/* Progress Slider */}
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={played}
                onChange={handleSeekChange}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                {/* Play/Pause */}
                <button
                  onClick={() => setPlaying(!playing)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  aria-label={playing ? 'Pausar' : 'Reproduzir'}
                >
                  {playing ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMuted(!muted)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    aria-label={muted ? 'Ativar som' : 'Desativar som'}
                  >
                    {muted || volume === 0 ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                      </svg>
                    ) : volume < 0.5 ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.83 7l-1.29 1.29 3.7 3.71-3.71 3.71 1.29 1.29 4.99-5zM4 9v6h4l5 5V4L8 9H4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                      </svg>
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={muted ? 0 : volume}
                    onChange={(e) => {
                      const newVolume = parseFloat(e.target.value)
                      setVolume(newVolume)
                      setMuted(newVolume === 0)
                    }}
                    className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Time Display */}
                <div className="text-sm font-mono">
                  {formatTime(playedSeconds)} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Playback Rate */}
                <div className="flex items-center gap-2">
                  <select
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                    className="bg-white/20 text-white text-sm px-2 py-1 rounded border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                </div>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Tela cheia"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Center Play Button (when paused) */}
          {!playing && !showEndOverlay && (
            <button
              onClick={() => setPlaying(true)}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all transform hover:scale-110"
              aria-label="Reproduzir"
            >
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
        </div>

        {/* Saving Progress Indicator */}
        {isSavingProgress && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 backdrop-blur-sm">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Salvando progresso...</span>
          </div>
        )}
      </div>

      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #9333ea;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .slider:hover::-webkit-slider-thumb {
          opacity: 1;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #9333ea;
          cursor: pointer;
          border: none;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .slider:hover::-moz-range-thumb {
          opacity: 1;
        }
      `}</style>
    </div>
  )
}
