// Tiny, safe arithmetic expression evaluator (no eval / Function).
// Supports + - * / , parentheses, decimals and unary minus.

type Token = { type: "num"; value: number } | { type: "op"; value: string };

function tokenize(input: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === " " || ch === "\t" || ch === ",") {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < input.length && /[0-9.]/.test(input[j])) j++;
      const raw = input.slice(i, j);
      if ((raw.match(/\./g) ?? []).length > 1) return null;
      const num = Number(raw);
      if (!isFinite(num)) return null;
      tokens.push({ type: "num", value: num });
      i = j;
      continue;
    }
    if ("+-*/()".includes(ch)) {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }
    return null;
  }
  return tokens;
}

// Recursive-descent parser.
function parseTokens(tokens: Token[]): number | null {
  let pos = 0;

  function peek(): Token | undefined {
    return tokens[pos];
  }
  function eatOp(...ops: string[]): string | null {
    const t = peek();
    if (t && t.type === "op" && ops.includes(t.value)) {
      pos++;
      return t.value;
    }
    return null;
  }

  function parsePrimary(): number | null {
    const t = peek();
    if (!t) return null;
    if (t.type === "op" && (t.value === "-" || t.value === "+")) {
      pos++;
      const v = parsePrimary();
      if (v === null) return null;
      return t.value === "-" ? -v : v;
    }
    if (t.type === "op" && t.value === "(") {
      pos++;
      const v = parseExpr();
      if (v === null) return null;
      if (!eatOp(")")) return null;
      return v;
    }
    if (t.type === "num") {
      pos++;
      return t.value;
    }
    return null;
  }

  function parseTerm(): number | null {
    let left = parsePrimary();
    if (left === null) return null;
    for (;;) {
      const op = eatOp("*", "/");
      if (!op) return left;
      const right = parsePrimary();
      if (right === null) return null;
      if (op === "/" && right === 0) return null;
      left = op === "*" ? left * right : left / right;
    }
  }

  function parseExpr(): number | null {
    let left = parseTerm();
    if (left === null) return null;
    for (;;) {
      const op = eatOp("+", "-");
      if (!op) return left;
      const right = parseTerm();
      if (right === null) return null;
      left = op === "+" ? left + right : left - right;
    }
  }

  const result = parseExpr();
  if (result === null || pos !== tokens.length) return null;
  return result;
}

/**
 * Evaluates an arithmetic expression string.
 * Returns null when the expression is invalid.
 */
export function evaluateExpression(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const tokens = tokenize(trimmed);
  if (!tokens || tokens.length === 0) return null;
  const value = parseTokens(tokens);
  if (value === null || !isFinite(value)) return null;
  return Math.round(value * 100) / 100;
}
