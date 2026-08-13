import { useEffect, useRef, useState } from 'react'

const JITSI_DOMAIN = 'meet.jit.si'
let scriptPromise = null

function loadJitsiScript() {
  if (window.JitsiMeetExternalAPI) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://${JITSI_DOMAIN}/external_api.js`
      script.async = true
      script.onload = resolve
      script.onerror = () => reject(new Error('Failed to load voice chat'))
      document.body.appendChild(script)
    })
  }
  return scriptPromise
}

// Audio-only Jitsi Meet embed, scoped to a room-specific Jitsi room name.
// Jitsi handles the WebRTC/TURN infrastructure and the mic permission
// prompt itself — we just point an iframe at it.
export default function VoiceChat({ roomId, playerName }) {
  const containerRef = useRef(null)
  const apiRef = useRef(null)
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin() {
    setError('')
    setLoading(true)
    try {
      await loadJitsiScript()
      apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName: `chalupa-voice-${roomId}`,
        parentNode: containerRef.current,
        width: '100%',
        height: 260,
        userInfo: { displayName: playerName },
        configOverwrite: {
          startWithVideoMuted: true,
          startAudioOnly: true,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: ['microphone', 'hangup', 'participants-pane'],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        },
      })
      apiRef.current.addListener('videoConferenceLeft', () => setJoined(false))
      setJoined(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleLeave() {
    apiRef.current?.dispose()
    apiRef.current = null
    setJoined(false)
  }

  useEffect(() => {
    return () => {
      apiRef.current?.dispose()
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
      {joined && (
        <button onClick={handleLeave}>Leave voice</button>
      )}
      {error && <p className="error">{error}</p>}
      <div ref={containerRef} className={`voice-frame ${joined ? 'active' : ''}`} />
    </div>
  )
}
