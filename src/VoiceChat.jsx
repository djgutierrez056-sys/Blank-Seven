import { useEffect, useRef, useState } from 'react'
import { Room, RoomEvent, Track } from 'livekit-client'
import { supabase } from './supabaseClient'

// LiveKit is a self-served WebRTC SFU (unlike meet.jit.si, which blocks
// third-party iframe embeds outright — see LEARNT.md). The room server URL
// and a short-lived per-participant token come from the livekit-token Edge
// Function; the API key/secret never reach the browser.
export default function VoiceChat({ roomId, playerName }) {
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [muted, setMuted] = useState(false)
  const [remoteCount, setRemoteCount] = useState(0)
  const roomRef = useRef(null)
  const audioContainerRef = useRef(null)

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect()
    }
  }, [])

  const join = async () => {
    setLoading(true)
    setError(null)

    const { data, error: fnError } = await supabase.functions.invoke('livekit-token', {
      body: { roomId, playerName },
    })
    if (fnError || !data?.token || !data?.url) {
      setLoading(false)
      setError('Could not start voice chat. Try again in a moment.')
      return
    }

    const room = new Room()

    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind !== Track.Kind.Audio) return
      const el = track.attach()
      audioContainerRef.current?.appendChild(el)
      setRemoteCount((n) => n + 1)
    })
    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      track.detach().forEach((el) => el.remove())
      setRemoteCount((n) => Math.max(0, n - 1))
    })
    room.on(RoomEvent.Disconnected, () => {
      setJoined(false)
      setRemoteCount(0)
      roomRef.current = null
    })

    try {
      await room.connect(data.url, data.token)
      await room.localParticipant.setMicrophoneEnabled(true)
      roomRef.current = room
      setJoined(true)
    } catch {
      setError('Could not connect to voice chat. Check your mic permissions and try again.')
      room.disconnect()
    } finally {
      setLoading(false)
    }
  }

  const leave = () => {
    roomRef.current?.disconnect()
    roomRef.current = null
    setJoined(false)
    setRemoteCount(0)
  }

  const toggleMute = async () => {
    const next = !muted
    await roomRef.current?.localParticipant.setMicrophoneEnabled(!next)
    setMuted(next)
  }

  return (
    <div className="voice-chat">
      <h2>Voice chat</h2>
      {!joined && (
        <button onClick={join} disabled={loading}>
          {loading ? 'Connecting…' : '🎙️ Join voice'}
        </button>
      )}
      {error && <p className="voice-error">{error}</p>}
      {joined && (
        <>
          <p className="voice-status">
            {remoteCount} other {remoteCount === 1 ? 'person' : 'people'} in voice
          </p>
          <button onClick={toggleMute}>{muted ? '🔇 Unmute' : '🎙️ Mute'}</button>
          <button onClick={leave}>Leave voice</button>
        </>
      )}
      {/* Remote participants' <audio> elements are attached here directly by the SDK */}
      <div ref={audioContainerRef} style={{ display: 'none' }} />
    </div>
  )
}
