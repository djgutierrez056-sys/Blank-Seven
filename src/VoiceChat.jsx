// meet.jit.si actively restricts its iframe/JS embed API for third-party
// domains (anti-abuse policy) — embedded calls get stuck on a dark screen
// with just the logo and never actually connect, so no audio flows between
// participants even though the frame "loads" (see LEARNT.md). Opening the
// room directly in its own tab isn't subject to that restriction and
// reliably connects.
export default function VoiceChat({ roomId, playerName }) {
  const roomName = `chalupa-voice-${roomId}`
  const url =
    `https://meet.jit.si/${roomName}` +
    `#config.startAudioOnly=true` +
    `&userInfo.displayName=${encodeURIComponent(playerName)}`

  return (
    <div className="voice-chat">
      <h2>Voice chat</h2>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <button>🎙️ Join voice (opens in new tab)</button>
      </a>
    </div>
  )
}
