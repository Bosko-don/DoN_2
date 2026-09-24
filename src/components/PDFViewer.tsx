import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  ExternalLink,
  Layers,
  Monitor,
  Loader2,
  AlertCircle,
  RefreshCw,
  Check,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Configure worker with local Vite asset URL and unpkg fallback
if (typeof window !== "undefined") {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "6.3.289"}/build/pdf.worker.min.mjs`;
  }
}

interface PDFViewerProps {
  fileUrl: string;
  fileName?: string;
  fileSize?: string;
  title?: string;
  className?: string;
}

// Helper: Convert base64 data URI to Uint8Array for PDF.js
function dataUriToUint8Array(dataUri: string): Uint8Array {
  const base64Index = dataUri.indexOf(";base64,");
  const base64 = base64Index !== -1 ? dataUri.substring(base64Index + 8) : dataUri;
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper: Convert base64 data URI to Blob URL for iframe
function dataUriToBlobUrl(dataUri: string): string {
  try {
    if (dataUri.startsWith("blob:") || dataUri.startsWith("http://") || dataUri.startsWith("https://")) {
      return dataUri;
    }
    const bytes = dataUriToUint8Array(dataUri);
    const blob = new Blob([bytes], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  } catch (e) {
    // silent in production
    return dataUri;
  }
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  fileName,
  fileSize,
  title,
  className = "",
}) => {
  const [viewMode, setViewMode] = useState<"canvas" | "iframe">("canvas");
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? 0.8 : 1.2
  );
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Initialize Blob URL
  useEffect(() => {
    if (!fileUrl) return;
    const url = dataUriToBlobUrl(fileUrl);
    setBlobUrl(url);

    return () => {
      if (url && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    };
  }, [fileUrl]);

  // Load PDF Document with pdfjs-dist
  useEffect(() => {
    let isCancelled = false;
    if (!fileUrl) {
      setError("No PDF document source provided.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        let loadingTask: any;

        if (fileUrl.startsWith("data:application/pdf") || fileUrl.startsWith("data:;base64,")) {
          const data = dataUriToUint8Array(fileUrl);
          loadingTask = pdfjsLib.getDocument({ data });
        } else {
          loadingTask = pdfjsLib.getDocument({
            url: fileUrl,
            withCredentials: false,
          });
        }

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setIsLoading(false);
      } catch (err: any) {
        // silent in production
        if (!isCancelled) {
          setError(err.message || "Failed to parse PDF document.");
          setIsLoading(false);
          // Auto fallback to native iframe viewer if canvas parser encounters issue
          setViewMode("iframe");
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [fileUrl]);

  // Render Current Page on Canvas
  useEffect(() => {
    if (!pdfDoc || viewMode !== "canvas" || !canvasRef.current) return;

    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        // Cancel previous render task if active
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // ignore cancel error
          }
        }

        // Support high-DPI displays
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + "px";
        canvas.style.height = Math.floor(viewport.height) + "px";

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

        const renderContext = {
          canvasContext: context,
          viewport,
          transform: transform || undefined,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          // silent in production
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, currentPage, scale, rotation, viewMode]);

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        setIsFullscreen(!isFullscreen);
      });
    } else {
      document.exitFullscreen?.().then(() => {
        setIsFullscreen(false);
      }).catch(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Sync fullscreen change via escape or browser action
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Download PDF file
  const handleDownload = async () => {
    if (!fileUrl) return;
    const downloadName = fileName || `${(title || "document").replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
    try {
      if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
        try {
          const res = await fetch(fileUrl);
          if (res.ok) {
            const blob = await res.blob();
            const tempUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = tempUrl;
            link.download = downloadName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(tempUrl);
            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 2000);
            return;
          }
        } catch {
          // Cross-origin fallback
          window.open(fileUrl, "_blank", "noopener,noreferrer");
          return;
        }
      }
      const link = document.createElement("a");
      link.href = blobUrl || fileUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (err) {
      // silent in production
    }
  };

  // Open in new tab
  const handleOpenInNewTab = () => {
    if (!blobUrl && !fileUrl) return;
    window.open(blobUrl || fileUrl, "_blank", "noopener,noreferrer");
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 3.0));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));
  const handleResetZoom = () => setScale(1.2);
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages || 1));

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen w-screen" : "w-full h-[400px] sm:h-[500px] md:h-[620px]"
      } ${className}`}
    >
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-900 text-slate-100 text-xs border-b border-slate-800 shrink-0">
        {/* Left: Document Info & View Mode */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-medium max-w-[200px] sm:max-w-xs truncate">
            <FileText className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="truncate" title={fileName || title || "Document"}>
              {fileName || title || "PDF Document"}
            </span>
          </div>

          {fileSize && (
            <span className="hidden md:inline px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
              {fileSize}
            </span>
          )}

          {/* View Mode Toggle: Canvas vs Native Iframe */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700/80">
            <button
              type="button"
              onClick={() => setViewMode("canvas")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                viewMode === "canvas"
                  ? "bg-indigo-600 text-white shadow-2xs font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Interactive Canvas Reader (Page by page high-resolution rendering)"
            >
              <Layers className="w-3 h-3" />
              <span className="hidden sm:inline">Canvas Reader</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("iframe")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                viewMode === "iframe"
                  ? "bg-indigo-600 text-white shadow-2xs font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Native Browser PDF Viewer (Uses browser embedded viewer with bookmarks)"
            >
              <Monitor className="w-3 h-3" />
              <span className="hidden sm:inline">Native Viewer</span>
            </button>
          </div>
        </div>

        {/* Center: Canvas Page Navigation (When in Canvas Mode) */}
        {viewMode === "canvas" && totalPages > 0 && (
          <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-lg border border-slate-700/60">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 text-slate-300 disabled:hover:bg-transparent"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] font-mono px-1">
              Page <span className="text-white font-semibold">{currentPage}</span> of{" "}
              <span className="text-slate-300">{totalPages}</span>
            </span>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 text-slate-300 disabled:hover:bg-transparent"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right: Zoom, Rotate, Fullscreen, Open & Download */}
        <div className="flex items-center gap-1">
          {viewMode === "canvas" && (
            <>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-[11px] font-mono text-slate-300 hover:text-white"
                title="Reset Zoom to 100%"
              >
                {Math.round(scale * 100)}%
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <div className="h-4 w-px bg-slate-800 mx-0.5" />
            </>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
            title="Download PDF document"
          >
            {downloadSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
            title="Open in new window / tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Viewer"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Viewer Body */}
      <div className="flex-1 relative overflow-auto bg-slate-200/70 dark:bg-slate-900/90 flex items-center justify-center p-2 sm:p-4">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-xs text-white">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
            <p className="text-xs font-medium text-slate-200">Rendering PDF Document...</p>
          </div>
        )}

        {/* View Mode 1: High-Performance Canvas Rendering */}
        {viewMode === "canvas" ? (
          <div className="flex flex-col items-center min-h-full justify-center">
            {error ? (
              <div className="max-w-md p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 text-center shadow-lg space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Canvas Rendering Note
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {error}. You can switch to the embedded native viewer or open the PDF directly.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setViewMode("iframe")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    Switch to Native Viewer
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open PDF
                  </button>
                </div>
              </div>
            ) : (
              <div className="shadow-2xl rounded-sm bg-white border border-slate-300 dark:border-slate-700 my-auto transition-transform duration-150">
                <canvas ref={canvasRef} className="block max-w-full" />
              </div>
            )}
          </div>
        ) : (
          /* View Mode 2: Native Browser Embedded Iframe */
          <div className="w-full h-full relative bg-slate-950 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-800">
            {blobUrl ? (
              <iframe
                src={`${blobUrl}#toolbar=1&navpanes=1&statusbar=1&view=FitH`}
                title={title || fileName || "PDF Viewer"}
                className="w-full h-full border-0 block"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400 text-xs">
                <FileText className="w-8 h-8 text-slate-500 mb-2 opacity-60" />
                <p>Generating secure document link...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer Info Bar */}
      <div className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 truncate">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span className="truncate">
            {viewMode === "canvas"
              ? `Canvas Vector Renderer • Page ${currentPage} of ${totalPages || 1}`
              : "Native Browser PDF Plugin Active"}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "canvas" ? "iframe" : "canvas")}
            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>Toggle {viewMode === "canvas" ? "Native Viewer" : "Canvas Reader"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
