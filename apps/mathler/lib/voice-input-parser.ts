// Map spoken words to math symbols
const NUMBER_MAP: Record<string, string> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  oh: '0',
}

const OPERATOR_MAP: Record<string, string> = {
  plus: '+',
  minus: '-',
  subtract: '-',
  times: '×',
  multiply: '×',
  multiplied: '×',
  divided: '÷',
  'divided by': '÷',
  divide: '÷',
}

const COMMAND_MAP: Record<string, 'backspace' | 'delete' | 'enter' | 'submit' | 'clear'> = {
  backspace: 'backspace',
  delete: 'delete',
  enter: 'enter',
  submit: 'submit',
  clear: 'clear',
  erase: 'backspace',
}

// Multi-word phrases that should be matched first
const PHRASES: [RegExp, string][] = [[/\bdivided by\b/g, '÷']]

export function parseVoiceInput(text: string): {
  result: string
  command?: 'backspace' | 'delete' | 'enter' | 'submit' | 'clear'
} {
  let lowerText = text.toLowerCase().trim()

  // Replace multi-word phrases first
  PHRASES.forEach(([regex, symbol]) => {
    lowerText = lowerText.replace(regex, ` ${symbol} `)
  })

  const words = lowerText.trim().split(/\s+/)

  // Check for commands first
  for (const word of words) {
    if (COMMAND_MAP[word]) return { result: '', command: COMMAND_MAP[word] }
  }

  // Parse numbers and operators
  let result = ''

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    if (!word) continue

    // Check for numbers
    if (NUMBER_MAP[word]) {
      result += NUMBER_MAP[word]
      continue
    }

    // Check for operators
    if (OPERATOR_MAP[word]) {
      result += OPERATOR_MAP[word]
      continue
    }

    // Try direct digit matching
    if (/^\d+$/.test(word)) {
      result += word
      continue
    }

    // Try operator symbol matching
    if (
      word === '+' ||
      word === '-' ||
      word === '×' ||
      word === '÷' ||
      word === '*' ||
      word === '/'
    ) {
      result += word === '*' ? '×' : word === '/' ? '÷' : word
      continue
    }
  }

  return { result }
}
