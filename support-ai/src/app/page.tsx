import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

export default function Home() {
  const user = useUser();
  const router = useRouter();

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Support AI Assistant</h1>
        <Link href="/dashboard">
          <Button variant="secondary">Dashboard</Button>
        </Link>
      </div>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardTitle>Total conversations</CardTitle>
          <CardValue>0</CardValue>
        </Card>
        <Card>
          <CardTitle>Urgent cases</CardTitle>
          <CardValue>0</CardValue>
        </Card>
        <Card>
          <CardTitle>Angry customers</CardTitle>
          <CardValue>0</CardValue>
        </Card>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Chat</h2>
        {user ? (
          <Link href="/chat">
            <Button>Open Chat</Button>
          </Link>
        ) : (
          <Button onClick={() => router.push("/login")}>Login to Chat</Button>
        )}
        <div className="flex gap-2">
          <Badge intent="neutral">Neutral</Badge>
          <Badge intent="high">High</Badge>
          <Badge intent="critical">Critical</Badge>
        </div>
      </section>
    </main>
  );
}
