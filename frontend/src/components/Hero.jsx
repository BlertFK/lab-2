export default function Hero({ setPage, user }) {
  return (
    <section className="hero">
      <div className="hero-bg" /><div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-badge">#1 Real Estate Platform</div>
        <h1 className="hero-title">Find Your<br /><span>Dream Home</span></h1>
        <p className="hero-sub">Discover thousands of properties for sale and rent. We connect buyers, sellers, and renters with the perfect space to call home.</p>
        <div className="hero-cta">
          <button className="btn-hero" onClick={() => document.getElementById("properties")?.scrollIntoView({ behavior: "smooth" })}>Browse Properties</button>
          {user
            ? <button className="btn-hero-outline" onClick={() => setPage("dashboard")}>My Dashboard →</button>
            : <button className="btn-hero-outline" onClick={() => setPage("register")}>List Your Property</button>}
        </div>
      </div>
      <div className="hero-stats">
        {[["12k+", "Listings"], ["8.5k", "Sold"], ["97%", "Satisfaction"], ["200+", "Cities"]].map(([n, l]) => (
          <div className="hero-stat" key={l}><div className="hero-stat-num">{n}</div><div className="hero-stat-label">{l}</div></div>
        ))}
      </div>
    </section>
  );
}