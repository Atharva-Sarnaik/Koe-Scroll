import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { StatsProvider } from './context/StatsContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <StatsProvider>
          <App />
        </StatsProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)

