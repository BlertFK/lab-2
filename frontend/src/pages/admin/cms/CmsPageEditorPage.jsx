import { useState, useEffect, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import {
  selectSection, selectBlock, updateEditingContent, clearEditing,
} from "../../../features/cms/cmsSlice";
import { apiClient } from "../../../lib/apiClient";
import { Badge } from "../../../components/ui/Display";
import { Skeleton } from "../../../components/ui/Display";
import Button from "../../../components/ui/Button";
import { Input } from "../../../components/ui/FormControls";
import { Modal } from "../../../components/ui/Modal";
import { ChevronLeft, Globe, Save, Clock, Plus, Eye } from "lucide-react";
import FileUploader from "../../../components/ui/FileUploader";

const ReactQuill = lazy(() => import("react-quill"));

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const API_BASE    = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const UPLOADS_BASE = API_BASE.replace(/\/api$/, "");

export default function CmsPageEditorPage({ pageId, setPage }) {
  const id       = pageId;
  const dispatch = useDispatch();
  const qc       = useQueryClient();

  const { selectedSectionId, selectedBlockId, editingBlockContent, isDirty } =
    useSelector((s) => s.cms);

  const [versionsOpen, setVersionsOpen]       = useState(false);
  const [versions, setVersions]               = useState([]);
  const [newSectionName, setNewSectionName]   = useState("");
  const [addSectionOpen, setAddSectionOpen]   = useState(false);
  const [addBlockOpen, setAddBlockOpen]       = useState(false);
  const [newBlockKey, setNewBlockKey]         = useState("");
  const [newBlockType, setNewBlockType]       = useState("text");

  const { data: page, isLoading } = useQuery({
    queryKey: ["cms-page", id],
    queryFn: () => apiClient.get(`/cms/pages/${id}`).then((d) => d.page),
    enabled: !!id,
  });

  const selectedSection = page?.sections?.find((s) => s.id === selectedSectionId);
  const selectedBlock   = selectedSection?.blocks?.find((b) => b.id === selectedBlockId);

  // Auto-select first section on load
  useEffect(() => {
    if (page?.sections?.length && !selectedSectionId) {
      dispatch(selectSection(page.sections[0].id));
    }
  }, [page, selectedSectionId, dispatch]);

  // Save block draft
  const saveMutation = useMutation({
    mutationFn: ({ blockId, contentJson }) =>
      apiClient.put(`/cms/blocks/${blockId}`, { content_json: contentJson }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-page", id] });
      toast.success("Draft saved.");
      dispatch(clearEditing());
    },
    onError: (e) => toast.error(e?.message || "Save failed."),
  });

  // Publish entire page (auto-saves the current block first if there are unsaved changes)
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (isDirty && selectedBlockId && editingBlockContent) {
        await apiClient.put(`/cms/blocks/${selectedBlockId}`, { content_json: editingBlockContent });
        dispatch(clearEditing());
      }
      return apiClient.post(`/cms/pages/${id}/publish`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-page", id] });
      toast.success("Page published! Changes are now live.");
    },
    onError: (e) => toast.error(e?.message || "Publish failed."),
  });

  // Add block
  const addBlockMutation = useMutation({
    mutationFn: ({ sectionId, keyName, type }) =>
      apiClient.post(`/cms/sections/${sectionId}/blocks`, { key_name: keyName, type }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["cms-page", id] });
      setAddBlockOpen(false);
      setNewBlockKey("");
      setNewBlockType("text");
      toast.success("Block added.");
      if (data?.block) {
        const content = data.block.draft_json
          ? JSON.parse(data.block.draft_json)
          : {};
        dispatch(selectBlock({ blockId: data.block.id, content }));
      }
    },
    onError: (e) => toast.error(e?.message || "Failed to add block."),
  });

  // Add section
  const addSectionMutation = useMutation({
    mutationFn: (name) =>
      apiClient.post(`/cms/pages/${id}/sections`, {
        name,
        sort_order: (page?.sections?.length ?? 0) + 1,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-page", id] });
      setAddSectionOpen(false);
      setNewSectionName("");
      toast.success("Section added.");
    },
  });

  // Load versions for selected block
  const loadVersions = async (blockId) => {
    try {
      const data = await apiClient.get(`/cms/blocks/${blockId}/versions`);
      setVersions(data.versions || []);
      setVersionsOpen(true);
    } catch {
      toast.error("Could not load version history.");
    }
  };

  // Restore a version
  const restoreMutation = useMutation({
    mutationFn: ({ blockId, version }) =>
      apiClient.post(`/cms/blocks/${blockId}/restore/${version}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms-page", id] });
      setVersionsOpen(false);
      toast.success("Version restored as draft.");
    },
  });

  const handleBlockClick = (block) => {
    const content = block.draft_json
      ? JSON.parse(block.draft_json)
      : block.content_json
      ? JSON.parse(block.content_json)
      : {};
    dispatch(selectBlock({ blockId: block.id, content }));
  };

  const handleSave = () => {
    if (!selectedBlockId || !editingBlockContent) return;
    saveMutation.mutate({ blockId: selectedBlockId, contentJson: editingBlockContent });
  };

  const handleContentChange = (field, value) => {
    dispatch(updateEditingContent({ ...editingBlockContent, [field]: value }));
  };

  // Preview: fetch the published page content from the API and show it in a new tab
  // using a data URL so it doesn't depend on frontend routing
  const handlePreview = async () => {
    if (!page?.slug) return;
    try {
      const data = await apiClient.get(`/cms/pages/by-slug/${page.slug}`);
      const sections = data?.page?.sections || [];

      // Build a simple HTML preview
      let bodyHtml = `<h1 style="font-family:sans-serif;padding:32px 0 8px">${page.title}</h1>`;
      for (const section of sections) {
        bodyHtml += `<h2 style="font-family:sans-serif;margin-top:32px;color:#2563eb">${section.name}</h2>`;
        for (const block of section.blocks || []) {
          const content = block.rendered_json || {};
          if (block.type === "text") {
            bodyHtml += `<div style="font-family:sans-serif;line-height:1.7;margin-bottom:12px">${content.value || ""}</div>`;
          } else if (block.type === "image" && content.url) {
            bodyHtml += `<img src="${content.url}" style="max-width:100%;border-radius:8px;margin-bottom:12px" />`;
          } else if (block.type === "link") {
            bodyHtml += `<p style="font-family:sans-serif"><a href="${content.url || "#"}">${content.label || content.url}</a></p>`;
          } else if (block.type === "json") {
            bodyHtml += `<pre style="background:#f1f5f9;padding:16px;border-radius:8px;font-size:13px;overflow:auto">${JSON.stringify(content, null, 2)}</pre>`;
          }
        }
      }

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preview: ${page.title}</title>
        <style>body{max-width:900px;margin:0 auto;padding:40px 24px;background:#fff}h1{font-size:36px}h2{font-size:22px}</style>
        </head><body>
        <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px 20px;margin-bottom:32px;font-family:sans-serif;font-size:14px">
          ⚠️ This is a <strong>preview</strong> of the published content for <strong>/${page.slug}</strong>
        </div>
        ${bodyHtml}
        </body></html>`;

      const blob = new Blob([html], { type: "text/html" });
      const url  = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      toast.error("Could not load preview. Make sure the page is published.");
    }
  };

  if (!id) return <div style={{ padding: 32 }}>No page selected. Go back and click Edit on a page.</div>;
  if (isLoading) return <div style={{ padding: 32 }}><Skeleton lines={8} height="40px" /></div>;
  if (!page) return <div style={{ padding: 32 }}>Page not found.</div>;

  return (
    <div className="cms-editor">
      {/* Topbar */}
      <div className="cms-editor__topbar">
        <button
          className="btn-ghost"
          onClick={() => setPage("cms")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}
        >
          <ChevronLeft size={16} /> Pages
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontWeight: 600 }}>{page.title}</span>
          <Badge color={page.is_published ? "green" : "gray"}>
            {page.is_published ? "Published" : "Draft"}
          </Badge>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Eye size={14} />}
            onClick={handlePreview}
          >
            Preview
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Globe size={14} />}
            onClick={() => publishMutation.mutate()}
            loading={publishMutation.isPending}
          >
            Publish
          </Button>
        </div>
      </div>

      <div className="cms-editor__body">
        {/* Left: Section tree */}
        <aside className="cms-editor__sidebar">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Sections
            </span>
            <button className="uis-icon-btn" onClick={() => setAddSectionOpen(true)} aria-label="Add section">
              <Plus size={16} />
            </button>
          </div>

          {page.sections?.map((section) => (
            <button
              key={section.id}
              className={`cms-section-btn ${section.id === selectedSectionId ? "cms-section-btn--active" : ""}`}
              onClick={() => dispatch(selectSection(section.id))}
            >
              {section.name}
              <span className="cms-section-type">{section.type}</span>
            </button>
          ))}

          {!page.sections?.length && (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No sections yet. Add one using the + button.</p>
          )}
        </aside>

        {/* Middle: Block list */}
        <div className="cms-editor__blocks">
          {selectedSection ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontWeight: 600, margin: 0 }}>{selectedSection.name}</h3>
                <button className="uis-icon-btn" onClick={() => setAddBlockOpen(true)} aria-label="Add block">
                  <Plus size={16} />
                </button>
              </div>
              {selectedSection.blocks?.map((block) => (
                <button
                  key={block.id}
                  className={`cms-block-btn ${block.id === selectedBlockId ? "cms-block-btn--active" : ""}`}
                  onClick={() => handleBlockClick(block)}
                >
                  <div style={{ fontWeight: 500 }}>{block.key_name}</div>
                  <Badge color="gray">{block.type}</Badge>
                </button>
              ))}
              {!selectedSection.blocks?.length && (
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No blocks in this section.</p>
              )}
            </>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>Select a section to see its blocks.</p>
          )}
        </div>

        {/* Right: Block editor */}
        <div className="cms-editor__panel">
          {selectedBlock && editingBlockContent != null ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{selectedBlock.key_name}</div>
                  <Badge color="gray">{selectedBlock.type}</Badge>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Clock size={14} />}
                    onClick={() => loadVersions(selectedBlock.id)}
                  >
                    History
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<Save size={14} />}
                    onClick={handleSave}
                    loading={saveMutation.isPending}
                    disabled={!isDirty}
                  >
                    Save draft
                  </Button>
                </div>
              </div>

              {selectedBlock.type === "text" && (
                <Suspense fallback={<Skeleton lines={4} />}>
                  <ReactQuill
                    theme="snow"
                    modules={QUILL_MODULES}
                    value={editingBlockContent.value || ""}
                    onChange={(val) => handleContentChange("value", val)}
                  />
                </Suspense>
              )}

              {selectedBlock.type === "image" && (
                <div>
                  <p style={{ marginBottom: "12px", fontSize: 13, color: "var(--text-muted)" }}>
                    Current:{" "}
                    {editingBlockContent.url ? (
                      <a href={editingBlockContent.url} target="_blank" rel="noreferrer">View image</a>
                    ) : "None"}
                  </p>
                  <FileUploader
                    accept={["image/jpeg", "image/png", "image/webp"]}
                    onUpload={(file) => handleContentChange("url", `${UPLOADS_BASE}/uploads/${file.filename}`)}
                    entity="cms_blocks"
                    entityId={selectedBlock.id}
                  />
                </div>
              )}

              {selectedBlock.type === "link" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <Input
                    label="URL"
                    value={editingBlockContent.url || ""}
                    onChange={(e) => handleContentChange("url", e.target.value)}
                  />
                  <Input
                    label="Label"
                    value={editingBlockContent.label || ""}
                    onChange={(e) => handleContentChange("label", e.target.value)}
                  />
                </div>
              )}

              {selectedBlock.type === "json" && (
                <div>
                  <label className="uis-label">JSON Content</label>
                  <textarea
                    className="uis-input uis-textarea"
                    rows={12}
                    style={{ fontFamily: "monospace", fontSize: 13 }}
                    value={
                      typeof editingBlockContent === "string"
                        ? editingBlockContent
                        : JSON.stringify(editingBlockContent, null, 2)
                    }
                    onChange={(e) => {
                      try {
                        dispatch(updateEditingContent(JSON.parse(e.target.value)));
                      } catch {
                        // allow invalid JSON while typing
                      }
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <div style={{ color: "var(--text-muted)", padding: "48px 0", textAlign: "center" }}>
              Select a block on the left to edit it.
            </div>
          )}
        </div>
      </div>

      {/* Version history modal */}
      <Modal isOpen={versionsOpen} onClose={() => setVersionsOpen(false)} title="Version History" size="md">
        {versions.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No saved versions yet.</p>
        ) : (
          <ul style={{ display: "flex", flexDirection: "column", gap: "8px", listStyle: "none", padding: 0 }}>
            {versions.map((v) => (
              <li key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "6px" }}>
                <div>
                  <span style={{ fontWeight: 500 }}>v{v.version_number}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: "var(--text-muted)" }}>
                    {new Date(v.created_at).toLocaleString()}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => restoreMutation.mutate({ blockId: selectedBlockId, version: v.version_number })}
                  loading={restoreMutation.isPending}
                >
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {/* Add block modal */}
      <Modal isOpen={addBlockOpen} onClose={() => setAddBlockOpen(false)} title="Add Block" size="sm">
        <Input
          label="Key Name"
          value={newBlockKey}
          onChange={(e) => setNewBlockKey(e.target.value)}
          placeholder="e.g. title, hero_image, cta_link"
        />
        <div style={{ marginTop: "16px" }}>
          <label className="uis-label">Block Type</label>
          <select
            className="uis-input"
            value={newBlockType}
            onChange={(e) => setNewBlockType(e.target.value)}
            style={{ width: "100%", marginTop: "4px" }}
          >
            <option value="text">Text (rich text)</option>
            <option value="image">Image</option>
            <option value="link">Link</option>
            <option value="json">JSON</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
          <Button variant="ghost" onClick={() => setAddBlockOpen(false)}>Cancel</Button>
          <Button
            onClick={() => addBlockMutation.mutate({ sectionId: selectedSectionId, keyName: newBlockKey.trim(), type: newBlockType })}
            disabled={!newBlockKey.trim()}
            loading={addBlockMutation.isPending}
          >
            Add
          </Button>
        </div>
      </Modal>

      {/* Add section modal */}
      <Modal isOpen={addSectionOpen} onClose={() => setAddSectionOpen(false)} title="Add Section" size="sm">
        <Input
          label="Section Name"
          value={newSectionName}
          onChange={(e) => setNewSectionName(e.target.value)}
          placeholder="e.g. Hero"
        />
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
          <Button variant="ghost" onClick={() => setAddSectionOpen(false)}>Cancel</Button>
          <Button
            onClick={() => addSectionMutation.mutate(newSectionName)}
            disabled={!newSectionName.trim()}
            loading={addSectionMutation.isPending}
          >
            Add
          </Button>
        </div>
      </Modal>
    </div>
  );
}
