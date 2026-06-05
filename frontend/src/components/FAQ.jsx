import { useState } from "react";

const FAQ_DATA = [
  { 
    q: "How do I schedule a physical viewing?", 
    a: "Once you find a property you love, click the 'View Details' button. You'll find a direct contact form for the listing agent or owner to coordinate a walkthrough at your convenience.",
    tag: "Viewings"
  },
  { 
    q: "Are all the properties on the platform verified?", 
    a: "Absolutely. Every listing undergoes a rigorous 24-hour verification process. We confirm property ownership and contact details to ensure a 100% secure browsing experience.",
    tag: "Safety"
  },
  { 
    q: "What documents are required to close a deal?", 
    a: "Typically, you'll need a government-issued ID, proof of financing (bank letter), and a signed preliminary agreement. Our team provides a checklist for every transaction.",
    tag: "Legal"
  },
  { 
    q: "Can I list my own property for sale or rent?", 
    a: "Yes! Simply create an account, click 'List Property', and follow our step-by-step uploader. Your listing will reach thousands of potential buyers instantly.",
    tag: "Selling"
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0); // Default first one open for better UI

  return (
    <section className="section faq-section">
      <div className="faq-wrapper">
        <div className="faq-info">
          <p className="section-label">Support Center</p>
          <h2 className="faq-main-title">Commonly Asked Questions</h2>
          <p className="faq-description">
            Everything you need to know about the platform and the property process. 
            Can't find the answer? <span className="text-link">Contact our support.</span>
          </p>
        </div>

        <div className="faq-list">
          {FAQ_DATA.map((item, index) => (
            <div 
              key={index} 
              className={`faq-card ${openIndex === index ? "active" : ""}`}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <div className="faq-head">
                <div className="faq-q-text">
                  <span className="faq-category">{item.tag}</span>
                  <h3>{item.q}</h3>
                </div>
                <div className="faq-toggle">
                  <div className="toggle-line" />
                  <div className="toggle-line vertical" />
                </div>
              </div>
              <div className="faq-body">
                <div className="faq-content">
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}