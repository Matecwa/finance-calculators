/* ═══════════════════════════════════════
   FUNCIONES COMUNES
   Estas funciones las puedes usar en
   cualquier calculadora.
   ═══════════════════════════════════════ */

// Formatear número como dinero: fmt(1234.5) → "$1,234.50"
function fmt(n) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Formatear número con comas: fmtNum(1234567) → "1,234,567"
function fmtNum(n, decimals = 0) {
  return n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Formatear porcentaje: fmtPct(0.056) → "5.60%"
function fmtPct(n) {
  return (n * 100).toFixed(2) + '%';
}

// Obtener valor numérico de un input: val('price') → 300000
function val(id) {
  return parseFloat(document.getElementById(id).value) || 0;
}

// Escribir texto en un elemento: out('monthly', '$1,500.00')
function out(id, text) {
  document.getElementById(id).textContent = text;
}

// Conectar inputs a una función de cálculo
// Uso: listen(['price', 'rate', 'term'], calcMortgage)
function listen(ids, calcFunction) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcFunction);
  });
  // Calcular al cargar
  calcFunction();
}
