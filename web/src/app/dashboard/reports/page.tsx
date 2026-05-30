"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { logDevError, parseApiError } from "@/lib/user-messages";

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
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadSessions = useCallback(() => {
    setPageError(null);
    fetch("/api/sessions")
      .then(async (r) => {
        if (!r.ok) {
          setPageError(await parseApiError(r));
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        const list = (d.sessions || []) as Session[];
        setSessions(
          list.filter((s) => s.status === "COMPLETED" || s.status === "ARCHIVED")
        );
      })
      .catch((e) => {
        logDevError("reports/load", e);
        setPageError(
          "Unable to load reports. Please refresh the page."
        );
      });
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  async function exportPdf(sessionId: string) {
    setLoading(sessionId);
    setActionError(null);
    try {
      const res = await fetch(`/api/reports/${sessionId}`, { method: "POST" });
      if (!res.ok) {
        setActionError(await parseApiError(res));
        return;
      }
      const data = await res.json();
      if (data.pdf) {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${data.pdf}`;
        link.download = data.filename || "pitch-report.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        setActionError(
          "Unable to download the report. Please try again in a moment."
        );
      }
    } catch (e) {
      logDevError("reports/export", e);
      setActionError(
        "Unable to download the report. Please check your connection and try again."
      );
    } finally {
      setLoading(null);
    }
  }

  async function deleteReport(sessionId: string, title: string) {
    if (
      !window.confirm(
        `Delete "${title}"? This permanently removes the session, transcript, and report.`
      )
    ) {
      return;
    }

    setDeleting(sessionId);
    setActionError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) {
        setActionError(await parseApiError(res));
        return;
      }
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (e) {
      logDevError("reports/delete", e);
      setActionError("Unable to delete this report. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="page-shell max-w-full">
      <h1 className="text-xl font-bold text-white sm:text-2xl">Reports</h1>
      <p className="mt-1 text-zinc-500">Export or delete pitch performance reports</p>

      {pageError && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {pageError}
        </p>
      )}
      {actionError && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {actionError}
        </p>
      )}

      <div className="mt-8 space-y-4">
        {sessions.length === 0 && !pageError ? (
          <GlassCard>
            <p className="py-8 text-center text-zinc-500">
              Complete a practice session to generate reports
            </p>
          </GlassCard>
        ) : (
          sessions.map((s) => (
            <GlassCard
              key={s.id}
              className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
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
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={loading === s.id || deleting === s.id}
                  onClick={() => exportPdf(s.id)}
                >
                  <Download className="h-4 w-4" />
                  {loading === s.id ? "Generating report…" : "Export PDF"}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full sm:w-auto"
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
