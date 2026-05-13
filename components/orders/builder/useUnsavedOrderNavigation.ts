"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PendingNavigation } from "@/components/orders/types/orderBuilderTypes";

interface UseUnsavedOrderNavigationArgs {
  enabled: boolean;
  isDirty: boolean;
}

export function useUnsavedOrderNavigation({ enabled, isDirty }: UseUnsavedOrderNavigationArgs) {
  const router = useRouter();
  const [leavePromptOpen, setLeavePromptOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const savedNavigation = useRef(false);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const requestNavigation = useCallback((next: PendingNavigation) => {
    if (!enabled || !isDirtyRef.current || savedNavigation.current) {
      if (next.type === "href") router.push(next.href);
      else window.history.back();
      return;
    }

    setPendingNavigation(next);
    setLeavePromptOpen(true);
  }, [enabled, router]);

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
      window.history.pushState(null, "", window.location.href);
      requestNavigation({ type: "back" });
    };

    window.history.replaceState(window.history.state, "", window.location.href);
    window.history.pushState(null, "", window.location.href);
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
    if (pendingNavigation.type === "href") router.push(pendingNavigation.href);
    else window.history.back();
  }

  return {
    leavePromptOpen,
    pendingNavigation,
    requestNavigation,
    closeLeavePrompt,
    leaveAnyway,
    markSaved,
  };
}
