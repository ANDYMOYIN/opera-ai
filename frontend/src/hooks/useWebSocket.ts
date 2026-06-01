import { useRef, useCallback, useState } from 'react'
import { WS_BASE } from '../utils/constants'

type WSMessageHandler = (data: any) => void

export function useWebSocket(sessionId: string) {
  const wsRef = useRef<WebSocket | null>(null)
  const [readyState, setReadyState] = useState(WebSocket.CLOSED)
  const handlerRef = useRef<WSMessageHandler>(() => {})

  const connect = useCallback(() => {
    const url = `${WS_BASE}/recognize?session_id=${sessionId}&mode=both`
    const ws = new WebSocket(url)
    ws.binaryType = 'arraybuffer'
    wsRef.current = ws

    ws.onopen = () => setReadyState(WebSocket.OPEN)
    ws.onclose = () => setReadyState(WebSocket.CLOSED)
    ws.onerror = () => setReadyState(WebSocket.CLOSED)

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          handlerRef.current(JSON.parse(event.data))
        } catch {}
      }
    }
  }, [sessionId])

  const disconnect = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  const sendControl = useCallback((type: string, extra: Record<string, string> = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...extra }))
    }
  }, [])

  const sendBinary = useCallback((data: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data)
    }
  }, [])

  const onMessage = useCallback((handler: WSMessageHandler) => {
    handlerRef.current = handler
  }, [])

  return { readyState, connect, disconnect, sendControl, sendBinary, onMessage }
}
