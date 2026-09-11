import { AccessCode, Question, QuizResult, PlatformSettings } from '../types.ts';

const DEVICE_KEY = 'abaqera_device_v1';
const SESSION_KEY = 'abaqera_session_v1';

export function getDeviceId(): string {
  let dev = localStorage.getItem(DEVICE_KEY);
  if (!dev) {
    dev = 'DEV-' + crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, dev);
  }
  return dev;
}

export function getSavedSession(): string {
  return localStorage.getItem(SESSION_KEY) || '';
}

export function setSavedSession(code: string | null) {
  if (code) {
    localStorage.setItem(SESSION_KEY, code.toUpperCase().trim());
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export async function verifyAccessCode(code: string): Promise<{
  valid: boolean;
  message?: string;
  deviceLocked?: boolean;
  code?: string;
  branch?: string;
  kind?: 'sub' | 'trial' | 'admin';
  isAdmin?: boolean;
  expiresAt?: number | null;
  points?: number;
  credits?: number;
  deviceId?: string;
}> {
  const deviceId = getDeviceId();
  const res = await fetch('/api/auth/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code.toUpperCase().trim(), deviceId })
  });
  return res.json();
}

export async function fetchPlatformStats(): Promise<{
  totalQuestions: number;
  totalCodes: number;
  totalResults: number;
  activeSubscribers: number;
  memoryUsageMB: number;
  heapUsedMB: number;
  highCapacityBenchmark: {
    maxSupportedQuestions: string;
    concurrentUsersTarget: string;
    dailyPdfCapacity: string;
    dailyQuestionCreationCapacity: string;
  };
}> {
  const res = await fetch('/api/stats');
  return res.json();
}

export async function fetchQuestions(params: {
  branch?: string;
  subject?: string;
  unit?: string;
  lesson?: string;
  search?: string;
  limit?: number;
  offset?: number;
  random?: boolean;
}): Promise<{ questions: Question[]; total: number }> {
  const q = new URLSearchParams();
  if (params.branch) q.set('branch', params.branch);
  if (params.subject) q.set('subject', params.subject);
  if (params.unit) q.set('unit', params.unit);
  if (params.lesson) q.set('lesson', params.lesson);
  if (params.search) q.set('search', params.search);
  if (params.limit) q.set('limit', String(params.limit));
  if (params.offset) q.set('offset', String(params.offset));
  if (params.random) q.set('random', 'true');

  const res = await fetch(`/api/questions?${q.toString()}`);
  return res.json();
}

export async function importQuestionsBatch(payload: {
  questions: Partial<Question>[];
  defaultBranch?: string;
  defaultSubject?: string;
  defaultUnit?: string;
}): Promise<{
  success: boolean;
  added: number;
  skipped: number;
  totalInDb: number;
  timeMs: number;
}> {
  const res = await fetch('/api/questions/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function deleteQuestionApi(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function generateAiQuestionsApi(payload: {
  branch: string;
  subject: string;
  unit: string;
  lesson?: string;
  count: number;
  difficulty?: string;
  autoSave?: boolean;
}): Promise<{
  success: boolean;
  questions: any[];
  savedCount?: number;
  message?: string;
}> {
  const res = await fetch('/api/ai/generate-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchCodesApi(): Promise<AccessCode[]> {
  const res = await fetch('/api/codes');
  return res.json();
}

export async function generateBulkCodesApi(payload: {
  branch: string;
  kind: 'sub' | 'trial';
  count: number;
  days?: number;
  credits?: number;
}): Promise<{
  success: boolean;
  count: number;
  codes: AccessCode[];
}> {
  const res = await fetch('/api/codes/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function renewCodeApi(code: string, days: number): Promise<{ success: boolean; code?: AccessCode }> {
  const res = await fetch('/api/codes/renew', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, days })
  });
  return res.json();
}

export async function resetDeviceApi(code: string): Promise<{ success: boolean; message: string; code?: AccessCode }> {
  const res = await fetch('/api/codes/reset-device', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  return res.json();
}

export async function toggleCodeApi(code: string): Promise<{ success: boolean; disabled: boolean }> {
  const res = await fetch('/api/codes/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  return res.json();
}

export async function submitQuizResultApi(payload: {
  code: string;
  branch: string;
  subject: string;
  unit: string;
  lesson?: string;
  score: number;
  total: number;
  durationSeconds: number;
  answersSummary?: any[];
}): Promise<{ success: boolean; id: string }> {
  const res = await fetch('/api/results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchResultsApi(code?: string): Promise<QuizResult[]> {
  const url = code ? `/api/results?code=${encodeURIComponent(code)}` : '/api/results';
  const res = await fetch(url);
  return res.json();
}

export async function verifyAdminPinApi(pin: string): Promise<{ valid: boolean }> {
  const res = await fetch('/api/admin/verify-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin })
  });
  return res.json();
}

export async function fetchAdminSettingsApi(): Promise<{ settings: PlatformSettings; hasPinSet: boolean }> {
  const res = await fetch('/api/admin/settings');
  return res.json();
}

export async function updateAdminSettingsApi(payload: any): Promise<{ success: boolean; settings?: PlatformSettings }> {
  const res = await fetch('/api/admin/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function runStressBenchmarkApi(count: number): Promise<{
  success: boolean;
  addedSynthetic: number;
  totalQuestionsNow: number;
  indexingDurationMs: number;
  throughputPerSecond: number;
}> {
  const res = await fetch('/api/admin/benchmark', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count })
  });
  return res.json();
}

export async function restoreBackupApi(payload: any): Promise<{
  success: boolean;
  questionsRestored: number;
  codesRestored: number;
  resultsRestored: number;
}> {
  const res = await fetch('/api/admin/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function adminLoginApi(credentials: { username?: string; password?: string; code?: string }): Promise<{
  success: boolean;
  isAdmin?: boolean;
  code?: string;
  branch?: string;
  role?: string;
  message?: string;
}> {
  const res = await fetch('/api/auth/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return res.json();
}

export async function clearAllQuestionsApi(): Promise<{
  success: boolean;
  cleared: number;
  totalNow: number;
}> {
  const res = await fetch('/api/admin/clear-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}
