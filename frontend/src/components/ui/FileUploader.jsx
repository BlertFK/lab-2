import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Image } from "lucide-react";
import { clsx } from "clsx";
import { apiClient } from "../../lib/apiClient";
import { toast } from "react-toastify";

const MAX_MB   = parseInt(process.env.REACT_APP_UPLOAD_MAX_MB || "10");
const ALLOWED  = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/**
 * FileUploader - drag-drop, click-to-browse, upload progress, preview.
 * @param {string[]} accept - MIME types
 * @param {boolean} multiple
 * @param {number} maxSizeMb
 * @param {function} onUpload - called with uploaded file object from API
 * @param {string} entity - optional entity type for API
 * @param {number|string} entityId - optional entity id for API
 */
export default function FileUploader({
  accept = ALLOWED,
  multiple = false,
  maxSizeMb = MAX_MB,
  onUpload,
  entity,
  entityId,
  className,
}) {
  const [dragging, setDragging]   = useState(false);
  const [previews, setPreviews]   = useState([]);  // { file, url, progress, done, error }
  const inputRef = useRef(null);

  const validate = (file) => {
    if (!accept.includes(file.type)) {
      return `"${file.name}" type not allowed (${file.type}).`;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      return `"${file.name}" exceeds ${maxSizeMb} MB limit.`;
    }
    return null;
  };

  const uploadFile = useCallback(
    async (file, index) => {
      const err = validate(file);
      if (err) {
        toast.error(err);
        setPreviews((prev) => prev.map((p, i) => i === index ? { ...p, error: err } : p));
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      if (entity)   formData.append("entity",   entity);
      if (entityId) formData.append("entityId", entityId);

      try {
        const data = await apiClient.upload("/files/upload", formData, (pct) => {
          setPreviews((prev) =>
            prev.map((p, i) => i === index ? { ...p, progress: pct } : p)
          );
        });
        setPreviews((prev) =>
          prev.map((p, i) => i === index ? { ...p, progress: 100, done: true } : p)
        );
        onUpload && onUpload(data.file);
      } catch (e) {
        const msg = e?.message || "Upload failed.";
        toast.error(msg);
        setPreviews((prev) =>
          prev.map((p, i) => i === index ? { ...p, error: msg } : p)
        );
      }
    },
    [entity, entityId, onUpload]
  );

  const handleFiles = useCallback(
    (files) => {
      const list = Array.from(files);
      const startIdx = previews.length;
      const newPreviews = list.map((file) => ({
        file,
        url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        progress: 0,
        done: false,
        error: null,
      }));
      setPreviews((prev) => [...prev, ...newPreviews]);
      newPreviews.forEach((_, i) => uploadFile(list[i], startIdx + i));
    },
    [previews.length, uploadFile]
  );

  const removePreview = (i) => {
    setPreviews((prev) => {
      const p = prev[i];
      if (p.url) URL.revokeObjectURL(p.url);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  return (
    <div className={clsx("uis-uploader", className)}>
      <div
        className={clsx("uis-uploader__zone", dragging && "uis-uploader__zone--drag")}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <Upload size={32} className="uis-uploader__icon" />
        <p className="uis-uploader__label">
          Drag & drop or <span>browse</span>
        </p>
        <p className="uis-uploader__hint">
          {accept.join(", ")} — max {maxSizeMb} MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept.join(",")}
          multiple={multiple}
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {previews.length > 0 && (
        <ul className="uis-uploader__list">
          {previews.map((p, i) => (
            <li key={i} className={clsx("uis-uploader__item", p.error && "uis-uploader__item--error")}>
              <div className="uis-uploader__thumb">
                {p.url ? (
                  <img src={p.url} alt={p.file.name} />
                ) : (
                  <FileText size={24} />
                )}
              </div>
              <div className="uis-uploader__info">
                <span className="uis-uploader__name">{p.file.name}</span>
                {p.error ? (
                  <span className="uis-uploader__err">{p.error}</span>
                ) : p.done ? (
                  <span className="uis-uploader__done">✓ Uploaded</span>
                ) : (
                  <div className="uis-progress">
                    <div className="uis-progress__bar" style={{ width: `${p.progress}%` }} />
                  </div>
                )}
              </div>
              <button
                className="uis-uploader__remove"
                onClick={() => removePreview(i)}
                aria-label="Remove"
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
