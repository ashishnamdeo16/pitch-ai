export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DashboardOverview } from "@/components/dashboard/overview-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let sessions: {
    id: string;
    title: string;
    overallScore: number | null;
    durationSeconds: number;
    fillerCount: number;
    createdAt: Date;
    mode: string;
  }[] = [];

  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });
    if (dbUser) {
      sessions = await prisma.pitchSession.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          overallScore: true,
          durationSeconds: true,
          fillerCount: true,
          createdAt: true,
          mode: true,
        },
      });
    }
  }

  return (
    <DashboardOverview
      userName={user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Founder"}
      sessions={sessions.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      }))}
      userId={user?.id ?? ""}
    />
  );
}
