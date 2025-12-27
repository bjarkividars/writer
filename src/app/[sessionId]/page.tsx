import Workspace from "@/components/Workspace";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function SessionPage({ params }: PageProps) {
  const { sessionId } = await params;
  return (
    <main className="h-screen w-full bg-background">
      <Workspace initialSessionId={sessionId} />
    </main>
  );
}
