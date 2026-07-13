import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))

export const SAMPLE_XLSX_PATH = path.resolve(
  here,
  '../../../sample-data/JUNIO_11499_HJR__AGENTE_DE_SEGUROS_Y_DE_FIANZAS_SA_DE_CV.xlsx',
)

export function readSampleWorkbook(): Uint8Array {
  return new Uint8Array(readFileSync(SAMPLE_XLSX_PATH))
}
