import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TimetableEntry, Unit, User, DayOfWeek, DAYS_OF_WEEK } from "../types";

// Day mapping for recurring iCalendar RFC 5545 specifications
const DAY_TO_ICS_BYDAY: Record<DayOfWeek, string> = {
  Monday: "MO",
  Tuesday: "TU",
  Wednesday: "WE",
  Thursday: "TH",
  Friday: "FR",
  Saturday: "SA",
  Sunday: "SU",
};

const DAY_INDEX_MAP: Record<DayOfWeek, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/**
 * Calculates a target date matching the specified day of week in the current week.
 * This guarantees proper base alignment for recurring RRULEs.
 */
function getReferenceDateForDay(day: DayOfWeek): Date {
  const targetDayIdx = DAY_INDEX_MAP[day] ?? 1;
  const now = new Date();
  const currentDayIdx = now.getDay();
  const diff = targetDayIdx - currentDayIdx;
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  return target;
}

/**
 * Formats a date and time (HH:MM in 24h format) into standard iCalendar local datetime (YYYYMMDDTHHMMSS).
 * Floating local time allows Google Calendar and Apple Calendar to place it at the exact wall clock time.
 */
function formatICSDateTime(date: Date, timeStr: string): string {
  const [hours, minutes] = timeStr.split(":").map((v) => parseInt(v, 10) || 0);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(hours).padStart(2, "0");
  const min = String(minutes).padStart(2, "0");
  return `${y}${m}${d}T${h}${min}00`;
}

/**
 * Sanitize text according to iCalendar RFC 5545 escape guidelines.
 */
function escapeICSText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Generate full RFC 5545 compliant iCalendar string for the entire weekly timetable.
 */
