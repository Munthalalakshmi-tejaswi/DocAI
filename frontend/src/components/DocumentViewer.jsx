import React, { useState, useRef } from "react";
import {
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  FileText,
  LoaderCircle,
  Eye,
  FileCode,
} from "lucide-react";

export default function DocumentViewer({
  file,
  filename,
  totalPages = 1,
  pdfBlobUrl,
  onUpload,
  loading,
  sidebarCollapsed,
  onToggleSidebar,
}) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages || 1));

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.toLowerCase().endsWith(".pdf")) {
        onUpload(droppedFile);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="document-viewer-pane">
      {/* Top Header */}
      <div className="viewer-header">
        <div className="viewer-header-left">
          {sidebarCollapsed && (
            <button
              type="button"
              className="open-sidebar-btn"
              onClick={onToggleSidebar}
              title="Open sidebar"
            >
              <ChevronsRight size={18} />
            </button>
          )}
          <div className="viewer-title-group">
            <span className="viewer-doc-name" title={filename || "No document loaded"}>
              {filename || "No document loaded"}
            </span>
            {filename && <ChevronDown size={16} className="viewer-chevron" />}
          </div>
        </div>
      </div>

      {/* Sub-bar */}
      <div className="viewer-sub-bar">
        <span className="sub-bar-label">
          {filename
            ? `Active PDF Document • Page ${currentPage} of ${totalPages || 1}`
            : "Upload a PDF to view and analyze"}
        </span>
      </div>

      {/* Main Content Area */}
      <div
        className={`viewer-canvas-scroll ${dragActive ? "drag-active" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {loading ? (
          <div className="viewer-empty-state">
            <LoaderCircle size={42} className="spin text-blue" />
            <h3>Processing PDF with AI...</h3>
            <p>Extracting text, generating embeddings, and building search index.</p>
          </div>
        ) : !pdfBlobUrl ? (
          /* Empty / Upload Dropzone State */
          <div className="viewer-upload-dropzone" onClick={() => fileInputRef.current?.click()}>
            <div className="upload-circle-icon">
              <UploadCloud size={38} />
            </div>
            <h2>Upload your PDF</h2>
            <p className="upload-subtitle">
              Choose a PDF document or drag & drop to ask questions about its contents.
            </p>

            <button
              type="button"
              className="dropzone-browse-btn"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <FileText size={16} />
              <span>Choose PDF</span>
            </button>
            <span className="dropzone-note">PDF only • Up to 10 MB</span>
          </div>
        ) : (
          /* Real Native PDF Viewer */
          <div
            className="pdf-container"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          >
            <iframe
              src={`${pdfBlobUrl}#toolbar=0&navpanes=0&page=${currentPage}`}
              title="PDF Document Preview"
              className="pdf-iframe"
            />
          </div>
        )}
      </div>

      {/* Floating Bottom Toolbar (Only when document is active) */}
      {pdfBlobUrl && (
        <div className="viewer-floating-toolbar">
          <div className="toolbar-zoom-group">
            <button className="toolbar-btn" onClick={handleZoomOut} title="Zoom out">
              -
            </button>
            <span className="zoom-text">{zoom}%</span>
            <button className="toolbar-btn" onClick={handleZoomIn} title="Zoom in">
              +
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-page-group">
            <button
              className="toolbar-btn"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              title="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="page-text">
              {currentPage} / {totalPages || 1}
            </span>
            <button
              className="toolbar-btn"
              onClick={handleNextPage}
              disabled={currentPage >= (totalPages || 1)}
              title="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
