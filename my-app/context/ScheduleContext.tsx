'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/context/AuthContext';
import type { ScheduleRecord } from '@/types/domain';

type ScheduleInput = {
  userId?: number | null;
  teamId?: number | null;
  date: string;
  startTime: string;
  endTime: string;
  title?: string | null;
  description?: string | null;
};

type ScheduleUpdateInput = Partial<ScheduleInput> & {
  status?: 'ACTIVE' | 'CANCELLED';
};

type ScheduleContextValue = {
  schedules: ScheduleRecord[];
  loading: boolean;
  error: string | null;
  refreshSchedules: () => Promise<void>;
  createSchedule: (input: ScheduleInput) => Promise<ScheduleRecord>;
  updateSchedule: (id: number, input: ScheduleUpdateInput) => Promise<ScheduleRecord>;
  cancelSchedule: (id: number) => Promise<ScheduleRecord>;
};

const ScheduleContext = createContext<ScheduleContextValue | undefined>(undefined);

async function readJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSchedules = useCallback(async (): Promise<void> => {
    if (!user) {
      setSchedules([]);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/schedules', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      const payload = await readJson<{ success: boolean; data?: { schedules?: ScheduleRecord[] }; message?: string }>(response);

      if (!response.ok) {
        throw new Error(payload?.message ?? 'No fue posible cargar los horarios.');
      }

      setSchedules(payload?.data?.schedules ?? []);
      setError(null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'No fue posible cargar los horarios.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createSchedule = useCallback(async (input: ScheduleInput): Promise<ScheduleRecord> => {
    const response = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const payload = await readJson<{ success: boolean; data?: { schedule?: ScheduleRecord }; message?: string }>(response);

    if (!response.ok || !payload?.data?.schedule) {
      throw new Error(payload?.message ?? 'No fue posible crear el horario.');
    }

    await refreshSchedules();
    return payload.data.schedule;
  }, [refreshSchedules]);

  const updateSchedule = useCallback(async (id: number, input: ScheduleUpdateInput): Promise<ScheduleRecord> => {
    const response = await fetch(`/api/schedules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const payload = await readJson<{ success: boolean; data?: { schedule?: ScheduleRecord }; message?: string }>(response);

    if (!response.ok || !payload?.data?.schedule) {
      throw new Error(payload?.message ?? 'No fue posible actualizar el horario.');
    }

    await refreshSchedules();
    return payload.data.schedule;
  }, [refreshSchedules]);

  const cancelSchedule = useCallback(async (id: number): Promise<ScheduleRecord> => {
    const response = await fetch(`/api/schedules/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    const payload = await readJson<{ success: boolean; data?: { schedule?: ScheduleRecord }; message?: string }>(response);

    if (!response.ok || !payload?.data?.schedule) {
      throw new Error(payload?.message ?? 'No fue posible cancelar el horario.');
    }

    await refreshSchedules();
    return payload.data.schedule;
  }, [refreshSchedules]);

  useEffect(() => {
    if (!authLoading) {
      const timer = window.setTimeout(() => {
        void refreshSchedules();
      }, 0);

      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [authLoading, refreshSchedules]);

  return (
    <ScheduleContext.Provider
      value={{
        schedules,
        loading,
        error,
        refreshSchedules,
        createSchedule,
        updateSchedule,
        cancelSchedule,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedules() {
  const context = useContext(ScheduleContext);

  if (!context) {
    throw new Error('useSchedules debe usarse dentro de ScheduleProvider.');
  }

  return context;
}
