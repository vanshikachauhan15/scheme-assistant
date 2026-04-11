import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Chatbot from './pages/Chatbot.jsx'
import Features from './pages/Features.jsx'
import './App.css'

function ChatbotWithLangKey() {
  const { i18n } = useTranslation()
  return <Chatbot key={i18n.language} />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="chatbot" element={<ChatbotWithLangKey />} />
          <Route path="features" element={<Features />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
