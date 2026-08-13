// The 54 traditional Lotería ("Chalupa") cards.
// `art` is a placeholder emoji — swap for real illustrations later.
export const CARDS = [
  { id: 1, es: 'El Gallo', en: 'The Rooster', art: '🐓' },
  { id: 2, es: 'El Diablito', en: 'The Little Devil', art: '😈' },
  { id: 3, es: 'La Dama', en: 'The Lady', art: '👩' },
  { id: 4, es: 'El Catrín', en: 'The Dandy', art: '🎩' },
  { id: 5, es: 'El Paraguas', en: 'The Umbrella', art: '☂️' },
  { id: 6, es: 'La Sirena', en: 'The Mermaid', art: '🧜‍♀️' },
  { id: 7, es: 'La Escalera', en: 'The Ladder', art: '🪜' },
  { id: 8, es: 'La Botella', en: 'The Bottle', art: '🍾' },
  { id: 9, es: 'El Barril', en: 'The Barrel', art: '🛢️' },
  { id: 10, es: 'El Árbol', en: 'The Tree', art: '🌳' },
  { id: 11, es: 'El Melón', en: 'The Melon', art: '🍈' },
  { id: 12, es: 'El Valiente', en: 'The Brave Man', art: '🗡️' },
  { id: 13, es: 'El Gorrito', en: 'The Little Bonnet', art: '🧢' },
  { id: 14, es: 'La Muerte', en: 'Death', art: '💀' },
  { id: 15, es: 'La Pera', en: 'The Pear', art: '🍐' },
  { id: 16, es: 'La Bandera', en: 'The Flag', art: '🚩' },
  { id: 17, es: 'El Bandolón', en: 'The Mandolin', art: '🪕' },
  { id: 18, es: 'El Violoncello', en: 'The Cello', art: '🎻' },
  { id: 19, es: 'La Garza', en: 'The Heron', art: '🦩' },
  { id: 20, es: 'El Pájaro', en: 'The Bird', art: '🐦' },
  { id: 21, es: 'La Mano', en: 'The Hand', art: '✋' },
  { id: 22, es: 'La Bota', en: 'The Boot', art: '🥾' },
  { id: 23, es: 'La Luna', en: 'The Moon', art: '🌙' },
  { id: 24, es: 'El Cotorro', en: 'The Parrot', art: '🦜' },
  { id: 25, es: 'El Borracho', en: 'The Drunkard', art: '🍺' },
  { id: 26, es: 'El Negrito', en: 'The Little Black Man', art: '🧑🏿' },
  { id: 27, es: 'El Corazón', en: 'The Heart', art: '❤️' },
  { id: 28, es: 'La Sandía', en: 'The Watermelon', art: '🍉' },
  { id: 29, es: 'El Tambor', en: 'The Drum', art: '🥁' },
  { id: 30, es: 'El Camarón', en: 'The Shrimp', art: '🦐' },
  { id: 31, es: 'Las Jaras', en: 'The Arrows', art: '🏹' },
  { id: 32, es: 'El Músico', en: 'The Musician', art: '🎷' },
  { id: 33, es: 'La Araña', en: 'The Spider', art: '🕷️' },
  { id: 34, es: 'El Soldado', en: 'The Soldier', art: '💂' },
  { id: 35, es: 'La Estrella', en: 'The Star', art: '⭐' },
  { id: 36, es: 'El Cazo', en: 'The Saucepan', art: '🍲' },
  { id: 37, es: 'El Mundo', en: 'The World', art: '🌎' },
  { id: 38, es: 'El Apache', en: 'The Apache', art: '🪶' },
  { id: 39, es: 'El Nopal', en: 'The Prickly Pear Cactus', art: '🌵' },
  { id: 40, es: 'El Alacrán', en: 'The Scorpion', art: '🦂' },
  { id: 41, es: 'La Rosa', en: 'The Rose', art: '🌹' },
  { id: 42, es: 'La Calavera', en: 'The Skull', art: '💀' },
  { id: 43, es: 'La Campana', en: 'The Bell', art: '🔔' },
  { id: 44, es: 'El Cantarito', en: 'The Little Water Pitcher', art: '🏺' },
  { id: 45, es: 'El Venado', en: 'The Deer', art: '🦌' },
  { id: 46, es: 'El Sol', en: 'The Sun', art: '☀️' },
  { id: 47, es: 'La Corona', en: 'The Crown', art: '👑' },
  { id: 48, es: 'La Chalupa', en: 'The Canoe', art: '🛶' },
  { id: 49, es: 'El Pino', en: 'The Pine Tree', art: '🌲' },
  { id: 50, es: 'El Pescado', en: 'The Fish', art: '🐟' },
  { id: 51, es: 'La Palma', en: 'The Palm Tree', art: '🌴' },
  { id: 52, es: 'La Maceta', en: 'The Flowerpot', art: '🪴' },
  { id: 53, es: 'El Arpa', en: 'The Harp', art: '🎼' },
  { id: 54, es: 'La Rana', en: 'The Frog', art: '🐸' },
]

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
