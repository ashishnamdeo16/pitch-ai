import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { PracticeMirrorCleanup } from "@/components/practice/mirror-cleanup";
import { MeshBackground } from "@/components/ui/mesh-background";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[#09090b] lg:flex-row">
      <PracticeMirrorCleanup />
      <MeshBackground />
      <DashboardSidebar />
      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}
