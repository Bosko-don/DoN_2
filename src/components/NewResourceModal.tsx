import React, { useState, useRef, useEffect } from "react";
import {
  X,
  FileText,
  FileSpreadsheet,
  Video,
  UploadCloud,
  Plus,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { NoteEditor } from "./NoteEditor";
import { store } from "../services/store";
import { ResourceType } from "../types";
import {
  uploadResourcePdf,
  validatePdfFile,
  deleteResourcePdf,
  UploadProgress,
  UploadController,
} from "../services/firebase";

interface NewResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (resourceId: string) => void;
  defaultCourseId?: string;
  defaultTopicId?: string;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export const NewResourceModal: React.FC<NewResourceModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  defaultCourseId,
  defaultTopicId,
}) => {
  const units = store.getUnits();

  const [type, setType] = useState<ResourceType>("note");
  const [title, setTitle] = useState("");
  const [unitId, setUnitId] = useState(defaultCourseId || units[0]?.id || "");
  const [topicId, setTopicId] = useState(
    defaultTopicId || store.getTopics(defaultCourseId || units[0]?.id)[0]?.id || ""
  );
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  
  // File state
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string>("");
  const [storagePath, setStoragePath] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  
  // Upload status & progress
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadControllerRef = useRef<UploadController | null>(null);
  const selectedFileRef = useRef<File | null>(null);
  const pendingResourceIdRef = useRef<string>(
    "res_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)
  );

  useEffect(() => {
    if (isOpen) {
      const activeUnitId = defaultCourseId || units[0]?.id || "";
      setUnitId(activeUnitId);
      const unitTopics = store.getTopics(activeUnitId);
      setTopicId(defaultTopicId || unitTopics[0]?.id || "");
      setError(null);
      setUploadError(null);
      pendingResourceIdRef.current =
        "res_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    }
  }, [isOpen, defaultCourseId, defaultTopicId]);

  if (!isOpen) return null;

  const topics = store.getTopics(unitId);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Safe file upload execution with progress tracking
  const startUpload = (file: File) => {
    if (!file) return;

    // 1. Strict File Validation
    const validation = validatePdfFile(file);
    if (!validation.valid) {
      setUploadStatus("error");
      setUploadError(validation.error || "File validation failed.");
      setError(validation.error || "File validation failed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Cleanup any previously uploaded file in this session if replacing
    if (storagePath) {
      deleteResourcePdf(storagePath).catch(() => {});
      setStoragePath("");
    }

    selectedFileRef.current = file;
    setFileName(file.name);
    setFileSize(validation.formattedSize || "");
    setUploadStatus("uploading");
    setUploadError(null);
    setError(null);
    setUploadProgress({
      percent: 0,
      bytesTransferred: 0,
      totalBytes: file.size,
      state: "running",
      formattedTransferred: "0 KB",
      formattedTotal: validation.formattedSize || "",
    });

    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    const currentUnit = store.getUnit(unitId);
    if (!content.trim()) {
      setContent(
        `Uploaded PDF Document: "${file.name}" (${validation.formattedSize}).\nUnit: ${
          currentUnit?.unitCode || currentUnit?.code || currentUnit?.title || "Academic Unit"
        }`
      );
    }

    // 3. Initiate Firebase Storage Upload
    const controller = uploadResourcePdf({
      file,
      unitId,
      resourceId: pendingResourceIdRef.current,
      userId: "student_u01",
      onProgress: (progress) => {
        setUploadProgress(progress);
      },
    });

    uploadControllerRef.current = controller;

    controller.promise
      .then((result) => {
        setFileUrl(result.downloadUrl);
        setStoragePath(result.storagePath);
        setUploadStatus("success");
        setUploadError(null);
      })
      .catch((err: any) => {
        if (err.message && err.message.includes("cancelled")) {
          setUploadStatus("idle");
          setUploadProgress(null);
        } else {
          setUploadStatus("error");
          setUploadError(err.message || "Failed to upload file to Cloud Storage.");
        }
      });
  };

  const handleCancelUpload = () => {
    if (uploadControllerRef.current) {
      uploadControllerRef.current.cancel();
      uploadControllerRef.current = null;
    }
    setUploadStatus("idle");
    setUploadProgress(null);
    setFileName("");
    setFileSize("");
    selectedFileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = () => {
    if (uploadControllerRef.current) {
      uploadControllerRef.current.cancel();
      uploadControllerRef.current = null;
    }
    if (storagePath) {
      deleteResourcePdf(storagePath).catch(() => {});
    }
    setUploadStatus("idle");
    setUploadProgress(null);
    setFileName("");
    setFileSize("");
    setFileUrl("");
    setStoragePath("");
    setUploadError(null);
    selectedFileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRetryUpload = () => {
    if (selectedFileRef.current) {
      startUpload(selectedFileRef.current);
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      startUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      startUpload(e.target.files[0]);
    }
  };

  const handleModalClose = () => {
    // If currently uploading, cancel the network stream
    if (uploadControllerRef.current) {
      uploadControllerRef.current.cancel();
      uploadControllerRef.current = null;
    }
    // If uploaded but not saved, clean up orphaned storage object
    if (uploadStatus === "success" && storagePath) {
      deleteResourcePdf(storagePath).catch(() => {});
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Resource title is required.");
      return;
    }
    if (!unitId || !topicId) {
      setError("Please select both an academic unit and a topic.");
      return;
    }
    if (type === "video" && !videoUrl.trim()) {
      setError("Please provide a valid video lesson URL.");
      return;
    }

    // For PDF resources, verify upload integrity
    if (type === "pdf") {
      if (uploadStatus === "uploading" && uploadControllerRef.current) {
        setIsSubmitting(true);
        try {
          const result = await uploadControllerRef.current.promise;
          setFileUrl(result.downloadUrl);
          setStoragePath(result.storagePath);
        } catch (err: any) {
          setIsSubmitting(false);
          setError(err.message || "Cannot save resource while file upload failed.");
          return;
        }
        setIsSubmitting(false);
      } else if (uploadStatus !== "success" || !fileUrl) {
        setError("Please upload and verify a PDF document before saving.");
        return;
      }
    }

    const newRes = store.addResource({
      unitId,
      courseId: unitId,
      topicId,
      type,
      title: title.trim(),
      content: content.trim(),
      fileUrl: type === "pdf" ? fileUrl : undefined,
      fileName: type === "pdf" ? fileName : undefined,
      fileSize: type === "pdf" ? fileSize : undefined,
      storagePath: type === "pdf" ? storagePath : undefined,
      videoUrl: type === "video" ? videoUrl.trim() : undefined,
      tags: tags.length > 0 ? tags : ["study-material"],
    });

    // Successfully committed to store - reset storagePath so cleanup handler won't delete it
    setStoragePath("");
    onCreated(newRes.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden max-h-[96vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Add Academic Resource
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Save typed notes, upload PDF slide decks/papers, or bookmark video lessons.
            </p>
          </div>
          <button
            onClick={handleModalClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Resource Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Resource Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType("note")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  type === "note"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-500 shadow-2xs font-semibold"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
              >
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Typed Note</span>
              </button>

              <button
                type="button"
                onClick={() => setType("pdf")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  type === "pdf"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-500 shadow-2xs font-semibold"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-rose-500" />
                <span>Upload PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setType("video")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  type === "video"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-500 shadow-2xs font-semibold"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
              >
                <Video className="w-4 h-4 text-amber-500" />
                <span>Video Lesson</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Resource Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Memory Hierarchy, Paging and TLB Miss Derivations"
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              required
            />
          </div>

          {/* Unit & Topic Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Which unit is this for? <span className="text-rose-500">*</span>
              </label>
              <select
                value={unitId}
                onChange={(e) => {
                  setUnitId(e.target.value);
                  const firstTopic = store.getTopics(e.target.value)[0];
                  setTopicId(firstTopic ? firstTopic.id : "");
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                required
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unitCode || u.code ? `${u.unitCode || u.code} - ` : ""}
                    {u.title || u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Which topic is this for? <span className="text-rose-500">*</span>
              </label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                required
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Input by Format */}
          {type === "pdf" && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                PDF Document Upload (Firebase Cloud Storage)
              </label>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* State 1: Idle (Dropzone) */}
              {uploadStatus === "idle" && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    isDragging
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40"
                      : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-850/60"
                  }`}
                >
                  <UploadCloud className="w-8 h-8 text-indigo-500 dark:text-indigo-400 mb-2" />
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    Drag and drop PDF here, or click to browse
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Strictly PDF (.pdf) • Maximum file size 25 MB
                  </p>
                </div>
              )}

              {/* State 2: Uploading with visible Progress Bar */}
              {uploadStatus === "uploading" && (
                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                          {fileName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {uploadProgress
                            ? `${uploadProgress.formattedTransferred} of ${uploadProgress.formattedTotal}`
                            : "Starting upload..."}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold font-mono text-indigo-600 dark:text-indigo-400">
                        {uploadProgress ? `${uploadProgress.percent}%` : "0%"}
                      </span>
                      <button
                        type="button"
                        onClick={handleCancelUpload}
                        className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-150 ease-out rounded-full"
                      style={{ width: `${uploadProgress ? uploadProgress.percent : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    Streaming securely to Firebase Storage bucket. You may continue editing details below.
                  </p>
                </div>
              )}

              {/* State 3: Upload Success */}
              {uploadStatus === "success" && (
                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {fileName}
                        </p>
                        <span className="px-1.5 py-0.2 text-[10px] font-medium rounded bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300">
                          Uploaded
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {fileSize} • Stored securely in Cloud Storage
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
                      title="Replace with a different PDF"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                      title="Remove uploaded file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* State 4: Upload Error */}
              {uploadStatus === "error" && (
                <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/30 space-y-2.5">
                  <div className="flex items-start gap-2 text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">Upload Failed</p>
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                        {uploadError || "An unexpected error occurred during cloud upload."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {selectedFileRef.current && (
                      <button
                        type="button"
                        onClick={handleRetryUpload}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry Upload</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                    >
                      Choose Different PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {type === "video" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Video Lesson URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="e.g. https://www.youtube.com/watch?v=12345 or Vimeo link"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                required
              />
            </div>
          )}

          {/* Markdown Content / Lecture Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Lecture Notes / Text Content (Markdown Supported)
            </label>
            <NoteEditor
              value={content}
              onChange={setContent}
              placeholder="Paste lecture excerpts, formula derivations, code blocks, or synthesized notes..."
              rows={5}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Resource Tags (Press Enter or comma)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="e.g. cat1, final-exam, virtual-memory"
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Add
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleModalClose}
              className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 text-xs text-center text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 sm:border-transparent rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (type === "pdf" && uploadStatus === "uploading")}
              className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-4 py-2 sm:py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {isSubmitting || (type === "pdf" && uploadStatus === "uploading") ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading PDF ({uploadProgress?.percent || 0}%)...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Resource</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
