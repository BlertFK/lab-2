import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";
import { Skeleton } from "../../components/ui/Display";
import { ChevronDown, ChevronUp } from "lucide-react";

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between",
          alignItems: "center", padding: "20px 0", background: "none",
          border: "none", cursor: "pointer", textAlign: "left", fontWeight: 500, fontSize: "16px",
        }}
        aria-expanded={open}
      >
        {question}
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && (
        <p style={{ paddingBottom: "20px", color: "var(--text-muted)", lineHeight: 1.7 }}>
          {answer}
        </p>
      )}
    </div>
  );
}

export default function FaqPage() {
  const { data: page, isLoading } = useQuery({
    queryKey: ["cms-public", "faq"],
    queryFn: () => apiClient.get("/cms/pages/by-slug/faq").then((d) => d.page),
    staleTime: 1000 * 60 * 5,
  });

  // Extract FAQ items from CMS
  let faqs = [];
  for (const section of page?.sections || []) {
    for (const block of section.blocks || []) {
      if (block.key_name === "items" && Array.isArray(block.rendered_json)) {
        faqs = block.rendered_json;
      }
    }
  }

  // Fallback FAQs if CMS is empty
  if (!faqs.length && !isLoading) {
    faqs = [
      { question: "How do I list a property?", answer: "Register an account, go to My Properties and click Add Property." },
      { question: "Is listing free?", answer: "Basic listings are free. Upgrade your plan for premium placement and more listings." },
      { question: "How do I schedule a viewing?", answer: "Open any property page and click 'Request Viewing' to pick a time with the seller." },
      { question: "What areas do you cover?", answer: "We cover all major cities: Prishtina, Peja, Prizren, Gjakova, Mitrovica, and Ferizaj." },
    ];
  }

  return (
    <div style={{ padding: "120px 24px 80px", maxWidth: "760px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "42px", fontWeight: 700, marginBottom: "8px" }}>
        Frequently Asked Questions
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "48px" }}>
        Everything you need to know about UrbanKeys.
      </p>

      {isLoading ? (
        <Skeleton lines={8} height="20px" />
      ) : (
        <div>
          {faqs.map((faq, i) => (
            <FaqItem key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      )}
    </div>
  );
}
