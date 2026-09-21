import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import api from './routes/api.js'
import { ensureSchema } from './db/migrate.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'smart-inventory-api' })
})

app.use('/api', api)

// Serve frontend build in production
const distPath = path.join(__dirname, '../../dist')
app.use(express.static(distPath))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next()
  })
})

async function start() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }
  await ensureSchema()
  console.log('Database schema ready')
  app.listen(PORT, () => {
    console.log(`API listening on :${PORT}`)
  })
}

start().catch((e) => {
  console.error(e)
  process.exit(1)
})
