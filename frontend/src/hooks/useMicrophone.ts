import { useRef, useCallback, useState } from 'react'

export function useMicrophone() {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState('')

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true },
      })
      streamRef.current = stream
      const ctx = new AudioContext({ sampleRate: 16000 })
      audioCtxRef.current = ctx
      setError('')
    } catch (e: any) {
      setError(`麦克风访问失败: ${e.message}`)
    }
  }, [])

  const stopMic = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    audioCtxRef.current?.close()
    streamRef.current = null
    audioCtxRef.current = null
  }, [])

  const getPCMChunk = useCallback((): Float32Array | null => {
    // Returns null for now — real implementation needs AudioWorklet/ScriptProcessor
    // The recording is handled by the WebSocket layer's direct PCM capture
    return null
  }, [])

  return { audioCtxRef, streamRef, error, startMic, stopMic, getPCMChunk }
}
