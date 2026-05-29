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
    <div className="relative flex h-screen overflow-hidden bg-[#09090b]">
      <PracticeMirrorCleanup />
      <MeshBackground />
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}
