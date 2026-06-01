import { useRef, useCallback, useState } from 'react'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState('')

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: 30 },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setError('')
    } catch (e: any) {
      setError(`摄像头访问失败: ${e.message}`)
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const captureFrame = useCallback((): Blob | null => {
    if (!videoRef.current) return null
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(videoRef.current, 0, 0)
    return new Promise<Blob | null>(resolve => {
      canvas.toBlob(b => resolve(b), 'image/jpeg', 0.7)
    }) as any
  }, [])

  return { videoRef, streamRef, error, startCamera, stopCamera, captureFrame }
}
