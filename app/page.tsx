import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { isAuthEnabled } from "@/lib/web-auth";

export default function Home() {
  return (
    <Suspense>
      <AppShell authEnabled={isAuthEnabled()} />
    </Suspense>
  );
}
