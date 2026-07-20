# CalcFast — Sitio de Calculadoras

## Estructura del proyecto

```
calcsite/
├── index.html                          ← Página principal
├── about.html                          ← Sobre nosotros (requerido AdSense)
├── privacy.html                        ← Política de privacidad (requerido AdSense)
├── contact.html                        ← Contacto (requerido AdSense)
├── css/
│   └── styles.css                      ← Estilos compartidos
├── js/
│   └── common.js                       ← Funciones compartidas
└── calculators/
    ├── TEMPLATE.html                   ← Copia esto para crear nuevas
    ├── financial/
    │   └── mortgage-calculator.html    ← Ejemplo financiera
    ├── math/
    │   └── percentage-calculator.html  ← Ejemplo matemática
    └── daily/
        └── bmi-calculator.html         ← Ejemplo vida diaria
```

## Cómo agregar una nueva calculadora

### Paso 1: Copiar el template
Copia `calculators/TEMPLATE.html` a la carpeta correcta:
- `calculators/financial/` → financieras
- `calculators/math/` → matemáticas
- `calculators/daily/` → vida diaria

Renómbralo: `nombre-calculator.html`

### Paso 2: Editar el archivo
Abre el template copiado y reemplaza todos los `[PLACEHOLDER]`:
1. Título y meta description (para Google)
2. Los inputs de la calculadora (los campos que el usuario llena)
3. Los resultados (lo que la calculadora muestra)
4. El contenido SEO (300-500 palabras explicando la calculadora)
5. Las FAQ (3-5 preguntas frecuentes)
6. La lógica de cálculo en el `<script>`

### Paso 3: Agregar la card en index.html
Busca la sección correspondiente en `index.html` y agrega:

```html
<a href="calculators/financial/tu-calculator.html" class="card">
  <div class="card-icon" style="background:#dbeafe;">🔢</div>
  <h3>Tu Calculator</h3>
  <p>Descripción corta de qué hace.</p>
  <span class="tag tag-live">Live</span>
</a>
```

### Paso 4: Subir a GitHub
```bash
git add .
git commit -m "add [nombre] calculator"
git push
```

Cloudflare actualiza automáticamente en 1-2 minutos.

## Funciones disponibles (common.js)

| Función | Qué hace | Ejemplo |
|---------|----------|---------|
| `val('id')` | Obtiene valor de un input | `val('price')` → `300000` |
| `out('id', texto)` | Escribe en un resultado | `out('total', '$500')` |
| `fmt(n)` | Formato dinero | `fmt(1234.5)` → `$1,234.50` |
| `fmtNum(n, dec)` | Formato número | `fmtNum(1234)` → `1,234` |
| `fmtPct(n)` | Formato porcentaje | `fmtPct(0.15)` → `15.00%` |
| `listen([ids], fn)` | Conecta inputs a función | `listen(['a','b'], calc)` |

## Checklist para cada nueva calculadora

- [ ] Título con keyword principal
- [ ] Meta description de 150-160 caracteres
- [ ] Calculadora funcionando correctamente
- [ ] Contenido SEO de 300+ palabras
- [ ] 3-5 FAQ relevantes
- [ ] Links a calculadoras relacionadas
- [ ] Card agregada en index.html
- [ ] Probada en móvil
