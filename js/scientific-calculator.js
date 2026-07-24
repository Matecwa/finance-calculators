/* ═══════════════════════════════════════
   SCIENTIFIC CALCULATOR (HOME)

   Builds an expression from button clicks and evaluates it with a small
   hand-written tokenizer + recursive-descent parser instead of eval(),
   so no arbitrary code can ever run from the input.

   Notes on conventions used here:
   - sin/cos/tan take degrees (the everyday expectation for a basic calc).
   - log = base 10, ln = natural log, exp(x) = e^x.
   - % is infix modulo (consistent with ^ being an infix operator).
   - ^ is right-associative (2^3^2 = 2^(3^2)).
   ═══════════════════════════════════════ */
(function () {
  const calc = document.getElementById('sciCalc');
  if (!calc) return;

  const exprEl = document.getElementById('sciExpr');
  const previewEl = document.getElementById('sciPreview');
  const FUNC_TOKENS = ['sin(', 'cos(', 'tan(', 'log(', 'ln(', 'exp(', '√('];

  let expr = '';

  function toRadians(deg) {
    return (deg * Math.PI) / 180;
  }

  function factorial(n) {
    if (n < 0 || Math.abs(n - Math.round(n)) > 1e-9) {
      throw new Error('Factorial requires a non-negative integer');
    }
    n = Math.round(n);
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }

  function applyFunc(name, x) {
    switch (name) {
      case 'sin': return Math.sin(toRadians(x));
      case 'cos': return Math.cos(toRadians(x));
      case 'tan': return Math.tan(toRadians(x));
      case 'log':
        if (x <= 0) throw new Error('Math error');
        return Math.log10 ? Math.log10(x) : Math.log(x) / Math.LN10;
      case 'ln':
        if (x <= 0) throw new Error('Math error');
        return Math.log(x);
      case 'exp': return Math.exp(x);
      case 'sqrt':
        if (x < 0) throw new Error('Math error');
        return Math.sqrt(x);
      default:
        throw new Error('Unknown function: ' + name);
    }
  }

  // ── Tokenizer ──────────────────────────
  function tokenize(str) {
    const tokens = [];
    const funcWords = ['sin', 'cos', 'tan', 'log', 'ln', 'exp'];
    let i = 0;

    while (i < str.length) {
      const ch = str[i];

      if (ch === ' ') { i++; continue; }

      if (ch === '√') { tokens.push({ type: 'func', value: 'sqrt' }); i++; continue; }
      if (ch === 'π') { tokens.push({ type: 'num', value: Math.PI }); i++; continue; }
      if (ch === '×') { tokens.push({ type: 'op', value: '*' }); i++; continue; }
      if (ch === '÷') { tokens.push({ type: 'op', value: '/' }); i++; continue; }

      if (/[0-9.]/.test(ch)) {
        let j = i;
        while (j < str.length && /[0-9.]/.test(str[j])) j++;
        const raw = str.slice(i, j);
        if ((raw.match(/\./g) || []).length > 1) throw new Error('Malformed number');
        tokens.push({ type: 'num', value: parseFloat(raw) });
        i = j;
        continue;
      }

      if (/[a-zA-Z]/.test(ch)) {
        let j = i;
        while (j < str.length && /[a-zA-Z]/.test(str[j])) j++;
        const word = str.slice(i, j);
        if (funcWords.indexOf(word) !== -1) {
          tokens.push({ type: 'func', value: word });
        } else if (word === 'e') {
          tokens.push({ type: 'num', value: Math.E });
        } else {
          throw new Error('Unknown token: ' + word);
        }
        i = j;
        continue;
      }

      if ('+-*/%^()!'.indexOf(ch) !== -1) {
        tokens.push({ type: 'op', value: ch });
        i++;
        continue;
      }

      throw new Error('Unexpected character: ' + ch);
    }

    return tokens;
  }

  // ── Recursive-descent parser / evaluator ──────────────────────────
  // expression := term (('+'|'-') term)*
  // term       := factor (('*'|'/'|'%') factor)*
  // factor     := unary ('^' factor)?              (right-associative)
  // unary      := ('-'|'+') unary | postfix
  // postfix    := primary ('!')*
  // primary    := number | func '(' expression ')' | '(' expression ')'
  function evaluate(tokens) {
    let pos = 0;
    const peek = () => tokens[pos];
    const atEnd = () => pos >= tokens.length;
    const isOp = (v) => !atEnd() && peek().type === 'op' && peek().value === v;

    function expectOp(v) {
      if (!isOp(v)) throw new Error('Expected "' + v + '"');
      pos++;
    }

    function parseExpression() {
      let value = parseTerm();
      while (isOp('+') || isOp('-')) {
        const op = tokens[pos++].value;
        const rhs = parseTerm();
        value = op === '+' ? value + rhs : value - rhs;
      }
      return value;
    }

    function parseTerm() {
      let value = parseFactor();
      while (isOp('*') || isOp('/') || isOp('%')) {
        const op = tokens[pos++].value;
        const rhs = parseFactor();
        if (op === '*') value *= rhs;
        else if (op === '/') {
          if (rhs === 0) throw new Error('Division by zero');
          value /= rhs;
        } else {
          value %= rhs;
        }
      }
      return value;
    }

    function parseFactor() {
      const base = parseUnary();
      if (isOp('^')) {
        pos++;
        return Math.pow(base, parseFactor());
      }
      return base;
    }

    function parseUnary() {
      if (isOp('-')) { pos++; return -parseUnary(); }
      if (isOp('+')) { pos++; return parseUnary(); }
      return parsePostfix();
    }

    function parsePostfix() {
      let value = parsePrimary();
      while (isOp('!')) { pos++; value = factorial(value); }
      return value;
    }

    function parsePrimary() {
      if (atEnd()) throw new Error('Unexpected end of expression');
      const token = tokens[pos++];
      if (token.type === 'num') return token.value;
      if (token.type === 'func') {
        expectOp('(');
        const arg = parseExpression();
        expectOp(')');
        return applyFunc(token.value, arg);
      }
      if (token.type === 'op' && token.value === '(') {
        const value = parseExpression();
        expectOp(')');
        return value;
      }
      throw new Error('Unexpected token');
    }

    const value = parseExpression();
    if (!atEnd()) throw new Error('Unexpected trailing input');
    return value;
  }

  function tryEvaluate(str) {
    if (!str.trim()) return null;
    try {
      const value = evaluate(tokenize(str));
      return isFinite(value) ? value : null;
    } catch (e) {
      return null;
    }
  }

  function formatResult(n) {
    if (Math.abs(n) < 1e-12) n = 0;
    return (Math.round(n * 1e10) / 1e10).toString();
  }

  function removeLastToken(str) {
    for (const t of FUNC_TOKENS) {
      if (str.endsWith(t)) return str.slice(0, -t.length);
    }
    return str.slice(0, -1);
  }

  function render() {
    exprEl.textContent = expr === '' ? '0' : expr;
    const preview = tryEvaluate(expr);
    previewEl.innerHTML = preview === null ? '&nbsp;' : '= ' + formatResult(preview);
  }

  calc.addEventListener('click', function (e) {
    const btn = e.target.closest('.sci-btn');
    if (!btn) return;

    const action = btn.dataset.action;
    const value = btn.dataset.value;

    if (action === 'clear') {
      expr = '';
    } else if (action === 'backspace') {
      expr = removeLastToken(expr);
    } else if (action === 'equals') {
      const result = tryEvaluate(expr);
      if (result === null) {
        exprEl.textContent = 'Error';
        previewEl.innerHTML = '&nbsp;';
        expr = '';
        return;
      }
      expr = formatResult(result);
    } else if (value) {
      expr += value;
    }

    render();
  });

  render();
})();
