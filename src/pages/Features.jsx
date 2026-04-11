import { Search, MessageCircle, Bell, FileCheck, Users, BookOpen } from 'lucide-react'

const items = [
  {
    icon: Search,
    title: 'Smart search',
    desc: 'Find schemes by keyword and category — live on the Home page.',
    status: 'Live',
  },
  {
    icon: MessageCircle,
    title: 'Chatbot',
    desc: 'Ask questions in natural language; connect real AI / RAG later.',
    status: 'Live',
  },
  {
    icon: FileCheck,
    title: 'Eligibility checker',
    desc: 'Filter by age, income, or state — placeholder for your own rules.',
    status: 'Planned',
  },
  {
    icon: Bell,
    title: 'Alerts',
    desc: 'Notifications for new schemes or deadlines — future feature.',
    status: 'Planned',
  },
  {
    icon: Users,
    title: 'Community Q&A',
    desc: 'Share experiences and tips — add with moderation when ready.',
    status: 'Idea',
  },
  {
    icon: BookOpen,
    title: 'Guides',
    desc: 'Step-by-step PDFs or articles on how to apply.',
    status: 'Idea',
  },
]

export default function Features() {
  return (
    <div className="page page-features">
      <header className="page-hero">
        <h1>Features</h1>
        <p className="page-lead">
          What works today and what you can add next — all in one overview.
        </p>
      </header>

      <ul className="feature-grid">
        {items.map((item) => {
          const { icon, title, desc, status } = item
          const FeatureIcon = icon
          return (
          <li key={title}>
            <article className="feature-card">
              <div className="feature-card-icon" aria-hidden>
                <FeatureIcon size={22} strokeWidth={2} />
              </div>
              <div className="feature-card-body">
                <div className="feature-card-top">
                  <h2>{title}</h2>
                  <span className={`feature-badge feature-badge--${status === 'Live' ? 'live' : 'soon'}`}>
                    {status}
                  </span>
                </div>
                <p>{desc}</p>
              </div>
            </article>
          </li>
          )
        })}
      </ul>
    </div>
  )
}
