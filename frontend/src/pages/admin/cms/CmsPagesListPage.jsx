import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Plus, Edit2, Trash2, Globe, EyeOff } from "lucide-react";
import { apiClient } from "../../../lib/apiClient";
import { Card } from "../../../components/ui/Display";
import { Badge } from "../../../components/ui/Display";
import { Skeleton } from "../../../components/ui/Display";
import { EmptyState } from "../../../components/ui/Display";
import Button from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/Modal";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/FormControls";

export default function CmsPagesListPage({ onSelectPage }) {
  const qc = useQueryClient();

  const [createOpen, setCreateOpen]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ slug: "", title: "", meta_title: "", meta_description: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["cms-pages"],
    queryFn: () => apiClient.get("/cms/pages").then((d) => d.pages),
  });

  const createMutation = useMutation({
    mutationFn: (body) => apiClient.post("/cms/pages", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-pages"] });
      setCreateOpen(false);
      setForm({ slug: "", title: "", meta_title: "", meta_description: "" });
      toast.success("Page created.");
    },
    onError: (e) => toast.error(e?.message || "Failed to create page."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/cms/pages/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-pages"] });
      setDeleteTarget(null);
      toast.success("Page deleted.");
    },
    onError: (e) => toast.error(e?.message || "Failed to delete."),
  });

  const publishMutation = useMutation({
    mutationFn: (id) => apiClient.post(`/cms/pages/${id}/publish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-pages"] });
      toast.success("Page published.");
    },
    onError: (e) => toast.error(e?.message || "Failed to publish."),
  });

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>CMS Pages</h1>
        <Button leftIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          New Page
        </Button>
      </div>

      {isLoading ? (
        <Skeleton lines={6} height="48px" />
      ) : !data?.length ? (
        <EmptyState
          title="No pages yet"
          description="Create your first CMS page to get started."
          action={<Button onClick={() => setCreateOpen(true)}>Create page</Button>}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {data.map((page) => (
            <Card key={page.id} hoverable style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontWeight: 600 }}>{page.title}</span>
                  <Badge color={page.is_published ? "green" : "gray"}>
                    {page.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                  /{page.slug}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {!page.is_published && (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Globe size={14} />}
                    onClick={() => publishMutation.mutate(page.id)}
                    loading={publishMutation.isPending}
                  >
                    Publish
                  </Button>
                )}
                <Button
                variant="ghost"
                size="sm"
                leftIcon={<Edit2 size={14} />}
                onClick={() => onSelectPage(page.id)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 size={14} />}
                  onClick={() => setDeleteTarget(page)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create page modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New Page" size="md">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input
            label="Slug"
            placeholder="e.g. about-us"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          />
          <Input
            label="Title"
            placeholder="Page title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Input
            label="Meta Title"
            placeholder="SEO title (optional)"
            value={form.meta_title}
            onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
          />
          <Input
            label="Meta Description"
            placeholder="SEO description (optional)"
            value={form.meta_description}
            onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
          />
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              loading={createMutation.isPending}
              disabled={!form.slug || !form.title}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        title="Delete Page"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        danger
      />
    </div>
  );
}
