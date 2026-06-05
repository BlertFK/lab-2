export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-grid">
                <div>
                    <div className="footer-brand">UrbanKeys</div>
                    <p className="footer-tagline">Your trusted partner in finding the perfect home. Everyone deserves a place where they truly belong.</p>
                    <div className="footer-contact-item">📍 Muharrem Fejza, 10000, Pristine, Kosovo</div>
                    <div className="footer-contact-item">📞 049 123 465</div>
                    <div className="footer-contact-item">✉️ hello@urbankeys.com</div>
                </div>
                <div className="footer-col"><p className="footer-col-title">Company</p><a href="#">About Us</a><a href="#">Careers</a><a href="#">Press</a><a href="#">Blog</a></div>
                <div className="footer-col"><p className="footer-col-title">Services</p><a href="#">Buy Property</a><a href="#">Sell Property</a><a href="#">Rent a Home</a><a href="#">Find an Agent</a></div>
                <div className="footer-col">
                    <p className="footer-col-title">Stay in Touch</p>
                    <p style={{ fontSize: "0.87rem", marginBottom: "1rem", lineHeight: 1.6 }}>Get new listings and market updates to your inbox.</p>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <input placeholder="Your email" style={{ flex: 1, padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: "0.85rem", fontFamily: "DM Sans, sans-serif", outline: "none" }} />
                        <button style={{ background: "var(--primary)", border: "none", color: "#fff", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontFamily: "DM Sans, sans-serif" }}>Go →</button>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <span className="footer-copy">© 2026 UrbanKeys Inc. All rights reserved.</span>
                <div style={{ display: "flex", gap: "1.5rem" }}>
                    <a href="#" style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Privacy Policy</a>
                    <a href="#" style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Terms of Service</a>
                </div>
            </div>
        </footer>
    );
}