import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportInput {
  title: string;
  date: Date;
  metrics: {
    overall: number;
    confidence: number;
    energy: number;
    clarity: number;
    pacing: number;
    fillers: number;
    structure: number;
  };
  structure: { element: string; detected: boolean; excerpt?: string | null }[];
  transcript: string;
  feedback: string[];
  questions: string[];
}

export function generatePitchReportPDF(input: ReportInput): string {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 15, 20);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("PitchPilot AI", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(180, 180, 200);
  doc.text("Pitch Performance Report", 14, 26);
  doc.text(input.date.toLocaleDateString(), pageWidth - 14, 26, { align: "right" });

  doc.setTextColor(30, 30, 40);
  doc.setFontSize(16);
  doc.text(input.title, 14, 55);

  // Metrics table
  autoTable(doc, {
    startY: 65,
    head: [["Metric", "Score"]],
    body: [
      ["Overall Score", `${input.metrics.overall}/100`],
      ["Confidence", `${input.metrics.confidence}/100`],
      ["Energy", `${input.metrics.energy}/100`],
      ["Clarity", `${input.metrics.clarity}/100`],
      ["Pacing (WPM)", `${input.metrics.pacing}`],
      ["Filler Words", `${input.metrics.fillers}`],
      ["Structure", `${input.metrics.structure}/100`],
    ],
    theme: "grid",
    headStyles: { fillColor: [99, 102, 241] },
  });

  const structureY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 15;

  doc.setFontSize(12);
  doc.text("Pitch Structure", 14, structureY);

  autoTable(doc, {
    startY: structureY + 5,
    head: [["Element", "Detected", "Excerpt"]],
    body: input.structure.map((s) => [
      s.element.replace(/_/g, " "),
      s.detected ? "Yes" : "No",
      (s.excerpt || "—").slice(0, 60),
    ]),
    theme: "striped",
  });

  const feedbackY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 15;

  doc.text("AI Coaching Highlights", 14, feedbackY);
  doc.setFontSize(9);
  let y = feedbackY + 8;
  input.feedback.slice(0, 5).forEach((f, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${f}`, pageWidth - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 4;
  });

  if (input.questions.length > 0) {
    doc.addPage();
    doc.setFontSize(12);
    doc.text("Investor Questions", 14, 20);
    doc.setFontSize(9);
    input.questions.forEach((q, i) => {
      doc.text(`${i + 1}. ${q}`, 14, 30 + i * 12);
    });
  }

  if (input.transcript.length > 0) {
    doc.addPage();
    doc.setFontSize(12);
    doc.text("Full Transcript", 14, 20);
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(input.transcript.slice(0, 3000), pageWidth - 28);
    doc.text(lines, 14, 30);
  }

  return doc.output("datauristring").split(",")[1];
}
