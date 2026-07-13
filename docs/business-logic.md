# Lógica de negocio (extraída del Excel real)

Fuente: `sample-data/JUNIO_11499_HJR__AGENTE_DE_SEGUROS_Y_DE_FIANZAS_SA_DE_CV.xlsx`, pestaña **MATRIZ** (tabla de Excel `Tabla2`).

## 1. Columnas calculadas por fila (fórmulas reales de Excel)

La hoja `MATRIZ` es una tabla plana de movimientos (una fila = una póliza/movimiento). Las columnas de la A a la AC (`FECHAMOVIMIENTO` ... `COBERTURA`) son datos crudos importados. Las columnas AD en adelante son **calculadas**:

| Columna | Fórmula (Excel, notación de Tabla) | Explicación |
|---|---|---|
| `EMISIÓN DELEGADA` | valor manual/importado por fila | Monto de emisión delegada de esa póliza (0 si no aplica). |
| `% BONO` | valor manual/importado por fila | Tasa de bono aplicable a esa fila (puede ser 0 o >0 dependiendo del ramo/agente). |
| `RAMOS NO PARTICIPANTES` | `=IF([% BONO]>0, 0, [IMP_PRIMA_NETA])` | Si la fila **no** participa en el bono (% BONO = 0), su prima neta completa se resta del cálculo aquí. |
| `EMI DEL` | `=[EMISIÓN DELEGADA]` | Copia directa de la columna anterior (se usa para el pivot). |
| `>10 TON` | `=IFERROR(SUMIF('CAM+10T'!G:G, [NOM_AGENTE], 'CAM+10T'!AD:AD) / COUNTIF(F:F, [NOM_AGENTE]), 0)` | Prorratea, entre el número de filas del agente, el descuento total del agente por camiones de más de 10 toneladas (viene de la hoja `CAM+10T`). |
| `ASISTENCIAS` | `=IFERROR(SUMIF(Tabla3[NOMBRE_AGENTE], [NOM_AGENTE], ASISTENCIA!AE:AE) / COUNTIF(F:F, [NOM_AGENTE]), 0)` | Igual que arriba pero para el costo de asistencias viales (hoja `ASISTENCIA`), prorrateado entre las filas del agente. |
| `PRIMA - DESC` | `=[IMP_PRIMA_NETA] - [>10 TON] - [ASISTENCIAS] - [RAMOS NO PARTICIPANTES]` | **Prima neta ya descontada** — es la base real sobre la que se calcula el bono. |
| `BONO` | `=[PRIMA - DESC] * [% BONO]` | Bono de esa fila individual (referencia, no es el que se usa en el reporte final — el reporte usa un % de grupo, ver sección 3). |
| `validar % bono` | columna de control/QA (generalmente 0) | Se usa para verificar consistencia; no forma parte del cálculo del reporte. |
| `AGRUPAMIENTO` | valor manual/importado por fila | A qué reporte de bono pertenece la fila: `JIRO CHIH`, `JIRO TOL`, `IVAN`, `JIRO`, `AUREN`, `AFLORES`, etc. **Este es el campo clave para filtrar qué filas van en cada reporte.** |

> Nota importante: `>10 TON` y `ASISTENCIAS` prorratean un total del agente entre TODAS sus filas (por eso el mismo número decimal se repite en varias filas de un mismo agente en el Excel, ej. `105.6842105263158`). Al replicar esto en la app, es más simple y equivalente calcular el total por agente una sola vez (de las hojas `CAM+10T` y `ASISTENCIA`) y aplicarlo como agregado al agrupar, en vez de prorratear fila por fila.

## 2. Pivot / reporte por Agrupamiento (lo que se ve en los PDF)

Cada PDF de bono (`sample-data/2026_BONO_MAYO_*.pdf`) es una tabla dinámica (pivot) de `MATRIZ` filtrada por `AGRUPAMIENTO`, agrupada por `RAMO` → `SUBRAMO`, sumando:

