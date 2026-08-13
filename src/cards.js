// The 54 traditional Lotería ("Chalupa") cards.
// `art` is a fallback emoji glyph; `openmoji` is the verified Unicode
// codepoint for the matching OpenMoji illustration (CC BY-SA 4.0,
// https://openmoji.org) rendered via openmojiUrl() — real vector art
// instead of relying on the OS's own emoji font.
export const CARDS = [
  { id: 1, es: 'El Gallo', en: 'The Rooster', art: '🐓', openmoji: '1F413' },
  { id: 2, es: 'El Diablito', en: 'The Little Devil', art: '😈', openmoji: '1F608' },
  { id: 3, es: 'La Dama', en: 'The Lady', art: '👩', openmoji: '1F469' },
  { id: 4, es: 'El Catrín', en: 'The Dandy', art: '🎩', openmoji: '1F3A9' },
  { id: 5, es: 'El Paraguas', en: 'The Umbrella', art: '☂️', openmoji: '2602' },
  { id: 6, es: 'La Sirena', en: 'The Mermaid', art: '🧜‍♀️', openmoji: '1F9DC-200D-2640-FE0F' },
  { id: 7, es: 'La Escalera', en: 'The Ladder', art: '🪜', openmoji: '1FA9C' },
  { id: 8, es: 'La Botella', en: 'The Bottle', art: '🍾', openmoji: '1F37E' },
  { id: 9, es: 'El Barril', en: 'The Barrel', art: '🛢️', openmoji: '1F6E2' },
  { id: 10, es: 'El Árbol', en: 'The Tree', art: '🌳', openmoji: '1F333' },
  { id: 11, es: 'El Melón', en: 'The Melon', art: '🍈', openmoji: '1F348' },
  { id: 12, es: 'El Valiente', en: 'The Brave Man', art: '🗡️', openmoji: '1F5E1' },
  { id: 13, es: 'El Gorrito', en: 'The Little Bonnet', art: '🧢', openmoji: '1F9E2' },
  { id: 14, es: 'La Muerte', en: 'Death', art: '💀', openmoji: '1F480' },
  { id: 15, es: 'La Pera', en: 'The Pear', art: '🍐', openmoji: '1F350' },
  { id: 16, es: 'La Bandera', en: 'The Flag', art: '🚩', openmoji: '1F6A9' },
  { id: 17, es: 'El Bandolón', en: 'The Mandolin', art: '🪕', openmoji: '1FA95' },
  { id: 18, es: 'El Violoncello', en: 'The Cello', art: '🎻', openmoji: '1F3BB' },
  { id: 19, es: 'La Garza', en: 'The Heron', art: '🦩', openmoji: '1F9A9' },
  { id: 20, es: 'El Pájaro', en: 'The Bird', art: '🐦', openmoji: '1F426' },
  { id: 21, es: 'La Mano', en: 'The Hand', art: '✋', openmoji: '270B' },
  { id: 22, es: 'La Bota', en: 'The Boot', art: '🥾', openmoji: '1F97E' },
  { id: 23, es: 'La Luna', en: 'The Moon', art: '🌙', openmoji: '1F319' },
  { id: 24, es: 'El Cotorro', en: 'The Parrot', art: '🦜', openmoji: '1F99C' },
  { id: 25, es: 'El Borracho', en: 'The Drunkard', art: '🍺', openmoji: '1F37A' },
  { id: 26, es: 'El Negrito', en: 'The Little Black Man', art: '🧑🏿', openmoji: '1F464' },
  { id: 27, es: 'El Corazón', en: 'The Heart', art: '❤️', openmoji: '2764' },
  { id: 28, es: 'La Sandía', en: 'The Watermelon', art: '🍉', openmoji: '1F349' },
  { id: 29, es: 'El Tambor', en: 'The Drum', art: '🥁', openmoji: '1F941' },
  { id: 30, es: 'El Camarón', en: 'The Shrimp', art: '🦐', openmoji: '1F990' },
  { id: 31, es: 'Las Jaras', en: 'The Arrows', art: '🏹', openmoji: '1F3F9' },
  { id: 32, es: 'El Músico', en: 'The Musician', art: '🎷', openmoji: '1F3B7' },
  { id: 33, es: 'La Araña', en: 'The Spider', art: '🕷️', openmoji: '1F577' },
  { id: 34, es: 'El Soldado', en: 'The Soldier', art: '💂', openmoji: '1F482' },
  { id: 35, es: 'La Estrella', en: 'The Star', art: '⭐', openmoji: '2B50' },
  { id: 36, es: 'El Cazo', en: 'The Saucepan', art: '🍲', openmoji: '1F372' },
  { id: 37, es: 'El Mundo', en: 'The World', art: '🌎', openmoji: '1F30E' },
  { id: 38, es: 'El Apache', en: 'The Apache', art: '🪶', openmoji: '1FAB6' },
  { id: 39, es: 'El Nopal', en: 'The Prickly Pear Cactus', art: '🌵', openmoji: '1F335' },
  { id: 40, es: 'El Alacrán', en: 'The Scorpion', art: '🦂', openmoji: '1F982' },
  { id: 41, es: 'La Rosa', en: 'The Rose', art: '🌹', openmoji: '1F339' },
  { id: 42, es: 'La Calavera', en: 'The Skull', art: '💀', openmoji: '2620' },
  { id: 43, es: 'La Campana', en: 'The Bell', art: '🔔', openmoji: '1F514' },
  { id: 44, es: 'El Cantarito', en: 'The Little Water Pitcher', art: '🏺', openmoji: '1F3FA' },
  { id: 45, es: 'El Venado', en: 'The Deer', art: '🦌', openmoji: '1F98C' },
  { id: 46, es: 'El Sol', en: 'The Sun', art: '☀️', openmoji: '2600' },
  { id: 47, es: 'La Corona', en: 'The Crown', art: '👑', openmoji: '1F451' },
  { id: 48, es: 'La Chalupa', en: 'The Canoe', art: '🛶', openmoji: '1F6F6' },
  { id: 49, es: 'El Pino', en: 'The Pine Tree', art: '🌲', openmoji: '1F332' },
  { id: 50, es: 'El Pescado', en: 'The Fish', art: '🐟', openmoji: '1F41F' },
  { id: 51, es: 'La Palma', en: 'The Palm Tree', art: '🌴', openmoji: '1F334' },
  { id: 52, es: 'La Maceta', en: 'The Flowerpot', art: '🪴', openmoji: '1FAB4' },
  { id: 53, es: 'El Arpa', en: 'The Harp', art: '🎼', openmoji: '1F3BC' },
  { id: 54, es: 'La Rana', en: 'The Frog', art: '🐸', openmoji: '1F438' },
]

export function openmojiUrl(code) {
  return `https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji/color/svg/${code}.svg`
}

export function shuffledDeck() {
  const deck = [...CARDS]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

// A tabla (board) is 16 unique cards from the 54.
export function randomTabla() {
  return shuffledDeck().slice(0, 16)
}
