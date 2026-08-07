import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationsApi";
import type { AppNotification } from "../types/catalog";

const PAGE_SIZE = 20;

interface State {
  items: AppNotification[];
  unread: number;
  page: number;
  totalPages: number;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
}

const INITIAL: State = {
  items: [],
  unread: 0,
  page: 0,
  totalPages: 0,
  loading: true,
  loadingMore: false,
  refreshing: false,
  error: null,
};

/** Notifications list + unread count with pagination and mark-read (BOOK-78). */
export function useNotifications() {
  const [state, setState] = useState<State>(INITIAL);
  const requestId = useRef(0);

  const loadPage = useCallback(async (page: number, mode: "initial" | "refresh" | "more") => {
    const id = ++requestId.current;
    setState((s) => ({
      ...s,
      loading: mode === "initial",
      refreshing: mode === "refresh",
      loadingMore: mode === "more",
      error: null,
    }));
    try {
      const [res, unread] = await Promise.all([
        fetchNotifications(page, PAGE_SIZE),
        page === 1 ? fetchUnreadCount() : Promise.resolve(-1),
      ]);
      if (id !== requestId.current) return;
      setState((s) => ({
        items: page === 1 ? res.items : [...s.items, ...res.items],
        unread: unread >= 0 ? unread : s.unread,
        page: res.meta.currentPage,
        totalPages: res.meta.totalPages,
        loading: false,
        loadingMore: false,
        refreshing: false,
        error: null,
      }));
    } catch (err) {
      if (id !== requestId.current) return;
      setState((s) => ({
        ...s,
        loading: false,
        loadingMore: false,
        refreshing: false,
        error: err instanceof Error ? err.message : "Could not load notifications.",
      }));
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void loadPage(1, "initial"), 0);
    return () => clearTimeout(t);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    setState((s) => {
      if (s.loading || s.loadingMore || s.refreshing || s.page >= s.totalPages) return s;
      void loadPage(s.page + 1, "more");
      return s;
    });
  }, [loadPage]);

  const markRead = useCallback((id: string) => {
    setState((s) => {
      const item = s.items.find((n) => n.id === id);
      if (!item || item.read) return s;
      return {
        ...s,
        items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
        unread: Math.max(0, s.unread - 1),
      };
    });
    void markNotificationRead(id).catch(() => {});
  }, []);

  const markAll = useCallback(() => {
    setState((s) => ({ ...s, items: s.items.map((n) => ({ ...n, read: true })), unread: 0 }));
    void markAllNotificationsRead().catch(() => {});
  }, []);

  return {
    ...state,
    loadMore,
    markRead,
    markAll,
    refresh: () => loadPage(1, "refresh"),
    retry: () => loadPage(1, "initial"),
  };
}
