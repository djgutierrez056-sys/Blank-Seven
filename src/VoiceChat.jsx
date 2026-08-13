import { useEffect, useRef, useState } from 'react'
import DailyIframe from '@daily-co/daily-js'
import { supabase } from './supabaseClient'

// Daily.co is built for third-party embedding (unlike Jitsi's public
// server, which blocks it), so this actually stays inline on the page.
// The room itself is created per-game by a Supabase Edge Function that
// holds the Daily API key server-side.
export default function VoiceChat({ roomId, playerName }) {
  const containerRef = useRef(null)
  const callRef = useRef(null)
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin() {
    setError('')
    setLoading(true)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-voice-room', {
        body: { roomId },
      })
      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)
      if (!data?.url) throw new Error('Could not get a voice room')

      callRef.current = DailyIframe.createFrame(containerRef.current, {
        showLeaveButton: true,
        iframeStyle: { width: '100%', height: '260px', border: '0', borderRadius: '8px' },
      })
      callRef.current.on('left-meeting', () => setJoined(false))
      await callRef.current.join({ url: data.url, userName: playerName, startVideoOff: true })
      setJoined(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleLeave() {
    callRef.current?.leave()
  }

  useEffect(() => {
    return () => {
      callRef.current?.destroy()
      callRef.current = null
    }
  }, [])

  return (
    <div className="voice-chat">
      <h2>Voice chat</h2>
      {!joined && (
        <button disabled={loading} onClick={handleJoin}>
          {loading ? 'Connecting...' : '🎙️ Join voice'}
        </button>
      )}
      {joined && <button onClick={handleLeave}>Leave voice</button>}
      {error && <p className="error">{error}</p>}
      <div ref={containerRef} />
    </div>
  )
}
