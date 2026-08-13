import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CARDS, openmojiUrl } from './cards'
import VoiceChat from './VoiceChat'
import {
  fetchRoom,
  fetchPlayers,
  drawNextCard,
  setPaused,
  toggleMark,
  claimChalupa,
  pruneUnverifiedMarks,
  startNewRound,
  fetchMessages,
  sendMessage,
  subscribeToRoom,
} from './roomApi'

const cardById = new Map(CARDS.map((c) => [c.id, c]))
const DRAW_INTERVAL_MS = 6000

export default function Room() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const playerId = localStorage.getItem(`chalupa:${roomId}:playerId`)

  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [justSynced, setJustSynced] = useState(false)
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('chalupa:sound') !== 'off')
  const [voices, setVoices] = useState([])
  const [voiceURI, setVoiceURI] = useState(() => localStorage.getItem('chalupa:voiceURI') || '')
  const chatMessagesRef = useRef(null)
  const prevDrawIndexRef = useRef(null)

  // Available narrator voices differ per browser/device, so this is a
  // personal preference (localStorage), not shared room state. The voice
  // list often loads asynchronously after page load, hence 'voiceschanged'.
  useEffect(() => {
    const synth = window.speechSynthesis
    if (!synth) return
    const loadVoices = () => setVoices(synth.getVoices())
    loadVoices()
    synth.addEventListener('voiceschanged', loadVoices)
    return () => synth.removeEventListener('voiceschanged', loadVoices)
  }, [])

  const reloadPlayers = useCallback(async () => {
    setPlayers(await fetchPlayers(roomId))
  }, [roomId])

  const pulseSync = useCallback(() => {
    setJustSynced(true)
    setTimeout(() => setJustSynced(false), 1000)
  }, [])

  useEffect(() => {
    if (!playerId) {
      navigate('/')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const [r, , msgs] = await Promise.all([
          fetchRoom(roomId),
          reloadPlayers(),
          fetchMessages(roomId),
        ])
        if (!cancelled) {
          setRoom(r)
          setMessages(msgs)
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message)
      }
    })()

    const unsubscribe = subscribeToRoom(
      roomId,
      (updatedRoom) => {
        setRoom(updatedRoom)
        pulseSync()
      },
      () => {
        reloadPlayers()
        pulseSync()
      },
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage])
        pulseSync()
      }
    )
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [roomId, playerId, navigate, reloadPlayers, pulseSync])

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [messages])

  const me = players.find((p) => p.id === playerId)

  // The caller's own browser is the "clock": once the round is playing, it
  // schedules the next draw a fixed interval after the last one landed.
  // Everyone else just receives the resulting room update over realtime.
  useEffect(() => {
    if (!room || !me?.is_caller) return
    if (room.status !== 'playing' || room.paused) return
    if (room.draw_index >= room.deck.length) return

    const timer = setTimeout(() => {
      drawNextCard(room).catch((err) => setActionError(err.message))
    }, DRAW_INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [room, me?.is_caller])

  const announceCard = useCallback(
    (card) => {
      if (!soundOn || !card) return
      const synth = window.speechSynthesis
      if (!synth) return
      synth.cancel() // don't let announcements stack up if calls come in fast
      const utter = new SpeechSynthesisUtterance(card.es)
      const chosenVoice = synth.getVoices().find((v) => v.voiceURI === voiceURI)
      if (chosenVoice) {
        utter.voice = chosenVoice
        utter.lang = chosenVoice.lang
      } else {
        utter.lang = 'es-ES'
      }
      utter.rate = 0.95
      synth.speak(utter)
    },
    [soundOn, voiceURI]
  )

  // Announces the card name out loud whenever a new one gets called, so
  // players don't have to keep their eyes glued to the caller strip. Skips
  // the very first sync after loading/reconnecting so it doesn't announce
  // cards that were already called before this player joined the room.
  useEffect(() => {
    if (!room) return
    if (prevDrawIndexRef.current === null) {
      prevDrawIndexRef.current = room.draw_index
      return
    }
    if (room.draw_index !== prevDrawIndexRef.current) {
      prevDrawIndexRef.current = room.draw_index
      const calledId = room.deck[room.draw_index - 1]
      announceCard(cardById.get(calledId))
    }
  }, [room, announceCard])

  function toggleSound() {
    setSoundOn((prev) => {
      const next = !prev
      localStorage.setItem('chalupa:sound', next ? 'on' : 'off')
      if (!next) window.speechSynthesis?.cancel()
      return next
    })
  }

  function handleVoiceChange(e) {
    const nextURI = e.target.value
    setVoiceURI(nextURI)
    localStorage.setItem('chalupa:voiceURI', nextURI)
    // Preview so the player can hear the pick without waiting for a card.
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    const utter = new SpeechSynthesisUtterance('El Gallo')
    const chosenVoice = synth.getVoices().find((v) => v.voiceURI === nextURI)
    if (chosenVoice) {
      utter.voice = chosenVoice
      utter.lang = chosenVoice.lang
    } else {
      utter.lang = 'es-ES'
    }
    synth.speak(utter)
  }

  if (!playerId) return null
  if (loadError) return <p className="error">{loadError}</p>
  if (!room) return <p>Loading room {roomId}...</p>

  const calledOrder = room.deck.slice(0, room.draw_index)
  const currentCardId = calledOrder.length ? calledOrder[calledOrder.length - 1] : null
  const currentCard = currentCardId ? cardById.get(currentCardId) : null
  const winner = players.find((p) => p.id === room.winner_player_id)
  const deckExhausted = room.draw_index >= room.deck.length
  // Spanish voices first since card names are Spanish, then everything else.
  const sortedVoices = [...voices].sort((a, b) => {
    const aEs = a.lang.startsWith('es') ? 0 : 1
    const bEs = b.lang.startsWith('es') ? 0 : 1
    return aEs - bEs || a.name.localeCompare(b.name)
  })

  async function handleStart() {
    setBusy(true)
    setActionError('')
    try {
      setRoom(await drawNextCard(room))
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleToggle(cardId) {
    if (!me || room.status === 'finished') return
    try {
      const updated = await toggleMark(me, cardId)
      setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleClaim() {
    setBusy(true)
    setActionError('')
    try {
      const { room: nextRoom, player: nextPlayer } = await claimChalupa(room, me)
      setRoom(nextRoom)
      setPlayers((prev) => prev.map((p) => (p.id === nextPlayer.id ? nextPlayer : p)))
    } catch (err) {
      setActionError(err.message)
      try {
        const updated = await pruneUnverifiedMarks(room, me)
        setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      } catch {
        // best-effort cleanup; the claim error above is already shown
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleTogglePause() {
    setBusy(true)
    setActionError('')
    try {
      setRoom(await setPaused(room, !room.paused))
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleNewRound() {
    setBusy(true)
    setActionError('')
    try {
      const { room: nextRoom, players: nextPlayers } = await startNewRound(room, players)
      setRoom(nextRoom)
      setPlayers(nextPlayers)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault()
    if (!me || !chatInput.trim()) return
    const text = chatInput
    setChatInput('')
    try {
      await sendMessage(roomId, me.name, text)
    } catch (err) {
      setActionError(err.message)
    }
  }

  const canClaim =
    room.status !== 'finished' && me && me.tabla.every((id) => me.marked.includes(id))
  const leaderboard = [...players].sort((a, b) => b.wins - a.wins)

  return (
    <div className="room">
      <header className="room-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Menu
          </button>
          <h1>Room {roomId}</h1>
        </div>
        <div className="header-right">
          <button
            className="sound-toggle-btn"
            onClick={toggleSound}
            title={soundOn ? 'Mute card-call announcements' : 'Unmute card-call announcements'}
          >
            {soundOn ? '🔔' : '🔕'}
          </button>
          {sortedVoices.length > 0 && (
            <select
              className="voice-select"
              value={voiceURI}
              onChange={handleVoiceChange}
              disabled={!soundOn}
              title="Narrator voice"
            >
              <option value="">Default narrator</option>
              {sortedVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          )}
          <span className={`sync-badge ${justSynced ? 'pulse' : ''}`}>🟢 Live</span>
          <p>{players.length} player{players.length === 1 ? '' : 's'}</p>
        </div>
      </header>

      <div className="room-body">
        <aside className="left-sidebar">
          <section className="leaderboard">
            <h2>Leaderboard</h2>
            <ul>
              {leaderboard.map((p, i) => (
                <li key={p.id}>
                  {i === 0 && p.wins > 0 ? '🏆 ' : ''}
                  {p.name} — {p.wins} win{p.wins === 1 ? '' : 's'}
                </li>
              ))}
            </ul>
          </section>

          <section className="players-list">
            <h2>Players</h2>
            <ul>
              {players.map((p) => (
                <li key={p.id}>
                  {p.name} {p.is_caller && '📣'} — {p.marked.length}/16
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <div className="room-main">
          {winner && (
            <div className="winner-banner">
              🏆 {winner.name} shouted <strong>¡Chalupa!</strong> and won!
              {me?.is_caller && (
                <button className="new-round-btn" disabled={busy} onClick={handleNewRound}>
                  Play again
                </button>
              )}
            </div>
          )}

          {room.paused && room.status === 'playing' && (
            <div className="paused-banner">⏸️ Game paused{me?.is_caller ? '' : ' by the caller'}</div>
          )}

          <section className="caller-strip">
            {currentCard ? (
              <div className="current-card">
                <img className="art" src={openmojiUrl(currentCard.openmoji)} alt="" />
                <span>{currentCard.es} <em>({currentCard.en})</em></span>
              </div>
            ) : (
              <div className="current-card">No card called yet</div>
            )}
            {me?.is_caller && room.status === 'waiting' && (
              <button disabled={busy} onClick={handleStart}>
                Start calling
              </button>
            )}
            {me?.is_caller && room.status === 'playing' && !deckExhausted && (
              <>
                {!room.paused && (
                  <span className="auto-note">Cards call automatically every {DRAW_INTERVAL_MS / 1000}s</span>
                )}
                <button disabled={busy} onClick={handleTogglePause}>
                  {room.paused ? 'Resume' : 'Pause'}
                </button>
              </>
            )}
            {deckExhausted && room.status !== 'finished' && <span className="auto-note">Deck empty</span>}
          </section>

          {me && (
            <section className="board-section">
              <div className="board">
                {me.tabla.map((cardId) => {
                  const card = cardById.get(cardId)
                  const marked = me.marked.includes(cardId)
                  return (
                    <button
                      key={cardId}
                      className={`cell ${marked ? 'marked' : ''}`}
                      onClick={() => handleToggle(cardId)}
                      title={card.es}
                    >
                      <img className="art" src={openmojiUrl(card.openmoji)} alt="" />
                      <span className="name">{card.es}</span>
                    </button>
                  )
                })}
              </div>

              <button
                className="chalupa-btn"
                disabled={!canClaim || busy}
                onClick={handleClaim}
              >
                ¡Chalupa!
              </button>
            </section>
          )}

          {actionError && <p className="error">{actionError}</p>}
        </div>

        {me && (
          <div className="right-sidebar">
          <VoiceChat roomId={roomId} playerName={me.name} />
          <aside className="chat">
            <h2>Chat</h2>
            <div className="chat-messages" ref={chatMessagesRef}>
              {messages.length === 0 && <p className="hint">No messages yet.</p>}
              {messages.map((m) => (
                <p key={m.id} className="chat-message">
                  <strong>{m.player_name}:</strong> {m.body}
                </p>
              ))}
            </div>
            <form className="chat-form" onSubmit={handleSendMessage}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Say something..."
                maxLength={300}
              />
              <button type="submit" disabled={!chatInput.trim()}>Send</button>
            </form>
          </aside>

          <aside className="history">
            <h2>Called cards</h2>
            <div className="history-list">
              {calledOrder.length === 0 && <p className="hint">None yet.</p>}
              {[...calledOrder].reverse().map((cardId) => {
                const card = cardById.get(cardId)
                return (
                  <p key={cardId} className="history-item">
                    <img className="art" src={openmojiUrl(card.openmoji)} alt="" /> {card.es}
                  </p>
                )
              })}
            </div>
          </aside>
          </div>
        )}
      </div>
    </div>
  )
}
