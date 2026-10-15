import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { GameProvider } from './game/GameContext'
import { AiProvider } from './ai/AiContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GameProvider>
        <AiProvider>
          <App />
        </AiProvider>
      </GameProvider>
    </BrowserRouter>
  </React.StrictMode>
)
