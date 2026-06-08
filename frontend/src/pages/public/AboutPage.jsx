import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";
import { Skeleton } from "../../components/ui/Display";

function getBlock(sections, sectionType, keyName) {
  const section = sections?.find((s) => s.type === sectionType || s.name.toLowerCase().includes(sectionType));
  const block = section?.blocks?.find((b) => b.key_name === keyName);
  return block?.rendered_json?.value || block?.rendered_json || null;
}

export default function AboutPage() {
  const { data: page, isLoading } = useQuery({
    queryKey: ["cms-public", "about"],
    queryFn: () => apiClient.get("/cms/pages/by-slug/about").then((d) => d.page),
    staleTime: 1000 * 60 * 5,
  });

  const sections = page?.sections || [];

  const story   = getBlock(sections, "mission", "body") || getBlock(sections, "story", "body");
  const mission = getBlock(sections, "mission", "content");

  return (
    <div style={{ paddingTop: "100px", maxWidth: "900px", margin: "0 auto", padding: "120px 24px 80px" }}>
      <h1 style={{ fontSize: "42px", fontWeight: 700, marginBottom: "16px" }}>About UrbanKeys</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "18px", marginBottom: "56px" }}>
        Kosovo's leading real-estate platform
      </p>

      {isLoading ? (
        <Skeleton lines={8} height="20px" />
      ) : (
        <>
          <section style={{ marginBottom: "56px" }}>
            <h2 style={{ fontSize: "26px", fontWeight: 600, marginBottom: "16px" }}>Our Story</h2>
            {story ? (
              <div className="cms-rich-text" dangerouslySetInnerHTML={{ __html: story }} />
            ) : (
              <p style={{ lineHeight: 1.8, color: "var(--text-muted)" }}>
                UrbanKeys was founded to make property search simple and transparent across Kosovo.
                We connect buyers, sellers, and agents on a single trusted platform.
              </p>
            )}
          </section>

          <section style={{ marginBottom: "56px" }}>
            <h2 style={{ fontSize: "26px", fontWeight: 600, marginBottom: "16px" }}>Our Mission</h2>
            {mission ? (
              <div className="cms-rich-text" dangerouslySetInnerHTML={{ __html: mission }} />
            ) : (
              <p style={{ lineHeight: 1.8, color: "var(--text-muted)" }}>
                To make real estate accessible, transparent, and stress-free for every Kosovar family.
              </p>
            )}
          </section>

          {/* Stats grid */}
          <section>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "24px" }}>
              {[
                { value: "5,000+", label: "Listings" },
                { value: "12,000+", label: "Happy clients" },
                { value: "6", label: "Major cities" },
                { value: "2020", label: "Founded" },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: "center", padding: "32px 16px", background: "var(--bg-surface)", borderRadius: "12px" }}>
                  <div style={{ fontSize: "36px", fontWeight: 700, color: "var(--primary)" }}>{stat.value}</div>
                  <div style={{ color: "var(--text-muted)", marginTop: "4px" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
