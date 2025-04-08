import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'owlbear.local',
    port: 5173,
    https: {
      key: fs.readFileSync('./cert/key.pem'),
      cert: fs.readFileSync('./cert/cert.pem'),
    },
    cors: {
        origin: ['https://www.owlbear.rodeo'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      headers: {
        'Access-Control-Allow-Origin': 'https://www.owlbear.rodeo',
    },
  }
})
