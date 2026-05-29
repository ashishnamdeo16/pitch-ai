"use client";

import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";
import { useSessionStore } from "@/store/session-store";

export function ActivityFeed() {
  const activity = useSessionStore((s) => s.activity);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
        <Activity className="h-3.5 w-3.5" />
        Live Activity
      </div>
      <div className="max-h-40 space-y-2 overflow-y-auto">
        {activity.length === 0 ? (
          <p className="text-xs text-zinc-600">No activity yet</p>
        ) : (
          activity.slice(0, 6).map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between gap-2 text-xs"
            >
              <span className="text-zinc-400">{a.message}</span>
              <span className="shrink-0 text-zinc-600">
                {formatDistanceToNow(a.timestamp, { addSuffix: true })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
