import 'dotenv/config'
import type { Request, Response, NextFunction } from 'express'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
import authRouter from './routes/auth.js'
import sessionsRouter from './routes/sessions.js'
import { isAuthenticated } from './middleware/isAuthenticated.js'

const app = express()
const PORT = process.env.PORT || 3000

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200,
  credentials:true
}

app.use(cors(corsOptions))
app.use(express.json())

app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false
}))

app.use('/auth', authRouter)
app.use('/sessions', sessionsRouter)

app.use((err:Error, _req:Request, res:Response, _next:NextFunction) => {
  console.error(err.stack)
  console.error(err)  
  res.status(500).json({ error : "Internal Server Error" })
})

if (process.env.NODE_ENV === 'test') {
  app.get('/test-protected', isAuthenticated, (req: Request, res: Response) => {
    res.status(200).json({message: 'authenticated'})
  })
}

export default app

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`)
  })
}