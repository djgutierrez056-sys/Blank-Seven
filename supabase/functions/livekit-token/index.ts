// Supabase Edge Function: mints a short-lived LiveKit access token for a
// Chalupa voice room. The API key/secret live here as Supabase secrets and
// are never exposed to the browser — the client only ever gets a signed
// per-participant token.
import { AccessToken } from 'npm:livekit-server-sdk@2'

const LIVEKIT_URL = Deno.env.get('LIVEKIT_URL') // wss://your-project.livekit.cloud
const LIVEKIT_API_KEY = Deno.env.get('LIVEKIT_API_KEY')
const LIVEKIT_API_SECRET = Deno.env.get('LIVEKIT_API_SECRET')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      throw new Error('LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET secrets are not set')
    }

    const { roomId, playerName } = await req.json()
    if (!roomId || typeof roomId !== 'string') {
      throw new Error('roomId is required')
    }

    const roomName = `chalupa-voice-${roomId}`.toLowerCase()
    // identity must be unique per participant in the room, and unpredictable
    // enough that two players who pick the same display name don't collide
    const identity = `${playerName || 'Player'}-${crypto.randomUUID().slice(0, 8)}`

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      name: playerName || 'Player',
      ttl: '4h', // long enough to outlast a full game session
    })
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: false,
    })

    const token = await at.toJwt()

    return new Response(JSON.stringify({ url: LIVEKIT_URL, token, roomName }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
