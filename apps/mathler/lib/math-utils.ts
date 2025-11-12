export function evaluateExpression(expr: string): number | null {
  try {
    // Replace × and ÷ with * and /
    const normalized = expr.replace(/×/g, "*").replace(/÷/g, "/");

    // Validate expression (only allow digits, operators, and parentheses)
    if (!/^[\d+\-*/.()]+$/.test(normalized)) {
      return null;
    }

    // Check for valid syntax
    if (/^[+*/%]|[+*/%]$/.test(normalized)) {
      return null;
    }

    if (/[+\-*/%]{2,}/.test(normalized)) {
      return null;
    }

    // Use Function constructor for safe evaluation
    // This is safer than eval() as it's evaluated in a restricted scope
    const result = Function('"use strict"; return (' + normalized + ")")();

    // Check if result is a valid number
    if (typeof result !== "number" || !isFinite(result)) {
      return null;
    }

    // Round to avoid floating point issues
    return Math.round(result * 1000000) / 1000000;
  } catch (error) {
    return null;
  }
}

/**
 * Generates a random target number for daily puzzles
 * Uses current date as seed for daily consistency
 */
export function getRandomTarget(): number {
  const today = new Date();
  const seed =
    today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate();

  // Seeded random generator
  let rand = Math.sin(seed) * 10000;
  rand = rand - Math.floor(rand);

  // Target between 10 and 100
  return Math.floor(rand * 91) + 10;
}

/**
 * Generates all possible equations that equal a target
 * (for hint system or verification)
 */
export function generateEquationsForTarget(
  target: number,
  maxLength = 9,
): string[] {
  const equations: string[] = [];

  // Simple brute force for small numbers
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 20; j++) {
      if (i + j === target && `${i}+${j}`.length <= maxLength) {
        equations.push(`${i}+${j}`);
      }
      if (i - j === target && `${i}-${j}`.length <= maxLength) {
        equations.push(`${i}-${j}`);
      }
      if (i * j === target && `${i}*${j}`.length <= maxLength) {
        equations.push(`${i}*${j}`);
      }
      if (
        j !== 0 &&
        i % j === 0 &&
        i / j === target &&
        `${i}/${j}`.length <= maxLength
      ) {
        equations.push(`${i}/${j}`);
      }
    }
  }

  return [...new Set(equations)].slice(0, 10);
}
