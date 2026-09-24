import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  UploadTask,
} from "firebase/storage";
import firebaseConfigFile from "../../firebase-applet-config.json";

// Read Firebase configuration from environment variables with fallback to config file
const env = (import.meta as any)?.env || {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigFile.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigFile.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigFile.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigFile.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigFile.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigFile.appId,
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || firebaseConfigFile.firestoreDatabaseId,
};

// Initialize Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore database instance
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Storage instance with configured bucket
export const storage = firebaseConfig.storageBucket
  ? getStorage(app, firebaseConfig.storageBucket)
  : getStorage(app);

export const UNITS_COLLECTION = "units";
export const TIMETABLE_COLLECTION = "timetable";

/**
 * Persist a unit document to the Firestore 'units' collection.
 */
export async function persistUnitToFirestore(unit: {
  id: string;
  unitCode?: string;
  code?: string;
  title: string;
  name?: string;
  description?: string;
  yearOfStudy?: number;
  semester?: string;
  term?: string;
  color?: string;
  userId?: string;
  createdAt?: string;
}): Promise<boolean> {
  try {
    const docRef = doc(db, UNITS_COLLECTION, unit.id);
    const payload: Record<string, any> = {
      id: unit.id,
      title: unit.title || unit.name || "Untitled Unit",
      name: unit.title || unit.name || "Untitled Unit",
      description: unit.description || "",
      yearOfStudy: unit.yearOfStudy || 1,
      semester: unit.semester || "Semester 1",
      term: unit.term || `Year ${unit.yearOfStudy || 1}, ${unit.semester || "Semester 1"}`,
      color: unit.color || "#2563eb",
      userId: unit.userId || "student_u01",
      createdAt: unit.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store unitCode if provided (optional)
    if (unit.unitCode && unit.unitCode.trim()) {
      payload.unitCode = unit.unitCode.trim().toUpperCase();
      payload.code = unit.unitCode.trim().toUpperCase();
    } else if (unit.code && unit.code.trim()) {
      payload.unitCode = unit.code.trim().toUpperCase();
      payload.code = unit.code.trim().toUpperCase();
    } else {
      payload.unitCode = "";
      payload.code = "";
    }

    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Delete a unit document from the Firestore 'units' collection.
 */
export async function deleteUnitFromFirestore(unitId: string): Promise<boolean> {
  try {
    const docRef = doc(db, UNITS_COLLECTION, unitId);
    await deleteDoc(docRef);
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Fetch all units from the Firestore 'units' collection.
 */
export async function fetchUnitsFromFirestore(): Promise<any[]> {
  try {
    const colRef = collection(db, UNITS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const units: any[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      units.push({
        id: docSnap.id,
        ...data,
      });
    });
    return units;
  } catch (_error) {
    return [];
  }
}

/**
 * Real-time subscription to the Firestore 'units' collection.
 */
export function subscribeToFirestoreUnits(
  onUpdate: (units: any[]) => void,
  onError?: (err: any) => void
) {
  try {
    const colRef = collection(db, UNITS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const units: any[] = [];
        snapshot.forEach((docSnap) => {
          units.push({
            id: docSnap.id,
            ...docSnap.data(),
          });
        });
        onUpdate(units);
      },
      (err) => {
        if (onError) onError(err);
      }
    );
  } catch (e) {
    if (onError) onError(e);
    return () => {};
  }
}

/**
 * Persist a timetable entry document to the Firestore 'timetable' collection.
 */
export async function persistTimetableEntryToFirestore(entry: {
  id: string;
  userId?: string;
  unitId: string;
  day: string;
  startTime: string;
  endTime: string;
  venue?: string;
  lecturer?: string;
  notes?: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}): Promise<boolean> {
  try {
    const docRef = doc(db, TIMETABLE_COLLECTION, entry.id);
    const payload: Record<string, any> = {
      id: entry.id,
      userId: entry.userId || "student_u01",
      unitId: entry.unitId,
      day: entry.day,
      startTime: entry.startTime,
      endTime: entry.endTime,
      venue: entry.venue ? entry.venue.trim() : "",
      lecturer: entry.lecturer ? entry.lecturer.trim() : "",
      notes: entry.notes ? entry.notes.trim() : "",
      color: entry.color || "",
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: entry.updatedAt || new Date().toISOString(),
    };

    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Delete a timetable entry document from Firestore.
 */
export async function deleteTimetableEntryFromFirestore(entryId: string): Promise<boolean> {
  try {
    const docRef = doc(db, TIMETABLE_COLLECTION, entryId);
    await deleteDoc(docRef);
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Fetch all timetable entries from Firestore.
 */
export async function fetchTimetableFromFirestore(): Promise<any[]> {
  try {
    const colRef = collection(db, TIMETABLE_COLLECTION);
    const snapshot = await getDocs(colRef);
    const entries: any[] = [];
    snapshot.forEach((docSnap) => {
      entries.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    });
    return entries;
  } catch (_error) {
    return [];
  }
}

/**
 * Real-time subscription to the Firestore 'timetable' collection.
 */
export function subscribeToFirestoreTimetable(
  onUpdate: (entries: any[]) => void,
  onError?: (err: any) => void
) {
  try {
    const colRef = collection(db, TIMETABLE_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const entries: any[] = [];
        snapshot.forEach((docSnap) => {
          entries.push({
            id: docSnap.id,
            ...docSnap.data(),
          });
        });
        onUpdate(entries);
      },
      (err) => {
        if (onError) onError(err);
      }
    );
  } catch (e) {
    if (onError) onError(e);
    return () => {};
  }
}

// ====================================================
// Firebase Cloud Storage - Production File Upload System
// ====================================================

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB max limit
export const ALLOWED_MIME_TYPES = ["application/pdf"];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  formattedSize?: string;
}

export interface UploadProgress {
  percent: number;
  bytesTransferred: number;
  totalBytes: number;
  state: "running" | "paused" | "success" | "error";
  formattedTransferred: string;
  formattedTotal: string;
}

export interface UploadResult {
  downloadUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: string;
}

export interface UploadController {
  promise: Promise<UploadResult>;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
}

/**
 * Format bytes into clean human-readable strings (KB, MB).
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Strictly validate the uploaded file before initiating network upload.
 * Enforces file format (application/pdf), non-empty, and max size <= 25 MB.
 */
export function validatePdfFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: "No file was selected." };
  }

  // Check file type
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return {
      valid: false,
      error: "Invalid file format. Only PDF documents (.pdf) are supported for academic notes.",
    };
  }

  // Check empty file
  if (file.size === 0) {
    return {
      valid: false,
      error: "The selected file is empty (0 bytes). Please select a valid document.",
    };
  }

  // Check maximum size (25 MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 25 MB limit (${formatBytes(file.size)}). Please select a smaller PDF.`,
      formattedSize: formatBytes(file.size),
    };
  }

  return {
    valid: true,
    formattedSize: formatBytes(file.size),
  };
}

