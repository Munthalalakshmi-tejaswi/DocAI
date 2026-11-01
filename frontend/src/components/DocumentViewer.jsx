import React, { useState, useRef } from "react";
import {
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
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
  highlightText,
}) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("preview"); // "preview" (iframe) or "reader" (text)
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages || 50));

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
        <div className="viewer-title-group">
          <span className="viewer-doc-name" title={filename || "Product Requirements Doc.pdf"}>
            {filename || "Product Requirements Doc.pdf"}
          </span>
          <ChevronDown size={16} className="viewer-chevron" />
        </div>
        <div className="viewer-header-right">
          {pdfBlobUrl && (
            <div className="view-mode-toggle">
              <button
                className={`toggle-btn ${viewMode === "preview" ? "active" : ""}`}
                onClick={() => setViewMode("preview")}
                title="Embedded PDF Viewer"
              >
                <Eye size={13} />
                <span>PDF View</span>
              </button>
              <button
                className={`toggle-btn ${viewMode === "reader" ? "active" : ""}`}
                onClick={() => setViewMode("reader")}
                title="Formatted Document Reader"
              >
                <FileCode size={13} />
                <span>Reader</span>
              </button>
            </div>
          )}
          <button className="viewer-collapse-btn">
            <ChevronsLeft size={16} />
          </button>
        </div>
      </div>

      {/* Sub-bar */}
      <div className="viewer-sub-bar">
        <span className="sub-bar-label">
          {filename ? `AI PDF Document • Page ${currentPage} of ${totalPages || 1}` : "AI Voice Changer PDF File...."}
        </span>
        <button className="sub-bar-action">
          <ChevronsLeft size={14} />
        </button>
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
            <p>Extracting text chunks, generating vector embeddings, and indexing.</p>
          </div>
        ) : !pdfBlobUrl ? (
          /* Empty / Upload Dropzone State */
          <div className="viewer-upload-dropzone" onClick={() => fileInputRef.current?.click()}>
            <div className="upload-circle-icon">
              <UploadCloud size={38} />
            </div>
            <h2>Upload your PDF</h2>
            <p className="upload-subtitle">
              Choose a document or drag & drop to ask questions about its contents.
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
        ) : viewMode === "preview" ? (
          /* Native PDF Iframe */
          <div className="pdf-container" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
            <iframe
              src={`${pdfBlobUrl}#toolbar=0&navpanes=0&page=${currentPage}`}
              title="PDF Document Preview"
              className="pdf-iframe"
            />
          </div>
        ) : (
          /* Clean Document Reader Mode with Highlighting */
          <div className="reader-sheet" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
            <h1 className="doc-h1">Getting started</h1>
            <p className="doc-desc">Learn more about your device and start using it.</p>

            <h2 className="doc-h2">Setting up your device</h2>
            <h3 className="doc-h3">Insert SIM card</h3>
            <ol className="doc-ol">
              <li>Insert the SIM Tray Ejector into the small hole on the SIM card holder. Press the ejector firmly into the hole to push the SIM card tray out.</li>
              <li>Slowly pull the SIM card tray out of the tray slot.</li>
              <li>Place the SIM card into the SIM card tray.</li>
              <li>Plug the SIM card tray back into your device.</li>
            </ol>
            <p className="doc-footnote">* Use the original Nano-SIM card. Non-original cards may cause damage.</p>

            <h3 className="doc-h3">Booting up your OnePlus device</h3>
            <p className="doc-p">Press and hold the power button for a few seconds to boot up the phone. If your phone does not power on, you may need to charge it.</p>

            <h3 className="doc-h3">Setup Wizard</h3>
            <p className="doc-p">
              When you first boot up the phone (or after a factory reset), the{" "}
              <mark className="doc-highlight">Setup Wizard</mark> lets you customize all features, including language, software buttons, gestures, fingerprint unlock, and other features. If you want to change these later, you can do so after setting up the phone in the Settings app.
            </p>

            <h2 className="doc-h2">Battery and charging</h2>
            <p className="doc-p">You will need to charge the phone when you first get it or if you have not used it for a long time.</p>

            <h3 className="doc-h3">Safety Information</h3>
            <ol className="doc-ol">
              <li>To ensure your safety and avoid damaging the device, only use the official charger and USB cable.</li>
              <li>OnePlus device supports the USB Type-C cable.</li>
              <li>Unplug the charger after you finish charging to avoid wasting electricity.</li>
              <li>Do not place anything on your phone while it is charging.</li>
            </ol>
          </div>
        )}
      </div>

      {/* Floating Bottom Toolbar */}
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
              {currentPage} / {totalPages || 50}
            </span>
            <button
              className="toolbar-btn"
              onClick={handleNextPage}
              disabled={currentPage >= (totalPages || 50)}
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
