import { useState } from 'react'

// Plain declarative iframe, scoped to a room-specific Jitsi room name.
// The `allow="microphone"` attribute is what actually matters here — the
// browser's Permissions Policy blocks a cross-origin iframe from using the
// mic unless the parent page explicitly delegates it, which is what caused
// the earlier script-driven embed to get stuck on a dark screen.
export default function VoiceChat({ roomId, playerName }) {
  const [joined, setJoined] = useState(false)
  const roomName = `chalupa-voice-${roomId}`
  const url =
    `https://meet.jit.si/${roomName}` +
    `#config.startAudioOnly=true&config.prejoinPageEnabled=false` +
    `&userInfo.displayName=${encodeURIComponent(playerName)}`

  return (
    <div className="voice-chat">
      <h2>Voice chat</h2>
      {!joined && (
        <button onClick={() => setJoined(true)}>🎙️ Join voice</button>
      )}
      {joined && (
        <>
          <button onClick={() => setJoined(false)}>Leave voice</button>
          <iframe
            key={roomName}
            className="voice-frame"
            src={url}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            title="Voice chat"
          />
        </>
      )}
    </div>
  )
}
