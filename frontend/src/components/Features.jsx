export default function Features() {
  const feats = [
    { icon: "🏠", title: "Buy Property", desc: "Explore thousands of verified listings. Smart filters help you find the perfect home within your budget." },
    { icon: "💰", title: "Sell Property", desc: "List your property and reach millions of qualified buyers. Get the best market value with our pricing tools." },
    { icon: "🔒", title: "Trusted Platform", desc: "Every listing is verified and every transaction secured. We guarantee a transparent, worry-free process." },
  ];
  return (
    <section className="section" style={{ background: "var(--bg-surface)" }}>
      <p className="section-label">Why Choose Us</p>
      <h2 className="section-title">The Smarter Way to<br />Buy & Sell Real Estate</h2>
      <p className="section-sub">We've simplified every step of the real estate journey so you can focus on finding the life you love.</p>
      <div className="features-grid">
        {feats.map(f => (
          <div className="feature-card" key={f.title}>
            <div className="feature-icon">{f.icon}</div>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}