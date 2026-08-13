// Jitsi tightened iframe-embedding on meet.jit.si for external sites
// (anti-abuse), which made the old External API embed just show a dark
// screen with the logo instead of actually connecting. Opening the room
// directly in its own tab sidesteps that entirely — same free service,
// no embedding restrictions.
export default function VoiceChat({ roomId, playerName }) {
  const roomName = `chalupa-voice-${roomId}`
  const url =
    `https://meet.jit.si/${roomName}` +
    `#config.startAudioOnly=true&config.prejoinPageEnabled=false` +
    `&userInfo.displayName=${encodeURIComponent(playerName)}`

  return (
    <div className="voice-chat">
      <h2>Voice chat</h2>
      <a className="voice-link" href={url} target="_blank" rel="noopener noreferrer">
        🎙️ Open voice chat
      </a>
    </div>
  )
}
