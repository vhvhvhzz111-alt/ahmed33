export type BranchType = 
  | 'علمي علوم'
  | 'علمي رياضة'
  | 'أدبي'
  | 'أزهر علمي'
  | 'أزهر أدبي'
  | 'أزهر عام';

export interface SubjectMeta {
  name: string;
  icon: string;
  defaultSections: string[];
}

export interface Question {
  id: string;
  branch?: string;
  subject: string;
  unit: string;
  l1?: string;
  lesson?: string;
  l2?: string;
  question: string;
  q_text?: string;
  options: string[];
  correctAnswer: number;
  correct_opt?: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  createdAt?: number;
  question_type?: 'mcq' | 'challenge' | 'essay';
  type?: string;
  model_answer?: string;
  keywords?: string[];
  diagram?: any;
  layout?: any;
  path?: string[];
}

export interface AccessCode {
  code: string;
  branch: string;
  kind: 'sub' | 'trial' | 'admin';
  isAdmin?: boolean;
  createdAt: number;
  expiresAt: number | null;
  durationDays?: number;
  durationMinutes?: number;
  disabled: boolean;
  deviceId: string;
  mobileDeviceId?: string;
  desktopDeviceId?: string;
  firstUsedAt?: number;
  deviceResetAt?: number;
  points: number;
  credits: number;
  note?: string;
}

export interface QuizResult {
  id: string;
  code: string;
  branch: string;
  subject: string;
  unit: string;
  lesson?: string;
  score: number;
  total: number;
  durationSeconds: number;
  createdAt: number;
  answersSummary?: { qid: string; ok: boolean; selected: number; correct: number }[];
}

export interface PlatformSettings {
  siteName: string;
  allowTrial: boolean;
  trialMinutes: number;
  allowPdf: boolean;
  allowImages: boolean;
  pdfCover: boolean;
  pdfTitle: boolean;
  questionsPerPage: number;
}

export interface ExportConfig {
  mode: 'pdf' | 'images';
  subject: string;
  unit: string;
  lesson?: string;
  count: number;
  order: 'random' | 'normal';
  showAnswers: boolean;
  showExplanations: boolean;
  questionsPerPage: number;
  coverPage: boolean;
}
