import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { readJson, storage } from "../lib/storage";
import type { AttendanceEvent, CacheSnapshot, StudentRecord } from "../lib/types";

const cacheKey = "eventpass.volunteer.cache";

interface CacheContextValue {
  recentStudents: StudentRecord[];
  attendanceEvents: AttendanceEvent[];
  pendingCount: number;
  cacheStudent: (student: StudentRecord) => Promise<void>;
  recordAttendance: (input: {
    student: StudentRecord;
    action: "entry" | "exit";
    method: "qr" | "barcode" | "manual";
  }) => Promise<void>;
  clearCache: () => Promise<void>;
  findStudents: (query: string) => StudentRecord[];
}

const CacheContext = createContext<CacheContextValue | null>(null);

const emptyCache: CacheSnapshot = {
  students: [],
  attendanceEvents: []
};

export const CacheProvider = ({ children }: { children: React.ReactNode }) => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [attendanceEvents, setAttendanceEvents] = useState<AttendanceEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void (async () => {
      const snapshot = await readJson<CacheSnapshot>(cacheKey, emptyCache);
      setStudents(snapshot.students);
      setAttendanceEvents(snapshot.attendanceEvents);
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void storage.set(cacheKey, JSON.stringify({ students, attendanceEvents }));
  }, [attendanceEvents, hydrated, students]);

  const cacheStudent = useCallback(
    async (student: StudentRecord) => {
      const normalized = student.registrationId.toUpperCase();
      setStudents((current) => {
        const next = [
          { ...student, registrationId: normalized },
          ...current.filter((item) => item.registrationId !== normalized)
        ].slice(0, 30);
        return next;
      });
    },
    []
  );

  const recordAttendance = useCallback(
    async ({
      student,
      action,
      method
    }: {
      student: StudentRecord;
      action: "entry" | "exit";
      method: "qr" | "barcode" | "manual";
    }) => {
      const event: AttendanceEvent = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        registrationId: student.registrationId,
        studentName: student.studentName,
        eventName: student.eventName,
        action,
        method,
        createdAt: new Date().toISOString(),
        synced: false
      };

      setAttendanceEvents((current) => {
        const next = [event, ...current].slice(0, 60);
        return next;
      });

      setStudents((current) =>
        current.map((item) =>
          item.registrationId === student.registrationId
            ? {
                ...item,
                attendanceStatus: action === "entry" ? "checked_in" : "checked_out",
                updatedAt: event.createdAt
              }
            : item
        )
      );
    },
    []
  );

  const clearCache = useCallback(async () => {
    setStudents([]);
    setAttendanceEvents([]);
    await storage.remove(cacheKey);
  }, []);

  const findStudents = useCallback(
    (query: string) => {
      const normalized = query.trim().toUpperCase();
      if (!normalized) {
        return students;
      }

      return students.filter((student) =>
        [
          student.registrationId,
          student.studentName,
          student.eventName,
          student.venue,
          student.verificationStatus,
          student.attendanceStatus
        ].some((value) => value.toUpperCase().includes(normalized))
      );
    },
    [students]
  );

  const pendingCount = attendanceEvents.filter((event) => !event.synced).length;

  const value = useMemo<CacheContextValue>(
    () => ({
      recentStudents: students,
      attendanceEvents,
      pendingCount,
      cacheStudent,
      recordAttendance,
      clearCache,
      findStudents
    }),
    [attendanceEvents, cacheStudent, clearCache, findStudents, pendingCount, recordAttendance, students]
  );

  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
};

export const useCache = () => {
  const value = useContext(CacheContext);
  if (!value) {
    throw new Error("useCache must be used inside CacheProvider");
  }
  return value;
};