export function generateICSContent(
  entries: TimetableEntry[],
  units: Unit[],
  user?: User
): string {
  const unitMap = new Map<string, Unit>();
  units.forEach((u) => unitMap.set(u.id, u));

  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const calendarName = user?.name
    ? `${user.name}'s Academic Timetable`
    : "Academic Timetable";

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Academic Portal//Weekly Timetable Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${calendarName}`,
    "X-WR-CALDESC:Weekly academic timetable with lectures, tutorials, and labs",
    "X-WR-TIMEZONE:UTC",
  ];

  for (const entry of entries) {
    const unit = unitMap.get(entry.unitId);
    const unitCode = unit?.unitCode || unit?.code || "UNIT";
    const unitTitle = unit?.title || unit?.name || "Academic Unit";
    const byDay = DAY_TO_ICS_BYDAY[entry.day] || "MO";

    const baseDate = getReferenceDateForDay(entry.day);
    const dtStart = formatICSDateTime(baseDate, entry.startTime);
    const dtEnd = formatICSDateTime(baseDate, entry.endTime);

    const summary = `[${unitCode}] ${unitTitle}`;
    const location = entry.venue || "";

    const descParts: string[] = [
      `Unit: ${unitTitle} (${unitCode})`,
      `Day: ${entry.day}`,
      `Time: ${entry.startTime} - ${entry.endTime}`,
    ];
    if (entry.lecturer) {
      descParts.push(`Lecturer: ${entry.lecturer}`);
    }
    if (entry.venue) {
      descParts.push(`Venue: ${entry.venue}`);
    }
    if (entry.notes) {
      descParts.push(`Notes: ${entry.notes}`);
    }
    if (user?.university) {
      descParts.push(`Institution: ${user.university}`);
    }
    const description = descParts.join("\n");

    const uid = `timetable-${entry.id}-${baseDate.getFullYear()}@academicportal.app`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${timestamp}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`);
    lines.push(`SUMMARY:${escapeICSText(summary)}`);
    if (location) {
      lines.push(`LOCATION:${escapeICSText(location)}`);
    }
    lines.push(`DESCRIPTION:${escapeICSText(description)}`);
    lines.push("STATUS:CONFIRMED");
    lines.push("CATEGORIES:Education,Academic,Timetable");
    lines.push("TRANSP:OPAQUE");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Download the timetable as an .ics file that can be imported directly into Google Calendar, Apple Calendar, or Outlook.
 */
export function downloadICSTimetable(
  entries: TimetableEntry[],
  units: Unit[],
  user?: User,
  filename?: string
): void {
  const icsString = generateICSContent(entries, units, user);
  const blob = new Blob([icsString], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename ||
    `Timetable_${user?.name ? user.name.replace(/\s+/g, "_") : "Weekly"}_${new Date()
      .toISOString()
      .slice(0, 10)}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a direct Google Calendar Web Intent URL for adding an individual recurring lesson.
 */
export function generateGoogleCalendarUrl(
  entry: TimetableEntry,
  unit?: Unit,
  user?: User
): string {
  const unitCode = unit?.unitCode || unit?.code || "UNIT";
  const unitTitle = unit?.title || unit?.name || "Academic Unit";
  const title = `[${unitCode}] ${unitTitle}`;

  const baseDate = getReferenceDateForDay(entry.day);
  const dtStart = formatICSDateTime(baseDate, entry.startTime);
  const dtEnd = formatICSDateTime(baseDate, entry.endTime);

  const byDay = DAY_TO_ICS_BYDAY[entry.day] || "MO";
  const detailsParts: string[] = [
    `Unit: ${unitTitle} (${unitCode})`,
    `Schedule: Every ${entry.day} ${entry.startTime} - ${entry.endTime}`,
  ];
  if (entry.lecturer) detailsParts.push(`Lecturer: ${entry.lecturer}`);
  if (entry.venue) detailsParts.push(`Venue: ${entry.venue}`);
  if (entry.notes) detailsParts.push(`Notes: ${entry.notes}`);
  if (user?.university) detailsParts.push(`Campus: ${user.university}`);

  const details = detailsParts.join("\n");
  const location = entry.venue || "";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${dtStart}/${dtEnd}`,
    details: details,
    location: location,
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Direct link to Google Calendar import settings where users can upload .ics files.
 */
export function openGoogleCalendarImport(): void {
  window.open(
    "https://calendar.google.com/calendar/u/0/r/settings/export",
    "_blank",
    "noopener,noreferrer"
  );
}

export interface PDFExportOptions {
  entries: TimetableEntry[];
  units: Unit[];
  user?: User;
  orientation?: "landscape" | "portrait";
  includeNotes?: boolean;
  includeLecturer?: boolean;
  includeVenue?: boolean;
  customTitle?: string;
  filename?: string;
}

/**
 * Export high-resolution, beautifully formatted timetable PDF document.
 */
export async function exportTimetablePDF(options: PDFExportOptions): Promise<void> {
  const {
    entries,
    units,
    user,
    orientation = "landscape",
    includeNotes = true,
    includeLecturer = true,
    includeVenue = true,
    customTitle,
    filename,
  } = options;

  const unitMap = new Map<string, Unit>();
  units.forEach((u) => unitMap.set(u.id, u));

  // Initialize jsPDF
  const doc = new jsPDF({
    orientation: orientation,
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Color Palette Constants
  const brandPrimary = [67, 56, 202]; // Indigo 600
  const brandDark = [30, 41, 59]; // Slate 800
  const brandMuted = [100, 116, 139]; // Slate 500
  const borderLight = [226, 232, 240]; // Slate 200

  // 1. Top Decorative Brand Bar
  doc.setFillColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.rect(0, 0, pageWidth, 6, "F");

  // 2. Document Header
  let currentY = 16;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  const mainTitle = customTitle || "WEEKLY ACADEMIC TIMETABLE";
  doc.text(mainTitle, 14, currentY);

  // Institution / Subtitle
  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(brandMuted[0], brandMuted[1], brandMuted[2]);
  const subTitle = [
    user?.university || "University Academic Portal",
    user?.term || "Semester Schedule",
    user?.name ? `Student: ${user.name}` : "",
  ]
    .filter(Boolean)
    .join("  |  ");
  doc.text(subTitle, 14, currentY);

  // Date Generated on Right Side
  const genDateStr = `Exported: ${new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}`;
  doc.setFontSize(9);
  doc.text(genDateStr, pageWidth - 14, currentY, { align: "right" });

  // 3. Stats Strip Box
  currentY += 6;
  const totalSessions = entries.length;
  const totalWeeklyHours = entries.reduce((acc, item) => {
    const [sH, sM] = item.startTime.split(":").map(Number);
    const [eH, eM] = item.endTime.split(":").map(Number);
    return acc + Math.max(0, (eH * 60 + eM - (sH * 60 + sM)) / 60);
  }, 0);
  const scheduledUnitCodes = new Set(
    entries.map((e) => {
      const u = unitMap.get(e.unitId);
      return u?.unitCode || u?.code || e.unitId;
    })
  );

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(14, currentY, pageWidth - 28, 11, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);

  const statsText = `Total Sessions: ${totalSessions}   |   Weekly Contact: ${totalWeeklyHours.toFixed(
    1
  )} hours   |   Registered Units: ${scheduledUnitCodes.size} modules`;
  doc.text(statsText, 18, currentY + 7);

  currentY += 16;

  // 4. Sort entries by Day order (Monday through Sunday) then by startTime
  const dayOrder: Record<DayOfWeek, number> = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
  };

  const sortedEntries = [...entries].sort((a, b) => {
    const dDiff = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
    if (dDiff !== 0) return dDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  // Table Columns
  const tableHeaders: string[] = ["Day", "Time", "Unit Code", "Unit Title"];
  if (includeVenue) tableHeaders.push("Venue / Room");
  if (includeLecturer) tableHeaders.push("Lecturer");
  tableHeaders.push("Duration");
  if (includeNotes) tableHeaders.push("Notes");

  const tableRows: string[][] = sortedEntries.map((item) => {
    const unit = unitMap.get(item.unitId);
    const unitCode = unit?.unitCode || unit?.code || "-";
    const unitTitle = unit?.title || unit?.name || "Academic Unit";

    const [sH, sM] = item.startTime.split(":").map(Number);
    const [eH, eM] = item.endTime.split(":").map(Number);
    const duration = ((eH * 60 + eM - (sH * 60 + sM)) / 60).toFixed(1) + "h";

    const row: string[] = [
      item.day,
      `${item.startTime} - ${item.endTime}`,
      unitCode,
      unitTitle,
    ];

    if (includeVenue) row.push(item.venue || "TBA");
    if (includeLecturer) row.push(item.lecturer || "-");
    row.push(duration);
    if (includeNotes) row.push(item.notes || "-");

    return row;
  });

  // Render Table with autoTable
  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [67, 56, 202],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "left",
      cellPadding: 3.5,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85],
      cellPadding: 3,
      lineColor: [226, 232, 240],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: orientation === "landscape" ? 28 : 22 }, // Day
      1: { cellWidth: orientation === "landscape" ? 32 : 26 }, // Time
      2: { fontStyle: "bold", cellWidth: orientation === "landscape" ? 25 : 22 }, // Unit Code
      3: { cellWidth: orientation === "landscape" ? 65 : 45 }, // Title
    },
    didDrawPage: (data) => {
      // Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      const pageNumber = doc.getNumberOfPages();
      doc.text(
        `Page ${data.pageNumber} of ${pageNumber}  •  Academic Timetable System`,
        pageWidth / 2,
        pageHeight - 6,
        { align: "center" }
      );
    },
    margin: { left: 14, right: 14, bottom: 12 },
  });

  // Trigger download
  const cleanFilename =
    filename ||
    `Academic_Timetable_${user?.name ? user.name.replace(/\s+/g, "_") : "Weekly"}_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`;

  doc.save(cleanFilename);
}
