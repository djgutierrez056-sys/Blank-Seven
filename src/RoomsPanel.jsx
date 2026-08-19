import { useEffect, useState } from 'react'
import { fetchActiveRooms } from './roomApi'

const PIN = import.meta.env.VITE_ROOMS_PIN
const UNLOCK_KEY = 'chalupa:roomsUnlocked'

// Admin-only panel: PIN-gated list of currently active rooms, with a Join
// shortcut that hands the code back to the home join form. The PIN is a
// client-side soft gate only (this is a static site with no backend auth),
// matching the rest of the app's open-access stance.
export default function RoomsPanel({ onClose, onJoinCode }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCK_KEY) === '1')
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [rooms, setRooms] = useState(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!unlocked) return
    let cancelled = false
    fetchActiveRooms()
      .then((r) => !cancelled && setRooms(r))
      .catch((err) => !cancelled && setLoadError(err.message))
    return () => {
      cancelled = true
    }
  }, [unlocked])

  function handleUnlock(e) {
    e.preventDefault()
    if (!PIN) {
      setPinError('VITE_ROOMS_PIN is not configured.')
      return
    }
    if (pinInput === PIN) {
      sessionStorage.setItem(UNLOCK_KEY, '1')
      setUnlocked(true)
      setPinError('')
    } else {
      setPinError('Wrong PIN.')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>

        {!unlocked ? (
          <form onSubmit={handleUnlock}>
            <h2>Enter PIN</h2>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="PIN"
              autoFocus
            />
            <button type="submit">Unlock</button>
            {pinError && <p className="error">{pinError}</p>}
          </form>
        ) : (
          <>
            <h2>Active rooms</h2>
            {loadError && <p className="error">{loadError}</p>}
            {!loadError && rooms === null && <p>Loading...</p>}
            {rooms?.length === 0 && <p>No active rooms right now.</p>}
            {rooms?.length > 0 && (
              <ul className="rooms-list">
                {rooms.map((r) => (
                  <li key={r.id}>
                    <span className="room-code">{r.id}</span>
                    <span className="room-meta">
                      {r.status} · {r.playerCount} player{r.playerCount === 1 ? '' : 's'}
                    </span>
                    <button onClick={() => onJoinCode(r.id)}>Join</button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}