/**
 * Generate an organized, sanitized hierarchical storage path in Firebase Storage.
 * Structure: users/{userId}/units/{unitId}/resources/{resourceId}/{timestamp}_{cleanFileName}
 */
export function generateResourceStoragePath(
  userId: string,
  unitId: string,
  resourceId: string,
  fileName: string
): string {
  const cleanUserId = (userId || "student_u01").replace(/[^a-zA-Z0-9_-]/g, "");
  const cleanUnitId = (unitId || "general").replace(/[^a-zA-Z0-9_-]/g, "");
  const cleanResourceId = (resourceId || `res_${Date.now().toString(36)}`).replace(/[^a-zA-Z0-9_-]/g, "");
  const timestamp = Date.now();
  const cleanFileName = fileName
    .toLowerCase()
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");

  return `users/${cleanUserId}/units/${cleanUnitId}/resources/${cleanResourceId}/${timestamp}_${cleanFileName}`;
}

/**
 * Upload a PDF resource file to Firebase Cloud Storage with real-time progress and robust error handling.
 */
export function uploadResourcePdf(params: {
  file: File;
  unitId: string;
  resourceId: string;
  userId?: string;
  onProgress?: (progress: UploadProgress) => void;
}): UploadController {
  const { file, unitId, resourceId, userId = "student_u01", onProgress } = params;

  // 1. Validate file before starting upload
  const validation = validatePdfFile(file);
  if (!validation.valid) {
    return {
      promise: Promise.reject(new Error(validation.error)),
      cancel: () => {},
      pause: () => {},
      resume: () => {},
    };
  }

  const storagePath = generateResourceStoragePath(userId, unitId, resourceId, file.name);
  const fileRef = ref(storage, storagePath);

  const metadata = {
    contentType: "application/pdf",
    customMetadata: {
      originalName: file.name,
      unitId,
      resourceId,
      userId,
      uploadedAt: new Date().toISOString(),
    },
  };

  let uploadTask: UploadTask;
  try {
    uploadTask = uploadBytesResumable(fileRef, file, metadata);
  } catch (err: any) {
    return {
      promise: Promise.reject(new Error(err?.message || "Failed to initialize Firebase Storage upload.")),
      cancel: () => {},
      pause: () => {},
      resume: () => {},
    };
  }

  const promise = new Promise<UploadResult>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent =
          snapshot.totalBytes > 0
            ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            : 0;
        if (onProgress) {
          onProgress({
            percent,
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            state: snapshot.state as any,
            formattedTransferred: formatBytes(snapshot.bytesTransferred),
            formattedTotal: formatBytes(snapshot.totalBytes),
          });
        }
      },
      (error: any) => {
        let userMessage = "File upload failed. Please try again.";
        if (error.code === "storage/unauthorized") {
          userMessage = "Upload permission denied. The file was rejected by storage access policies.";
        } else if (error.code === "storage/canceled") {
          userMessage = "Upload was cancelled.";
        } else if (error.code === "storage/retry-limit-exceeded") {
          userMessage = "Upload connection timed out. Please check your network connection and retry.";
        } else if (error.code === "storage/quota-exceeded") {
          userMessage = "Cloud storage quota exceeded. Please contact your administrator.";
        } else if (error.message) {
          userMessage = `Upload failed: ${error.message}`;
        }
        reject(new Error(userMessage));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const result: UploadResult = {
            downloadUrl,
            storagePath,
            fileName: file.name,
            fileSize: formatBytes(file.size),
          };
          if (onProgress) {
            onProgress({
              percent: 100,
              bytesTransferred: file.size,
              totalBytes: file.size,
              state: "success",
              formattedTransferred: formatBytes(file.size),
              formattedTotal: formatBytes(file.size),
            });
          }
          resolve(result);
        } catch (err: any) {
          reject(
            new Error(
              `File uploaded, but failed to retrieve secure download URL: ${err.message}`
            )
          );
        }
      }
    );
  });

  return {
    promise,
    cancel: () => uploadTask.cancel(),
    pause: () => uploadTask.pause(),
    resume: () => uploadTask.resume(),
  };
}

