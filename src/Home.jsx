import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRoom, joinRoom } from './roomApi'
import RoomsPanel from './RoomsPanel'

export default function Home() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [roomsOpen, setRoomsOpen] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return setError('Enter your name first.')
    setBusy(true)
    setError('')
    try {
      const { roomId, player } = await createRoom(name.trim())
      localStorage.setItem(`chalupa:${roomId}:playerId`, player.id)
      navigate(`/room/${roomId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    if (!name.trim()) return setError('Enter your name first.')
    if (!code.trim()) return setError('Enter a room code.')
    setBusy(true)
    setError('')
    try {
      const { roomId, player } = await joinRoom(code, name.trim())
      localStorage.setItem(`chalupa:${roomId}:playerId`, player.id)
      navigate(`/room/${roomId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="home">
      <button className="rooms-btn" onClick={() => setRoomsOpen(true)}>
        Rooms
      </button>

      {roomsOpen && (
        <RoomsPanel
          onClose={() => setRoomsOpen(false)}
          onJoinCode={(roomCode) => {
            setCode(roomCode)
            setRoomsOpen(false)
          }}
        />
      )}

      <h1>🛶 Chalupa</h1>
      <p className="subtitle">Mexican Lotería, online with friends</p>

      <label className="field">
        Your name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan" />
      </label>

      <div className="actions">
        <form onSubmit={handleCreate} className="action-card">
          <h2>Start a game</h2>
          <p>Create a room and be the caller.</p>
          <button disabled={busy} type="submit">Create room</button>
        </form>

        <form onSubmit={handleJoin} className="action-card">
          <h2>Join a game</h2>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Room code"
            maxLength={5}
          />
          <button disabled={busy} type="submit">Join room</button>
        </form>
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  )
}
