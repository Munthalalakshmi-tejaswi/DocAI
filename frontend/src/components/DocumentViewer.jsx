import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  FileText,
  LoaderCircle,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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
  const [totalNumPages, setTotalNumPages] = useState(totalPages || 1);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [renderError, setRenderError] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const pagesContainerRef = useRef(null);

  // Load PDF with PDF.js whenever file or pdfBlobUrl changes
  useEffect(() => {
    let active = true;

    async function loadPdf() {
      if (!file && !pdfBlobUrl) {
        setPdfDoc(null);
        setTotalNumPages(1);
        setCurrentPage(1);
        return;
      }

      setPdfLoading(true);
      setRenderError(false);

      try {
        let loadingTask;
        if (file && typeof file.arrayBuffer === "function") {
          const buffer = await file.arrayBuffer();
          loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
        } else {
          loadingTask = pdfjsLib.getDocument(pdfBlobUrl);
        }

        const doc = await loadingTask.promise;
        if (!active) return;

        setPdfDoc(doc);
        setTotalNumPages(doc.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error("PDF.js load error:", err);
        if (active) setRenderError(true);
      } finally {
        if (active) setPdfLoading(false);
      }
    }

    loadPdf();

    return () => {
      active = false;
    };
  }, [file, pdfBlobUrl]);

  // Synchronize currentPage when scrolling down or up the document
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !pdfDoc) return;

    const pageCards = container.querySelectorAll(".pdf-page-card");
    if (!pageCards.length) return;

    const containerTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const checkLine = containerTop + containerHeight * 0.35; // Trigger at 35% from the top

    let foundPage = 1;

    for (let i = 0; i < pageCards.length; i++) {
      const card = pageCards[i];
      const cardTop = card.offsetTop;
      const cardBottom = cardTop + card.clientHeight;

      if (cardTop <= checkLine && cardBottom >= checkLine) {
        foundPage = i + 1;
        break;
      } else if (cardTop > checkLine) {
        // Passed the line, break with previous page
        break;
      } else {
        foundPage = i + 1;
      }
    }

    setCurrentPage(foundPage);
  }, [pdfDoc]);

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 60));

  // Navigate to previous page on `<` click
  const handlePrevPage = () => {
    const targetPage = Math.max(currentPage - 1, 1);
    scrollToPage(targetPage);
  };

  // Navigate to next page on `>` click
  const handleNextPage = () => {
    const targetPage = Math.min(currentPage + 1, totalNumPages);
    scrollToPage(targetPage);
  };

  const scrollToPage = (pageNum) => {
    const card = document.getElementById(`pdf-page-card-${pageNum}`);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(pageNum);
    }
  };

  // Drag and drop handlers
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
            ? `Active PDF Document • Page ${currentPage} of ${totalNumPages || 1}`
            : "Upload a PDF to view and analyze"}
        </span>
      </div>

      {/* Main Content Scroll Area */}
      <div
        ref={containerRef}
        className={`viewer-canvas-scroll ${dragActive ? "drag-active" : ""}`}
        onScroll={handleScroll}
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

        {loading || pdfLoading ? (
          <div className="viewer-empty-state">
            <LoaderCircle size={42} className="spin text-blue" />
            <h3>Processing PDF with AI...</h3>
            <p>Rendering pages and building vector search index.</p>
          </div>
        ) : !pdfDoc && !pdfBlobUrl ? (
          /* Empty / Upload Dropzone State */
          <div
            className="viewer-upload-dropzone"
            onClick={() => fileInputRef.current?.click()}
          >
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
        ) : pdfDoc && !renderError ? (
          /* Real Continuous Multi-Page Canvas Viewer */
          <div
            ref={pagesContainerRef}
            className="pdf-pages-stream"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
            }}
          >
            {Array.from({ length: totalNumPages }, (_, idx) => (
              <PdfCanvasPage
                key={`page-${idx + 1}`}
                pageNumber={idx + 1}
                pdfDoc={pdfDoc}
              />
            ))}
          </div>
        ) : (
          /* Graceful Iframe Fallback */
          <div
            className="pdf-container"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
            }}
          >
            <iframe
              src={`${pdfBlobUrl}#toolbar=0&navpanes=0`}
              title="PDF Document Preview"
              className="pdf-iframe"
            />
          </div>
        )}
      </div>

      {/* Floating Bottom Toolbar with Working Page Indicator */}
      {(pdfDoc || pdfBlobUrl) && (
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
              type="button"
              className="toolbar-btn"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              title="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="page-text">
              {currentPage} / {totalNumPages || 1}
            </span>

            <button
              type="button"
              className="toolbar-btn"
              onClick={handleNextPage}
              disabled={currentPage >= (totalNumPages || 1)}
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

// Individual PDF Canvas Page Component
function PdfCanvasPage({ pageNumber, pdfDoc }) {
  const canvasRef = useRef(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let cancel = false;
    let renderTask = null;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancel) return;

        // Render at high resolution (1.4 scale) for crisp, clear text
        const viewport = page.getViewport({ scale: 1.4 });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
        });

        await renderTask.promise;
        if (!cancel) setRendered(true);
      } catch (err) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Page ${pageNumber} render error:`, err);
        }
      }
    }

    renderPage();

    return () => {
      cancel = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNumber]);

  return (
    <div
      id={`pdf-page-card-${pageNumber}`}
      className="pdf-page-card"
      data-page-number={pageNumber}
    >
      <canvas ref={canvasRef} className="pdf-page-canvas" />
      <div className="pdf-page-badge">{pageNumber}</div>
    </div>
  );
}
