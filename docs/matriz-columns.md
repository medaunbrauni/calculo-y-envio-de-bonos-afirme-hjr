# Diccionario de columnas — hoja `MATRIZ`

| # | Columna | Tipo | Notas |
|---|---|---|---|
| A | FECHAMOVIMIENTO | fecha | |
| B | OFICINA | texto | ej. "ZONA MEXICO" |
| C | CLASIFICACION | texto/num | |
| D | NOM_SUPERVISORIA | texto | Razón social de la supervisoría (agente maestro) |
| E | ID_AGENTE | número | |
| F | NOM_AGENTE | texto | Nombre del agente — clave para prorrateos |
| G | NUM_POLIZA | texto | |
| H | NUM_ENDOSO | texto | |
| I | NUM_FOLIO_RBO | número | |
| J | FORMA_PAGO | texto | |
| K | ID_RAMO_CONTABLE | texto | |
| L | ID_SUBR_CONTABLE | texto | |
| M | RAMO | texto | Nivel 1 del pivot |
| N | SUBRAMO | texto | Nivel 2 del pivot |
| O | PARTICIPA | texto | `"PARTICIPA "` o `"NO PARTICIPA"` (nota el espacio final en "PARTICIPA ") |
| P | DESC_MONEDA | texto | |
| Q | CONTRATANTE | texto | |
| R | IMP_PRIMA_NETA | moneda | Base del cálculo |
| S | IMP_RCGOS_PAGOFR | moneda | |
| T | IMP_PRIMA_TOTAL | moneda | |
| U | PCT_COMIS_AGTE | % | |
| V | SDO_INICIAL | moneda | |
| W | IMP_COMIS_AGTE | moneda | |
| X | IMP_IVA_ACRED | moneda | |
| Y | IMP_IVA_RET | moneda | |
| Z | IMP_ISR | moneda | |
| AA | IMP_RET_EST | moneda | |
| AB | DESC_MOVTO | texto | |
| AC | COBERTURA | texto | ej. "AMPLIA", "BASICO" |
| AD | EMISIÓN DELEGADA | moneda | dato de entrada |
| AE | % BONO | % | dato de entrada, por fila |
| AF | RAMOS NO PARTICIPANTES | moneda | **calculada**, ver business-logic.md |
| AG | EMI DEL | moneda | **calculada** (copia de AD) |
| AH | >10 TON | moneda | **calculada**, prorrateo |
| AI | ASISTENCIAS | moneda | **calculada**, prorrateo |
| AJ | PRIMA - DESC | moneda | **calculada**, base real del bono |
| AK | BONO | moneda | **calculada**, referencia por fila |
| AL | validar % bono | número | control/QA |
| AM | AGRUPAMIENTO | texto | **clave de filtrado del reporte** |

## Valores observados de `AGRUPAMIENTO` en el archivo de muestra
`JIRO`, `JIRO CHIH`, `JIRO TOL`, `IVAN`, `AUREN`, `AFLORES`

Cada uno de estos corresponde a un PDF de bono distinto (uno por agrupamiento, por mes).
