"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PendingNavigation } from "@/components/orders/types/orderBuilderTypes";

interface UseUnsavedOrderNavigationArgs {
  enabled: boolean;
  isDirty: boolean;
}

export function useUnsavedOrderNavigation({ enabled, isDirty }: UseUnsavedOrderNavigationArgs) {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [leavePromptOpen, setLeavePromptOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const savedNavigation = useRef(false);
  const isDirtyRef = useRef(false);
  const hasHistoryGuard = useRef(false);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const requestNavigation = useCallback((next: PendingNavigation) => {
    if (!enabled || !isDirtyRef.current || savedNavigation.current) {
      startNavigation(() => {
        if (next.type === "href") router.push(next.href);
        else window.history.go(next.delta ?? -1);
      });
      return;
    }

    setPendingNavigation(next);
    setLeavePromptOpen(true);
  }, [enabled, router]);

  useEffect(() => {
    if (!enabled || !isDirty || savedNavigation.current || hasHistoryGuard.current) return;

    window.history.pushState({ __orderEditGuard: true }, "", window.location.href);
    hasHistoryGuard.current = true;
  }, [enabled, isDirty]);

  useEffect(() => {
    if (!enabled) return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current || savedNavigation.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const documentClick = (event: MouseEvent) => {
      if (!isDirtyRef.current || savedNavigation.current || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      if (target.target && target.target !== "_self") return;
      if (target.hasAttribute("download")) return;

      const url = new URL(target.href, window.location.href);
      if (url.origin !== window.location.origin || url.href === window.location.href) return;

      event.preventDefault();
      event.stopPropagation();
      requestNavigation({ type: "href", href: `${url.pathname}${url.search}${url.hash}` });
    };

    const popState = () => {
      if (!isDirtyRef.current || savedNavigation.current) return;
      window.history.pushState({ __orderEditGuard: true }, "", window.location.href);
      hasHistoryGuard.current = true;
      requestNavigation({ type: "back", delta: -2 });
    };

    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("popstate", popState);
    document.addEventListener("click", documentClick, true);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", popState);
      document.removeEventListener("click", documentClick, true);
    };
  }, [enabled, requestNavigation]);

  function closeLeavePrompt() {
    setLeavePromptOpen(false);
    setPendingNavigation(null);
  }

  function markSaved() {
    savedNavigation.current = true;
  }

  function leaveAnyway() {
    if (!pendingNavigation) return;
    markSaved();
    setLeavePromptOpen(false);
    startNavigation(() => {
      if (pendingNavigation.type === "href") router.push(pendingNavigation.href);
      else window.history.go(pendingNavigation.delta ?? -1);
    });
  }

  return {
    isNavigating,
    leavePromptOpen,
    pendingNavigation,
    requestNavigation,
    closeLeavePrompt,
    leaveAnyway,
    markSaved,
  };
}
