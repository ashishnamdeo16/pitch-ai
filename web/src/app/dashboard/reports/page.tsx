"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

interface Session {
  id: string;
  title: string;
  overallScore: number | null;
  createdAt: string;
  status: string;
}

export default function ReportsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadSessions = useCallback(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.sessions || []) as Session[];
        setSessions(
          list.filter((s) => s.status === "COMPLETED" || s.status === "ARCHIVED")
        );
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  async function exportPdf(sessionId: string) {
    setLoading(sessionId);
    try {
      const res = await fetch(`/api/reports/${sessionId}`, { method: "POST" });
      const data = await res.json();
      if (data.pdf) {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${data.pdf}`;
        link.download = data.filename || "pitch-report.pdf";
        link.click();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  async function deleteReport(sessionId: string, title: string) {
    if (
      !window.confirm(
        `Delete "${title}"? This removes the session, transcript, and report permanently.`
      )
    ) {
      return;
    }

    setDeleting(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) {
        console.warn("Delete failed");
        return;
      }
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white">Reports</h1>
      <p className="mt-1 text-zinc-500">Export or delete pitch performance reports</p>

      <div className="mt-8 space-y-4">
        {sessions.length === 0 ? (
          <GlassCard>
            <p className="py-8 text-center text-zinc-500">
              Complete a practice session to generate reports
            </p>
          </GlassCard>
        ) : (
          sessions.map((s) => (
            <GlassCard key={s.id} className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/20">
                  <FileText className="h-6 w-6 text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{s.title}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(s.createdAt).toLocaleDateString()} · Score:{" "}
                    {s.overallScore ?? "—"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={loading === s.id || deleting === s.id}
                  onClick={() => exportPdf(s.id)}
                >
                  <Download className="h-4 w-4" />
                  {loading === s.id ? "Generating…" : "Export PDF"}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={loading === s.id || deleting === s.id}
                  onClick={() => deleteReport(s.id, s.title)}
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting === s.id ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
