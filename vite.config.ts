import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Rutas relativas: permite hospedar en GitHub Pages (o cualquier subcarpeta)
  // sin tener que codificar el nombre del repo aquí.
  base: './',
})
