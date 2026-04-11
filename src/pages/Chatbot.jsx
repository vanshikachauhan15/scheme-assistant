import { useCallback, useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function botReply(text, t) {
  const q = text.toLowerCase().trim()
  if (!q) return t('chatbot.r_empty')
  if (
    q.includes('pm-kisan') ||
    q.includes('kis') ||
    q.includes('किसान') ||
    q.includes('pm kisan')
  )
    return t('chatbot.r_pmKisan')
  if (
    q.includes('health') ||
    q.includes('ayushman') ||
    q.includes('hospital') ||
    q.includes('स्वास्थ्य') ||
    q.includes('आयुष्मान')
  )
    return t('chatbot.r_health')
  if (
    q.includes('awas') ||
    q.includes('ghar') ||
    q.includes('house') ||
    q.includes('pmay') ||
    q.includes('आवास') ||
    q.includes('घर')
  )
    return t('chatbot.r_housing')
  if (
    q.includes('namaste') ||
    q.includes('hello') ||
    q.includes('hi') ||
    q.includes('नमस्ते') ||
    q.includes('hey')
  )
    return t('chatbot.r_greeting')
  if (
    q.includes('kaise') ||
    q.includes('apply') ||
    q.includes('form') ||
    q.includes('आवेदन') ||
    q.includes('फॉर्म')
  )
    return t('chatbot.r_apply')
  return t('chatbot.r_default')
}

export default function Chatbot() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState(() => [
    { role: 'bot', text: t('chatbot.welcome') },
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  function send() {
    const trimmed = input.trim()
    if (!trimmed) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: trimmed }])
    window.setTimeout(() => {
      setMessages((m) => [...m, { role: 'bot', text: botReply(trimmed, t) }])
    }, 400)
  }

  return (
    <div className="page page-chat">
      <header className="page-hero page-hero--compact">
        <h1>{t('chatbot.title')}</h1>
        <p className="page-lead">{t('chatbot.lead')}</p>
      </header>

      <div className="chat-shell">
        <div className="chat-log" role="log" aria-live="polite" aria-relevant="additions">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble chat-bubble--${msg.role}`}>
              {msg.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form
          className="chat-form"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chatbot.placeholder')}
            aria-label={t('chatbot.messageLabel')}
            autoComplete="off"
          />
          <button type="submit" className="chat-send" aria-label={t('chatbot.send')}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  )
}
