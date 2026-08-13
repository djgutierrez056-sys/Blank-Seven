import { supabase } from './supabaseClient'
import { randomTabla, shuffledDeck } from './cards'

function randomRoomCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const digits = '0123456789'
  let code = ''
  for (let i = 0; i < 3; i++) code += letters[Math.floor(Math.random() * letters.length)]
  for (let i = 0; i < 2; i++) code += digits[Math.floor(Math.random() * digits.length)]
  return code
}

// Creates a room and joins the creator as the caller.
export async function createRoom(playerName) {
  const id = randomRoomCode()
  const deck = shuffledDeck().map((c) => c.id)

  const { error: roomError } = await supabase.from('rooms').insert({ id, deck })
  if (roomError) throw roomError

  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      room_id: id,
      name: playerName,
      is_caller: true,
      tabla: randomTabla().map((c) => c.id),
    })
    .select()
    .single()
  if (playerError) throw playerError

  return { roomId: id, player }
}

export async function joinRoom(roomId, playerName) {
  const code = roomId.trim().toUpperCase()
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select()
    .eq('id', code)
    .maybeSingle()
  if (roomError) throw roomError
  if (!room) throw new Error(`Room "${code}" not found`)

  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      room_id: code,
      name: playerName,
      is_caller: false,
      tabla: randomTabla().map((c) => c.id),
    })
    .select()
    .single()
  if (playerError) throw playerError

  return { roomId: code, player }
}

export async function fetchRoom(roomId) {
  const { data, error } = await supabase.from('rooms').select().eq('id', roomId).single()
  if (error) throw error
  return data
}

export async function fetchPlayers(roomId) {
  const { data, error } = await supabase
    .from('players')
    .select()
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true })
  if (error) throw error
  return data
}

// Advances the room's draw pointer by one card. Any client can call this,
// but only the caller's UI exposes the button.
export async function drawNextCard(room) {
  if (room.draw_index >= room.deck.length) return room
  const nextIndex = room.draw_index + 1
  const { data, error } = await supabase
    .from('rooms')
    .update({ draw_index: nextIndex, status: 'playing' })
    .eq('id', room.id)
    .eq('draw_index', room.draw_index) // optimistic concurrency guard
    .select()
    .single()
  if (error) throw error
  return data
}

export async function setPaused(room, paused) {
  const { data, error } = await supabase
    .from('rooms')
    .update({ paused })
    .eq('id', room.id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleMark(player, cardId) {
  const marked = new Set(player.marked)
  if (marked.has(cardId)) marked.delete(cardId)
  else marked.add(cardId)
  const nextMarked = [...marked]

  const { data, error } = await supabase
    .from('players')
    .update({ marked: nextMarked })
    .eq('id', player.id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Removes marks for cards that were never actually drawn — used after a
// failed Chalupa claim so a mistaken tap doesn't linger as a false mark.
export async function pruneUnverifiedMarks(room, player) {
  const calledIds = new Set(room.deck.slice(0, room.draw_index))
  const validMarks = player.marked.filter((cardId) => calledIds.has(cardId))
  if (validMarks.length === player.marked.length) return player

  const { data, error } = await supabase
    .from('players')
    .update({ marked: validMarks })
    .eq('id', player.id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Claims the win: server-side check that every card on the tabla has
// actually been drawn, so a player can't fake a full board.
export async function claimChalupa(room, player) {
  const calledIds = new Set(room.deck.slice(0, room.draw_index))
  const fullyMatched = player.tabla.every((cardId) => calledIds.has(cardId))
  if (!fullyMatched) throw new Error('Not all cards on your board have been called yet.')

  const { data, error } = await supabase
    .from('rooms')
    .update({ status: 'finished', winner_player_id: player.id })
    .eq('id', room.id)
    .eq('status', 'playing')
    .select()
    .single()
  if (error) throw error
  if (!data) throw new Error('Someone already won this round.')
  return data
}

// Resets a finished room for another round: fresh shuffled deck, fresh
// boards for every player, marks cleared, no winner.
export async function startNewRound(room, players) {
  const deck = shuffledDeck().map((c) => c.id)

  const { data: nextRoom, error: roomError } = await supabase
    .from('rooms')
    .update({ deck, draw_index: 0, status: 'waiting', winner_player_id: null, paused: false })
    .eq('id', room.id)
    .select()
    .single()
  if (roomError) throw roomError

  const updatedPlayers = await Promise.all(
    players.map(async (player) => {
      const { data, error } = await supabase
        .from('players')
        .update({ tabla: randomTabla().map((c) => c.id), marked: [] })
        .eq('id', player.id)
        .select()
        .single()
      if (error) throw error
      return data
    })
  )

  return { room: nextRoom, players: updatedPlayers }
}

export function subscribeToRoom(roomId, onRoomChange, onPlayersChange) {
  const channel = supabase
    .channel(`room-${roomId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      (payload) => onRoomChange(payload.new)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
      onPlayersChange
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
