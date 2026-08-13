// Supabase Edge Function: creates (or reuses) a Daily.co room scoped to a
// single Chalupa game room, so voice chat is isolated per game instead of
// everyone sharing one room. The Daily API key lives here as a Supabase
// secret and is never exposed to the browser.
const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')
const DAILY_API = 'https://api.daily.co/v1/rooms'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!DAILY_API_KEY) throw new Error('DAILY_API_KEY secret is not set')

    const { roomId } = await req.json()
    if (!roomId || typeof roomId !== 'string') {
      throw new Error('roomId is required')
    }

    const name = `chalupa-voice-${roomId}`.toLowerCase()
    const expiresAt = Math.floor(Date.now() / 1000) + 6 * 60 * 60 // rooms self-clean after 6h

    let res = await fetch(DAILY_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        properties: {
          exp: expiresAt,
          eject_at_room_exp: true,
          enable_chat: false,
          start_video_off: true,
        },
      }),
    })

    if (res.status === 400) {
      // Most likely: a room with this name already exists — reuse it.
      res = await fetch(`${DAILY_API}/${name}`, {
        headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
      })
    }

    if (!res.ok) {
      const detail = await res.text()
      throw new Error(`Daily API error (${res.status}): ${detail}`)
    }

    const room = await res.json()
    return new Response(JSON.stringify({ url: room.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
