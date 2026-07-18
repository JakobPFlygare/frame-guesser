import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages the app is served from https://<user>.github.io/<repo>/,
// so assets must be referenced under that sub-path in production. Change this
// if you name the repository something other than "frame-guesser".
// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/frame-guesser/' : '/',
  plugins: [react()],
}))
