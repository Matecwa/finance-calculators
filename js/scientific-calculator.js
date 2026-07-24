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
  // Tracks whether "=" was just pressed with nothing typed since, so Save
  // can recover the full expression (equals collapses expr to just the result).
  let lastFullExpr = null;
  let justEvaluated = false;

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
      justEvaluated = false;
    } else if (action === 'backspace') {
      expr = removeLastToken(expr);
      justEvaluated = false;
    } else if (action === 'equals') {
      const result = tryEvaluate(expr);
      if (result === null) {
        exprEl.textContent = 'Error';
        previewEl.innerHTML = '&nbsp;';
        expr = '';
        justEvaluated = false;
        return;
      }
      // Keep the pre-collapse expression around so "Save" can still show
      // "25×8 = 200" in history after expr itself becomes just "200".
      lastFullExpr = expr;
      expr = formatResult(result);
      justEvaluated = true;
    } else if (value) {
      expr += value;
      justEvaluated = false;
    }

    render();
  });

  // ── History & Memory panel ──────────────────────────
  // Reuses expr / render() / tryEvaluate() / formatResult() from above —
  // no calculation logic is duplicated here.
  const HISTORY_KEY = 'sciCalcHistory';
  const HISTORY_LIMIT = 50;

  const historyListEl = document.getElementById('sciHistoryList');
  const historyEmptyEl = document.getElementById('sciHistoryEmpty');
  const saveBtn = document.getElementById('sciSaveBtn');
  const clearBtn = document.getElementById('sciHistoryClear');

  let history = loadHistory();

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistoryToStorage() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      // Private browsing / quota exceeded — history just won't persist.
    }
  }

  function renderHistory() {
    if (!historyListEl) return;
    historyListEl.innerHTML = '';

    const isEmpty = history.length === 0;
    if (historyEmptyEl) historyEmptyEl.hidden = !isEmpty;
    if (isEmpty) return;

    history.forEach(function (item) {
      const li = document.createElement('li');
      li.className = 'sci-history-item';
      li.dataset.result = item.result;
      li.tabIndex = 0;
      li.setAttribute('role', 'button');
      li.setAttribute('aria-label', 'Recall result ' + item.result);
      li.textContent = item.expr + ' = ' + item.result;
      historyListEl.appendChild(li);
    });
  }

  function addToHistory(exprText, resultText) {
    const mostRecent = history[0];
    if (mostRecent && mostRecent.expr === exprText && mostRecent.result === resultText) return;

    history.unshift({ expr: exprText, result: resultText });
    if (history.length > HISTORY_LIMIT) history = history.slice(0, HISTORY_LIMIT);

    saveHistoryToStorage();
    renderHistory();
  }

  function recallHistoryItem(item) {
    if (!item) return;
    expr = item.dataset.result;
    justEvaluated = false;
    lastFullExpr = null;
    render();
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      let exprToSave, resultToSave;

      if (justEvaluated && lastFullExpr !== null) {
        // "=" was just pressed — expr is now only the result, so pull the
        // full expression from before it collapsed.
        exprToSave = lastFullExpr;
        resultToSave = expr;
      } else {
        if (!expr.trim()) return;
        const result = tryEvaluate(expr);
        if (result === null) return;
        exprToSave = expr;
        resultToSave = formatResult(result);
      }

      addToHistory(exprToSave, resultToSave);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (history.length === 0) return;
      if (!confirm('Clear all calculator history? This cannot be undone.')) return;

      if (historyListEl) historyListEl.classList.add('sci-history-list--clearing');
      setTimeout(function () {
        history = [];
        saveHistoryToStorage();
        renderHistory();
        if (historyListEl) historyListEl.classList.remove('sci-history-list--clearing');
      }, 180);
    });
  }

  if (historyListEl) {
    historyListEl.addEventListener('click', function (e) {
      recallHistoryItem(e.target.closest('.sci-history-item'));
    });
    historyListEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const item = e.target.closest('.sci-history-item');
      if (!item) return;
      e.preventDefault();
      recallHistoryItem(item);
    });
  }

  renderHistory();
  render();
})();
