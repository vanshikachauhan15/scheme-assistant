import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Send, Volume2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const API_BASE = (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

function getConversationId() {
  const key = 'scheme-assistant-chat-id'
  const current = localStorage.getItem(key)
  if (current) return current
  const created = `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`
  localStorage.setItem(key, created)
  return created
}

export default function Chatbot() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState(() => [
    { role: 'bot', text: t('chatbot.welcome') },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [voiceRecording, setVoiceRecording] = useState(false)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const recognitionRef = useRef(null)
  const utteranceRef = useRef(null)
  const conversationIdRef = useRef(getConversationId())
  const bottomRef = useRef(null)
  const [speakingIndex, setSpeakingIndex] = useState(null)

  const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    return () => {
      if (isSpeechSupported) {
        window.speechSynthesis.cancel()
      }
      try {
        recognitionRef.current?.stop()
      } catch {
        // no-op
      }
    }
  }, [isSpeechSupported])

  function normalizeBotText(text) {
    const trimmed = String(text || '').trim()
    if (!trimmed) return ''
    const hasLineBreak = /\r?\n/.test(trimmed)
    const dashGroups = (trimmed.match(/\s-\s/g) || []).length
    if (!hasLineBreak && dashGroups >= 2) {
      return trimmed.replace(/\s-\s/g, '\n- ')
    }
    return trimmed
  }

  function formatMessageParts(text) {
    const lines = normalizeBotText(text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    const parts = []
    let bulletBuffer = []
    lines.forEach((line) => {
      if (line.startsWith('- ')) {
        bulletBuffer.push(line.slice(2).trim())
        return
      }
      if (bulletBuffer.length) {
        parts.push({ type: 'list', items: bulletBuffer })
        bulletBuffer = []
      }
      parts.push({ type: 'line', text: line })
    })
    if (bulletBuffer.length) {
      parts.push({ type: 'list', items: bulletBuffer })
    }
    return parts
  }

  function speakBotMessage(text, index) {
    if (!isSpeechSupported) return
    const spokenText = normalizeBotText(text)
    if (!spokenText) return
    window.speechSynthesis.cancel()
    setSpeakingIndex(index)
    const utterance = new SpeechSynthesisUtterance(spokenText)
    utterance.lang = 'hi-IN'
    utterance.rate = 1
    utteranceRef.current = utterance
    utterance.onend = () => setSpeakingIndex(null)
    utterance.onerror = () => setSpeakingIndex(null)
    window.speechSynthesis.speak(utterance)
  }

  async function send() {
    const trimmed = input.trim()
    if (!trimmed || sending) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: trimmed }])
    setSending(true)
    try {
      const res = await fetch(`${API_BASE}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, conversation_id: conversationIdRef.current }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMessages((m) => [...m, { role: 'bot', text: String(data.response || t('chatbot.r_default')) }])
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'बैकेंड से कनेक्शन नहीं हो सका।' }])
    } finally {
      setSending(false)
    }
  }

  function getSpeechRecognitionCtor() {
    if (typeof window === 'undefined') return null
    return window.SpeechRecognition || window.webkitSpeechRecognition || null
  }

  function startRecognition() {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) return false
    try {
      const recognition = new Ctor()
      recognitionRef.current = recognition
      recognition.lang = 'hi-IN'
      recognition.interimResults = true
      recognition.continuous = true
      const baseText = input ? `${input} ` : ''
      let finalText = ''
      recognition.onresult = (event) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const transcript = event.results[i][0]?.transcript || ''
          if (event.results[i].isFinal) finalText += `${transcript} `
          else interim += transcript
        }
        setInput(`${baseText}${finalText}${interim}`.trim())
      }
      recognition.onerror = () => setVoiceRecording(false)
      recognition.onend = () => setVoiceRecording(false)
      recognition.start()
      setVoiceRecording(true)
      return true
    } catch {
      setVoiceRecording(false)
      return false
    }
  }

  async function transcribeFromBlob(blob) {
    const form = new FormData()
    form.append('audio', blob, 'voice.webm')
    const res = await fetch(`${API_BASE}/speech-to-text`, { method: 'POST', body: form })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const transcript = String(data.text || '').trim()
    if (!transcript) {
      setMessages((m) => [...m, { role: 'bot', text: 'आवाज समझ नहीं आई, कृपया फिर से बोलें।' }])
      return
    }
    setInput((prev) => `${prev ? `${prev} ` : ''}${transcript}`.trim())
  }

  function startRecording() {
    if (voiceRecording || sending) return
    if (startRecognition()) return
    const Ctor = window.MediaRecorder
    if (!Ctor || !navigator.mediaDevices?.getUserMedia) {
      setMessages((m) => [...m, { role: 'bot', text: 'इस ब्राउज़र में वॉइस रिकॉर्डिंग उपलब्ध नहीं है।' }])
      return
    }
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        chunksRef.current = []
        const rec = new Ctor(stream)
        mediaRef.current = rec
        rec.ondataavailable = (event) => {
          if (event.data?.size) chunksRef.current.push(event.data)
        }
        rec.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop())
          setVoiceRecording(false)
          const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
          setSending(true)
          try {
            await transcribeFromBlob(blob)
          } catch {
            setMessages((m) => [...m, { role: 'bot', text: 'वॉइस को टेक्स्ट में बदलने में त्रुटि हुई।' }])
          } finally {
            setSending(false)
          }
        }
        rec.start()
        setVoiceRecording(true)
      })
      .catch(() => {
        setMessages((m) => [...m, { role: 'bot', text: 'माइक्रोफ़ोन अनुमति नहीं मिली।' }])
      })
  }

  function stopRecording() {
    try {
      recognitionRef.current?.stop()
      mediaRef.current?.stop()
    } catch {
      setVoiceRecording(false)
    }
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
              <div className="chat-bubble__content">
                {formatMessageParts(msg.text).map((part, partIndex) =>
                  part.type === 'list' ? (
                    <ul key={partIndex} className="chat-bubble__list">
                      {part.items.map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={partIndex} className="chat-bubble__line">
                      {part.text}
                    </p>
                  ),
                )}
              </div>
              {msg.role === 'bot' && (
                <button
                  type="button"
                  className="chat-speak"
                  onClick={() => speakBotMessage(msg.text, i)}
                  aria-label="Listen to response"
                  title="Listen to response"
                  disabled={!isSpeechSupported}
                >
                  <Volume2 size={16} />
                  <span>{speakingIndex === i ? 'Playing...' : 'Listen'}</span>
                </button>
              )}
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
            disabled={sending}
          />
          <button
            type="button"
            className={`chat-voice${voiceRecording ? ' is-recording' : ''}`}
            onClick={() => (voiceRecording ? stopRecording() : startRecording())}
            aria-label={voiceRecording ? 'Stop voice' : 'Start voice'}
            disabled={sending}
          >
            {voiceRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button type="submit" className="chat-send" aria-label={t('chatbot.send')}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  )
}
