import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { CookieProvider } from './context/CookieContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <CookieProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </CookieProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
)