- `IMP_PRIMA_NETA`
- `RAMOS NO PARTICIPANTES`
- `>10 TON`
- `ASISTENCIAS`
- `PRIMA - DESC`
- `EMI DEL`

Con fila de "(en blanco)" para movimientos sin ramo (ej. depósitos bancarios) y fila `Total general` al final.

## 3. Bloque resumen (parte inferior del PDF)

```
PRIMA BASE        = Total general de PRIMA - DESC
<pct>%            = PRIMA BASE * pct        (pct varía por agrupamiento: 4%, 7%, 8%... ver nota abajo)
EMISIÓN DELEGADA  = Total general de EMI DEL
SUBTOTAL          = (PRIMA BASE * pct) + EMISIÓN DELEGADA
IVA               = SUBTOTAL * 0.16
TOTAL             = SUBTOTAL + IVA
```

**⚠️ Pendiente de confirmar con el usuario:** el `%` que se aplica en el resumen (4% en CHIH, 8% en TOLUCA, 7% en IVAN) **no siempre coincide** con la columna `% BONO` de la fila (que en los datos de muestra aparece como 0.08 constante). Esto sugiere que el % del resumen es una tasa **negociada por agrupamiento/mes**, capturada aparte (a mano, o en otra hoja no incluida en este extracto). La app debe permitir **configurar/editar el % por agrupamiento** antes de generar el reporte, en vez de asumir que siempre es 8%.

## 4. Segundo número en la página 2 del PDF

Cada PDF trae, en una segunda página, un número suelto (ej. Chihuahua: `$11,967.56`, Ivan: `$10,086.98`). No se pudo determinar la fórmula exacta a partir del extracto dado (no corresponde directamente a TOTAL, SUBTOTAL ni IVA). **Preguntar al usuario** qué representa este número antes de replicarlo (parece un neto a pagar o una comisión adicional).

## 5. Desglose por sub-agente (solo aparece en el reporte "IVAN")

El PDF de IVAN incluye una tabla adicional "AGRUPAMIENTO IVAN" que reparte la `PRIMA - DESC` total entre varios agentes/personas (ej. `GERARDO ABEL ZARAGOZA CONTRERAS`, `IVAN LEON VILLA`, etc.). Esto es, aparentemente, un `SUMIF` de `PRIMA - DESC` por `NOM_AGENTE` dentro del agrupamiento `IVAN`. Otros agrupamientos (CHIH, TOLUCA) no muestran este desglose en los PDF de ejemplo — confirmar si es exclusivo de IVAN o si aplica a todos y solo no se ve cuando hay un solo agente.

## 6. Hojas de soporte del Excel (no incluidas en detalle en este extracto, pero referenciadas por fórmulas)

- `CAM+10T`: catálogo/detalle de descuentos por camiones >10 toneladas, por agente.
- `ASISTENCIA`: catálogo/detalle de costos de asistencias viales, por agente (`Tabla3`, columna `NOMBRE_AGENTE`).
- `PARTICIPA`: probablemente cataloga qué RAMO/SUBRAMO participa o no en el bono (relacionado con `% BONO`).
- `Catálogo`: catálogo general (agentes, oficinas, etc.)

La app solo necesita leer `MATRIZ` para calcular el reporte, **siempre que** las columnas AD en adelante ya vengan calculadas en el archivo que suba el usuario cada mes (que es el caso en el archivo de muestra). Si el usuario quiere que la app calcule esas columnas desde cero (en vez de solo leerlas), habrá que parsear también `CAM+10T` y `ASISTENCIA` — **confirmar con el usuario** cuál de los dos flujos quiere:
  - **Flujo A (recomendado, más simple):** confiar en que `MATRIZ` ya trae las columnas AD-AM calculadas (como en el archivo de muestra) y la app solo pivotea/reporta.
  - **Flujo B (más completo, más trabajo):** la app recalcula todo desde las hojas crudas.
