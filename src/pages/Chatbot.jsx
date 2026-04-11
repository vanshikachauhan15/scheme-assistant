import { useCallback, useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'

function botReply(text) {
  const q = text.toLowerCase().trim()
  if (!q)
    return 'Type a message and send it — I can help with basic information about schemes (demo).'
  if (q.includes('pm-kisan') || q.includes('kis'))
    return 'PM-KISAN provides direct support to eligible farmer families. Official site: pmkisan.gov.in — use it for registration and status checks.'
  if (q.includes('health') || q.includes('ayushman') || q.includes('hospital'))
    return 'Ayushman Bharat PM-JAY offers cashless treatment coverage for eligible families. See pmjay.gov.in for your card and eligibility.'
  if (q.includes('awas') || q.includes('ghar') || q.includes('house'))
    return 'PMAY has separate tracks for urban and rural beneficiaries. Check pmaymis.gov.in and pmayg.nic.in depending on your area.'
  if (q.includes('namaste') || q.includes('hello') || q.includes('hi'))
    return 'Hi — I am Scheme Assistant. Ask for a scheme name or topic, for example health, farmers, or housing.'
  if (q.includes('kaise') || q.includes('apply') || q.includes('form'))
    return 'Each scheme uses its own official portal. Find a scheme on Home, then open its government website — you will see how to apply and which documents are needed.'
  return 'I am in demo mode. Search schemes on Home, or try keywords like PM-KISAN, health, or housing. Later you can plug in a real AI API here.'
}

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Hi! Ask anything about schemes — I will share basic guidance (demo).',
    },
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
      setMessages((m) => [...m, { role: 'bot', text: botReply(trimmed) }])
    }, 400)
  }

  return (
    <div className="page page-chat">
      <header className="page-hero page-hero--compact">
        <h1>Chatbot</h1>
        <p className="page-lead">Demo replies — connect your API here in production.</p>
      </header>

      <div className="chat-shell">
        <div className="chat-log" role="log" aria-live="polite" aria-relevant="additions">
          {messages.map((msg, i) => (
            <div key={`${i}-${msg.role}`} className={`chat-bubble chat-bubble--${msg.role}`}>
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
            placeholder="Type your message…"
            aria-label="Message"
            autoComplete="off"
          />
          <button type="submit" className="chat-send" aria-label="Send">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  )
}
