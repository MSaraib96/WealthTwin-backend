"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

export function useApiQuery<T>(path: string, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(enabled);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      setData(await apiFetch<T>(path));
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError : new Error("Unable to load this workspace."));
    } finally {
      setLoading(false);
    }
  }, [enabled, path]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    apiFetch<T>(path)
      .then((response) => {
        if (active) setData(response);
      })
      .catch((queryError) => {
        if (active) setError(queryError instanceof Error ? queryError : new Error("Unable to load this workspace."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [enabled, path]);

  return { data, error, loading, reload };
}
