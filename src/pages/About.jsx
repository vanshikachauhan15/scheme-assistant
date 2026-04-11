export default function About() {
  return (
    <div className="page page-about">
      <header className="page-hero">
        <h1>About</h1>
        <p className="page-lead">
          Scheme Assistant helps you understand government schemes in plain language and discover
          options that may be relevant for you.
        </p>
      </header>

      <section className="page-section">
        <h2>What we do</h2>
        <ul className="page-list">
          <li>Explain schemes in simple language</li>
          <li>Surface relevant schemes through search and filters</li>
          <li>Offer quick answers via the chatbot (demo — you can connect AI later)</li>
        </ul>
      </section>

      <section className="page-section">
        <h2>Disclaimer</h2>
        <p>
          This tool is for guidance only. Always confirm final eligibility, documents, and how to
          apply on <strong>official government portals</strong> or through official helplines.
        </p>
      </section>
    </div>
  )
}
