"use client";

/**
 * React hooks for PocketBase integration
 *
 * This file provides React hooks for using PocketBase in client components.
 */

import { useCallback, useEffect, useState } from "react";
import pb, {
  isAuthenticated,
  getCurrentUser,
  logout,
  loginWithEmailAndPassword,
  registerWithEmailAndPassword,
} from "@repo/db";
import type { Record } from "pocketbase";

/**
 * Hook for authentication state and actions
 */
export function useAuth() {
  const [authState, setAuthState] = useState({
    isAuthenticated: isAuthenticated(),
    user: getCurrentUser(),
    loading: false,
    error: null as Error | null,
  });

  useEffect(() => {
    // Update auth state when it changes
    const unsubscribe = pb.authStore.onChange(() => {
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: isAuthenticated(),
        user: getCurrentUser(),
      }));
    });

    // Cleanup on unmount
    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await loginWithEmailAndPassword(email, password);
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        user: result.record,
        isAuthenticated: true,
      }));
      return result;
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
      throw error;
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, passwordConfirm: string) => {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const result = await registerWithEmailAndPassword(
          email,
          password,
          passwordConfirm
        );
        setAuthState((prev) => ({
          ...prev,
          loading: false,
        }));
        return result;
      } catch (error) {
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: error as Error,
        }));
        throw error;
      }
    },
    []
  );

  const logoutUser = useCallback(() => {
    logout();
    setAuthState((prev) => ({
      ...prev,
      isAuthenticated: false,
      user: null,
    }));
  }, []);

  return {
    ...authState,
    login,
    register,
    logout: logoutUser,
  };
}

/**
 * Hook for fetching and subscribing to a single record
 */
export function useRecord<T extends Record>(
  collectionName: string,
  recordId: string,
  options = { realtime: true }
) {
  const [record, setRecord] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const fetchRecord = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await pb.collection(collectionName).getOne<T>(recordId);
        setRecord(result);

        // Subscribe to realtime changes if requested
        if (options.realtime) {
          unsubscribe = pb
            .collection(collectionName)
            .subscribe<T>(recordId, (data) => {
              setRecord(data.record);
            });
        }
      } catch (error) {
        console.error(`Error fetching ${collectionName} record:`, error);
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch the record
    fetchRecord();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [collectionName, recordId, options.realtime]);

  return { record, loading, error };
}

/**
 * Hook for fetching and subscribing to a list of records
 */
export function useRecordList<T extends Record>(
  collectionName: string,
  options = {
    filter: "",
    sort: "-created",
    page: 1,
    perPage: 20,
    realtime: true,
  }
) {
  const [records, setRecords] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const fetchRecords = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await pb
          .collection(collectionName)
          .getList<T>(options.page, options.perPage, {
            filter: options.filter,
            sort: options.sort,
          });

        setRecords(result.items);
        setTotalPages(result.totalPages);
        setTotalItems(result.totalItems);

        // Subscribe to realtime changes if requested
        if (options.realtime) {
          unsubscribe = pb.collection(collectionName).subscribe<T>("*", () => {
            // Re-fetch the list when any record changes
            // This is a simple approach - for more complex cases,
            // you might want to update the records array directly
            fetchRecords();
          });
        }
      } catch (error) {
        console.error(`Error fetching ${collectionName} records:`, error);
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch records
    fetchRecords();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [
    collectionName,
    options.filter,
    options.sort,
    options.page,
    options.perPage,
    options.realtime,
  ]);

  return { records, loading, error, totalPages, totalItems };
}
