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
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export default function DocumentViewer({
  file,
  filename,
  totalPages: propTotalPages = 1,
  pdfBlobUrl,
  onUpload,
  loading,
  sidebarCollapsed,
  onToggleSidebar,
}) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(propTotalPages || 1);
  const [dragActive, setDragActive] = useState(false);
  const [renderingPdf, setRenderingPdf] = useState(false);
  const [renderError, setRenderError] = useState(false);
  const [renderedPages, setRenderedPages] = useState([]);

  const fileInputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const pageRefs = useRef({});
  const isNavigatingByClick = useRef(false);

  // Sync propTotalPages
  useEffect(() => {
    if (propTotalPages && propTotalPages > 1) {
      setTotalPages(propTotalPages);
    }
  }, [propTotalPages]);

  // Render PDF pages using PDF.js
  useEffect(() => {
    if (!pdfBlobUrl) {
      setRenderedPages([]);
      setCurrentPage(1);
      return;
    }

    let isMounted = true;
    setRenderingPdf(true);
    setRenderError(false);
    setCurrentPage(1);

    async function loadAndRenderPdf() {
      try {
        const loadingTask = pdfjsLib.getDocument(pdfBlobUrl);
        const pdf = await loadingTask.promise;

        if (!isMounted) return;

        const numPages = pdf.numPages;
        setTotalPages(numPages);

        const pagesList = Array.from({ length: numPages }, (_, i) => i + 1);
        setRenderedPages(pagesList);
        setRenderingPdf(false);

        // Render each page into its canvas
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          if (!isMounted) break;
          try {
            const page = await pdf.getPage(pageNum);
            // Render at high resolution (1.5x) for crisp text
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = pageRefs.current[pageNum];
            if (canvas) {
              const context = canvas.getContext("2d");
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              const renderContext = {
                canvasContext: context,
                viewport: viewport,
              };
              await page.render(renderContext).promise;
            }
          } catch (pageErr) {
            console.error(`Error rendering page ${pageNum}:`, pageErr);
          }
        }
      } catch (err) {
        console.error("PDF.js render error, fallback to iframe:", err);
        if (isMounted) {
          setRenderError(true);
          setRenderingPdf(false);
        }
      }
    }

    loadAndRenderPdf();

    return () => {
      isMounted = false;
    };
  }, [pdfBlobUrl]);

  // IntersectionObserver to detect which page is in view when scrolling
  useEffect(() => {
    if (renderedPages.length === 0 || renderError) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // If the user clicked the arrow, skip updating until scroll finishes
        if (isNavigatingByClick.current) return;

        // Find the entry that has the highest intersection ratio
        let bestEntry = null;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
              bestEntry = entry;
            }
          }
        });

        if (bestEntry) {
          const pageNum = parseInt(bestEntry.target.getAttribute("data-page"), 10);
          if (pageNum && !isNaN(pageNum)) {
            setCurrentPage(pageNum);
          }
        }
      },
      {
        root: container,
        threshold: [0.1, 0.3, 0.5, 0.7],
      }
    );

    // Observe all page elements
    renderedPages.forEach((pageNum) => {
      const el = document.getElementById(`pdf-page-wrapper-${pageNum}`);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [renderedPages, renderError]);

  // Navigate to target page smoothly and update counter
  const scrollToPage = useCallback((targetPage) => {
    if (targetPage < 1 || targetPage > totalPages) return;

    setCurrentPage(targetPage);
    isNavigatingByClick.current = true;

    const targetEl = document.getElementById(`pdf-page-wrapper-${targetPage}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setTimeout(() => {
      isNavigatingByClick.current = false;
    }, 600);
  }, [totalPages]);

  const handlePrevPage = () => {
    scrollToPage(currentPage - 1);
  };

  const handleNextPage = () => {
    scrollToPage(currentPage + 1);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));

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
            ? `Active PDF Document • Page ${currentPage} of ${totalPages}`
            : "Upload a PDF to view and analyze"}
        </span>
      </div>

      {/* Main Content Area */}
      <div
        ref={scrollContainerRef}
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

        {loading || renderingPdf ? (
          <div className="viewer-empty-state">
            <LoaderCircle size={42} className="spin text-blue" />
            <h3>{loading ? "Processing PDF with AI..." : "Rendering pages..."}</h3>
            <p>
              {loading
                ? "Extracting text, generating embeddings, and building search index."
                : "Rendering high-resolution document pages."}
            </p>
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
        ) : renderError ? (
          /* Fallback native iframe viewer if browser blocks worker */
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
        ) : (
          /* High-Fidelity Continuous PDF Page View with Scroll & Page Sync */
          <div
            className="pdf-pages-scroll-stack"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease",
            }}
          >
            {renderedPages.map((pageNum) => (
              <div
                key={pageNum}
                id={`pdf-page-wrapper-${pageNum}`}
                data-page={pageNum}
                className={`pdf-single-page-card ${currentPage === pageNum ? "active-page" : ""}`}
              >
                <div className="page-watermark-tag">Page {pageNum}</div>
                <canvas
                  ref={(el) => {
                    if (el) pageRefs.current[pageNum] = el;
                  }}
                  className="pdf-page-canvas"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Toolbar (Only when document is active) */}
      {pdfBlobUrl && !loading && (
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
              {currentPage} / {totalPages}
            </span>
            <button
              className="toolbar-btn"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
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
