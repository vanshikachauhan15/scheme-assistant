import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n.js'
import './index.css'
import Root from './Root.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
