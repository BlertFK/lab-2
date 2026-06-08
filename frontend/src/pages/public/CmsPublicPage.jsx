import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";

function renderBlock(block) {
  const content = block.rendered_json || {};

  if (block.type === "text") {
    return (
      <div
        key={block.id}
        style={{ lineHeight: 1.8, marginBottom: 12, fontFamily: "'Segoe UI', sans-serif" }}
        dangerouslySetInnerHTML={{ __html: content.value || "" }}
      />
    );
  }

  if (block.type === "image" && content.url) {
    return (
      <img
        key={block.id}
        src={content.url}
        alt={content.alt || ""}
        style={{ maxWidth: "100%", borderRadius: 12, marginBottom: 16, display: "block" }}
      />
    );
  }

  if (block.type === "link" && content.url) {
    return (
      <p key={block.id} style={{ marginBottom: 12 }}>
        <a
          href={content.url}
          style={{ color: "#2563eb", fontWeight: 600, textDecoration: "underline" }}
        >
          {content.label || content.url}
        </a>
      </p>
    );
  }

  if (block.type === "json" && Array.isArray(content)) {
    // Render JSON arrays as FAQ-style lists (most common use case)
    return (
      <div key={block.id} style={{ marginBottom: 16 }}>
        {content.map((item, i) => (
          <div key={i} style={{ marginBottom: 20, padding: "16px 20px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            {item.question && (
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 16 }}>{item.question}</div>
            )}
            {item.answer && (
              <div style={{ color: "#475569", lineHeight: 1.7 }}>{item.answer}</div>
            )}
            {item.title && (
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
            )}
            {item.text && (
              <div style={{ color: "#475569" }}>{item.text}</div>
            )}
            {item.value && (
              <div style={{ fontSize: 32, fontWeight: 700, color: "#2563eb" }}>{item.value}</div>
            )}
            {item.label && !item.question && (
              <div style={{ color: "#64748b", fontSize: 13 }}>{item.label}</div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return null;
}

function renderSection(section) {
  if (!section.is_visible && section.is_visible !== undefined) return null;

  return (
    <section
      key={section.id}
      style={{ marginBottom: 56 }}
    >
      <h2 style={{
        fontSize: 26,
        fontWeight: 700,
        marginBottom: 20,
        color: "#1e293b",
        paddingBottom: 10,
        borderBottom: "2px solid #e2e8f0",
        fontFamily: "'Segoe UI', sans-serif",
      }}>
        {section.name}
      </h2>
      <div>
        {(section.blocks || []).map((block) => renderBlock(block))}
      </div>
    </section>
  );
}

export default function CmsPublicPage({ slug, setPage }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["cms-public-page", slug],
    queryFn: () => apiClient.get(`/cms/pages/by-slug/${slug}`).then((d) => d.page),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // Loading state
  if (isLoading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          <div style={{
            width: 40, height: 40, border: "3px solid #e2e8f0",
            borderTop: "3px solid #2563eb", borderRadius: "50%",
            animation: "spin 0.7s linear infinite", margin: "0 auto 16px",
          }} />
          Loading page...
        </div>
      </div>
    );
  }

  // Not found or error
  if (isError || !data) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>404</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Page not found</h1>
          <p style={{ color: "#64748b", marginBottom: 24 }}>
            The page <strong>/{slug}</strong> doesn't exist or hasn't been published yet.
          </p>
          <button
            onClick={() => setPage("home")}
            style={{ padding: "10px 24px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 15 }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Page header */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
        padding: "80px 24px 48px",
        color: "white",
        textAlign: "center",
      }}>
        <h1 style={{ fontSize: 42, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>
          {data.title}
        </h1>
        {data.meta_description && (
          <p style={{ marginTop: 12, fontSize: 18, opacity: 0.85, maxWidth: 600, margin: "12px auto 0" }}>
            {data.meta_description}
          </p>
        )}
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "56px 24px 80px" }}>
        {(data.sections || []).map((section) => renderSection(section))}

        {(!data.sections || data.sections.length === 0) && (
          <div style={{ textAlign: "center", color: "#94a3b8", padding: "80px 0" }}>
            This page has no content yet.
          </div>
        )}
      </div>
    </div>
  );
}
