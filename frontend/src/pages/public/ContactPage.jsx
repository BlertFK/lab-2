import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";
import { Skeleton } from "../../components/ui/Display";
import { MapPin, Mail, Phone, Clock } from "lucide-react";

function getBlockValue(sections, keyName) {
  for (const section of sections || []) {
    const block = section.blocks?.find((b) => b.key_name === keyName);
    if (block?.rendered_json?.value) return block.rendered_json.value;
  }
  return null;
}

export default function ContactPage() {
  const { data: page, isLoading } = useQuery({
    queryKey: ["cms-public", "contact"],
    queryFn: () => apiClient.get("/cms/pages/by-slug/contact").then((d) => d.page),
    staleTime: 1000 * 60 * 5,
  });

  const sections = page?.sections || [];
  const header  = getBlockValue(sections, "header")  || "Get in Touch";
  const address = getBlockValue(sections, "address") || "Str. Nëna Terezë, Prishtina, Kosovo";
  const email   = getBlockValue(sections, "email")   || "info@urbankeys.local";
  const phone   = getBlockValue(sections, "phone")   || "+383 44 000 000";

  return (
    <div style={{ paddingTop: "100px", maxWidth: "900px", margin: "0 auto", padding: "120px 24px 80px" }}>
      {isLoading ? (
        <Skeleton lines={6} height="24px" />
      ) : (
        <>
          <h1 style={{ fontSize: "42px", fontWeight: 700, marginBottom: "48px" }}>{header}</h1>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {[
              { icon: <MapPin size={24} />, label: "Address", value: address },
              { icon: <Mail size={24} />,   label: "Email",   value: email },
              { icon: <Phone size={24} />,  label: "Phone",   value: phone },
              { icon: <Clock size={24} />,  label: "Hours",   value: "Mon–Fri, 09:00–17:00" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", gap: "16px", alignItems: "flex-start", padding: "28px", background: "var(--bg-surface)", borderRadius: "12px" }}>
                <div style={{ color: "var(--primary)", flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "4px" }}>{item.label}</div>
                  <div style={{ color: "var(--text-muted)" }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
