"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { wasRecentLocalMutation } from "@/lib/client/local-mutation";

const REFRESH_DEBOUNCE_MS = 350;

export function AppRealtimeRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingWhileHiddenRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    function refreshCurrentRoute() {
      if (wasRecentLocalMutation()) return;

      if (document.visibilityState !== "visible") {
        pendingWhileHiddenRef.current = true;
        return;
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        startTransition(async () => {
          await fetch("/api/app-revalidate", {
            method: "POST",
            cache: "no-store",
          });
          router.refresh();
        });
      }, REFRESH_DEBOUNCE_MS);
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible" || !pendingWhileHiddenRef.current) return;
      pendingWhileHiddenRef.current = false;
      refreshCurrentRoute();
    }

    const channel = supabase
      .channel("app-data-invalidations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "app_realtime_events",
        },
        refreshCurrentRoute
      )
      .subscribe();

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [pathname, router]);

  return isPending ? <span className="sr-only">Yangilanmoqda...</span> : null;
}