/**
 * Delete a resource file from Firebase Cloud Storage by its storagePath or download URL.
 */
export async function deleteResourcePdf(storagePathOrUrl: string): Promise<boolean> {
  if (!storagePathOrUrl) return false;
  try {
    let fileRef;
    if (storagePathOrUrl.startsWith("http://") || storagePathOrUrl.startsWith("https://")) {
      fileRef = ref(storage, storagePathOrUrl);
    } else {
      fileRef = ref(storage, storagePathOrUrl);
    }
    await deleteObject(fileRef);
    return true;
  } catch (error: any) {
    // If the file is already gone or not found, treat as succeeded
    if (error?.code === "storage/object-not-found") {
      return true;
    }
    return false;
  }
}

/**
 * Clean up test or sample files from development in Firebase Storage.
 */
export async function cleanupStorageTestFiles(): Promise<number> {
  try {
    const rootRef = ref(storage, "");
    const rootResult = await listAll(rootRef);
    let deletedCount = 0;

    // Check files at root (e.g. test.txt, sample.pdf)
    for (const item of rootResult.items) {
      if (
        item.name.startsWith("test") ||
        item.name.startsWith("sample") ||
        item.name.includes("mock")
      ) {
        try {
          await deleteObject(item);
          deletedCount++;
        } catch {
          // ignore individual delete failure
        }
      }
    }

    return deletedCount;
  } catch {
    return 0;
  }
}


