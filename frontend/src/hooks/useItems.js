/**
 * Custom hooks for data fetching.
 * Provides a lightweight useQuery pattern without external libraries.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { listItems, createItem, updateItem, deleteItem, getItemByQr } from "../lib/api";

/**
 * Hook for fetching paginated, searchable item list.
 * Auto-refetches when page, limit, or search changes.
 */
export function useItems({ page = 1, limit = 10, q = "" } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetch = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const result = await listItems({ page, limit, q });
      setItems(result.data || []);
      setTotal(result.total || 0);
      setTotalPages(result.total_pages || 1);
    } catch (err) {
      if (err.name !== "CanceledError") {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [page, limit, q]);

  useEffect(() => {
    fetch();
    return () => abortRef.current?.abort();
  }, [fetch]);

  return { items, total, totalPages, loading, error, refetch: fetch };
}

/**
 * Hook for creating a new item.
 */
export function useCreateItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createItem(payload);
      return result;
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}

/**
 * Hook for looking up an item by QR code.
 */
export function useLookupItem() {
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async (qrCode) => {
    setLoading(true);
    try {
      const result = await getItemByQr(qrCode);
      return result;
    } catch {
      return null; // Not found is expected
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookup, loading };
}

/**
 * Hook for updating an item.
 */
export function useUpdateItem() {
  const [loading, setLoading] = useState(false);

  const update = useCallback(async (id, payload) => {
    setLoading(true);
    try {
      return await updateItem(id, payload);
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading };
}

/**
 * Hook for deleting an item.
 */
export function useDeleteItem() {
  const [loading, setLoading] = useState(false);

  const remove = useCallback(async (id) => {
    setLoading(true);
    try {
      return await deleteItem(id);
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading };
}
