import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
  correctAnswer: number; // 0-based index
  correct_opt?: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  createdAt: number;
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
  adminPin: string;
  masterAdminCode: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'platform_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create data dir:', e);
  }
}

// In-Memory fast indexing structures to support 500,000 questions with sub-millisecond lookups
class FastDatabaseEngine {
  private questionsMap = new Map<string, Question>();
  private questionsBySubject = new Map<string, string[]>(); // subject -> ids
  private questionsBySubjectUnit = new Map<string, string[]>(); // `${subject}:::${unit}` -> ids
  private questionsByBranch = new Map<string, string[]>(); // branch -> ids
  
  public codes = new Map<string, AccessCode>();
  public results: QuizResult[] = [];
  public settings: PlatformSettings = {
    siteName: 'منصة العباقرة 2027',
    allowTrial: true,
    trialMinutes: 60,
    allowPdf: true,
    allowImages: true,
    pdfCover: true,
    pdfTitle: true,
    questionsPerPage: 5,
    adminPin: '2027',
    masterAdminCode: 'aljarh123**'
  };

  private dirty = false;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadFromDisk();
    // Flush dirty writes every 5 seconds to minimize IO during high ingestion
    setInterval(() => {
      if (this.dirty) {
        this.saveToDisk();
      }
    }, 5000);
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data.settings) this.settings = { ...this.settings, ...data.settings };
        if (Array.isArray(data.codes)) {
          for (const c of data.codes) this.codes.set(c.code.toUpperCase(), c);
        }
        if (Array.isArray(data.results)) {
          this.results = data.results;
        }
        if (Array.isArray(data.questions)) {
          this.addQuestionsBatch(data.questions, false);
        }
      } else {
        // Seed default starter questions & demo codes
        this.seedInitialData();
        this.saveToDisk();
      }
    } catch (e) {
      console.error('Error loading database:', e);
      this.seedInitialData();
    }
  }

  public saveToDisk() {
    try {
      const data = {
        settings: this.settings,
        codes: Array.from(this.codes.values()),
        results: this.results.slice(-5000), // persist recent 5000 results
        questions: Array.from(this.questionsMap.values())
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data), 'utf-8');
      this.dirty = false;
    } catch (e) {
      console.error('Error saving to disk:', e);
    }
  }

  private markDirty() {
    this.dirty = true;
  }

  // Question Indexing methods
  public addQuestionsBatch(list: Partial<Question>[], markDirty = true): { added: number; skipped: number } {
    let added = 0;
    let skipped = 0;

    for (const item of list) {
      const anyItem = item as any;
      const qText = item.q_text || item.question || anyItem['السؤال'] || anyItem['نص السؤال'] || anyItem['سؤال'] || anyItem['text'] || '';
      if (!qText.trim()) {
        skipped++;
        continue;
      }

      const id = item.id || crypto.randomUUID();
      const subject = (item.subject || anyItem['المادة'] || anyItem['مادة'] || 'عام').trim();
      const unit = (item.unit || item.l1 || anyItem['الوحدة'] || anyItem['الباب'] || anyItem['الفصل'] || 'عام').trim();
      const lesson = (item.lesson || item.l2 || anyItem['الدرس'] || '').trim();
      const branch = (item.branch || anyItem['الشعبة'] || '').trim();

      let opts = item.options;
      if (!opts || !Array.isArray(opts) || opts.length === 0) {
        if (Array.isArray(anyItem['الخيارات'])) {
          opts = anyItem['الخيارات'];
        } else if (Array.isArray(anyItem['الاختيارات'])) {
          opts = anyItem['الاختيارات'];
        } else if (anyItem['أ'] !== undefined || anyItem['ب'] !== undefined) {
          opts = [anyItem['أ'], anyItem['ب'], anyItem['ج'], anyItem['د']].filter(Boolean);
        } else if (anyItem['خيار 1'] !== undefined || anyItem['خيار 2'] !== undefined) {
          opts = [anyItem['خيار 1'], anyItem['خيار 2'], anyItem['خيار 3'], anyItem['خيار 4']].filter(Boolean);
        } else {
          opts = [anyItem.opt1, anyItem.opt2, anyItem.opt3, anyItem.opt4].filter(Boolean);
        }
      }

      const qType = (item.question_type || item.type || anyItem['النوع'] || 'mcq').toLowerCase() as ('mcq' | 'challenge' | 'essay');
      if (qType !== 'essay' && opts.length < 2) {
        opts = ['أ', 'ب', 'ج', 'د'];
      } else if (qType === 'essay' && opts.length === 0) {
        opts = [];
      }

      let correct = 0;
      const rawAns = item.correctAnswer !== undefined 
        ? item.correctAnswer 
        : (item.correct_opt !== undefined 
          ? item.correct_opt 
          : (anyItem.correct !== undefined 
            ? anyItem.correct 
            : (anyItem['الإجابة'] !== undefined 
              ? anyItem['الإجابة'] 
              : (anyItem['الاجابة'] !== undefined 
                ? anyItem['الاجابة'] 
                : anyItem['الإجابة الصحيحة']))));

      if (typeof rawAns === 'number') {
        correct = item.correct_opt !== undefined && rawAns >= 1 && rawAns <= 4 ? rawAns - 1 : rawAns;
      } else if (typeof rawAns === 'string') {
        const s = rawAns.trim().toLowerCase();
        if (s === 'أ' || s === 'a' || s === '1' || s === 'الخيار الأول') correct = 0;
        else if (s === 'ب' || s === 'b' || s === '2' || s === 'الخيار الثاني') correct = 1;
        else if (s === 'ج' || s === 'c' || s === '3' || s === 'الخيار الثالث') correct = 2;
        else if (s === 'د' || s === 'd' || s === '4' || s === 'الخيار الرابع') correct = 3;
        else {
          const parsed = parseInt(s, 10);
          if (!isNaN(parsed)) correct = parsed >= 1 && parsed <= 4 ? parsed - 1 : Math.max(0, parsed);
        }
      }
      correct = Math.max(0, Math.min(Math.max(0, opts.length - 1), correct));

      const question: Question = {
        id,
        branch,
        subject,
        unit,
        l1: unit,
        lesson,
        l2: lesson,
        question: qText,
        q_text: qText,
        options: opts,
        correctAnswer: correct,
        explanation: item.explanation || anyItem['الشرح'] || anyItem['تفسير'] || anyItem['التوضيح'] || '',
        difficulty: item.difficulty || anyItem['الصعوبة'] || 'medium',
        createdAt: item.createdAt || Date.now(),
        question_type: qType,
        type: qType,
        model_answer: item.model_answer || anyItem['الإجابة النموذجية'] || '',
        keywords: Array.isArray(item.keywords) ? item.keywords : [],
        diagram: item.diagram || null,
        layout: item.layout || null,
        path: Array.isArray(item.path) ? item.path : []
      };

      this.questionsMap.set(id, question);

      // Add to fast indices
      if (subject) {
        if (!this.questionsBySubject.has(subject)) this.questionsBySubject.set(subject, []);
        this.questionsBySubject.get(subject)!.push(id);
      }

      const subUnitKey = `${subject}:::${unit}`;
      if (!this.questionsBySubjectUnit.has(subUnitKey)) this.questionsBySubjectUnit.set(subUnitKey, []);
      this.questionsBySubjectUnit.get(subUnitKey)!.push(id);

      if (branch) {
        if (!this.questionsByBranch.has(branch)) this.questionsByBranch.set(branch, []);
        this.questionsByBranch.get(branch)!.push(id);
      }

      added++;
    }

    if (markDirty) this.markDirty();
    return { added, skipped };
  }

  public queryQuestions(params: {
    branch?: string;
    subject?: string;
    unit?: string;
    lesson?: string;
    search?: string;
    limit?: number;
    offset?: number;
    random?: boolean;
  }): { questions: Question[]; total: number } {
    let candidateIds: string[] = [];

    if (params.subject && params.unit) {
      candidateIds = this.questionsBySubjectUnit.get(`${params.subject.trim()}:::${params.unit.trim()}`) || [];
    } else if (params.subject) {
      candidateIds = this.questionsBySubject.get(params.subject.trim()) || [];
    } else if (params.branch) {
      candidateIds = this.questionsByBranch.get(params.branch.trim()) || [];
    } else {
      candidateIds = Array.from(this.questionsMap.keys());
    }

    let results: Question[] = [];
    const searchLower = params.search ? params.search.toLowerCase().trim() : '';
    const branchFilter = params.branch ? params.branch.trim() : '';
    const lessonFilter = params.lesson ? params.lesson.toLowerCase().trim() : '';

    for (const id of candidateIds) {
      const q = this.questionsMap.get(id);
      if (!q) continue;

      if (branchFilter && q.branch && q.branch !== branchFilter) continue;
      if (lessonFilter && q.lesson && !q.lesson.toLowerCase().includes(lessonFilter) && !lessonFilter.includes(q.lesson.toLowerCase())) continue;
      if (searchLower && !q.question.toLowerCase().includes(searchLower) && !(q.explanation && q.explanation.toLowerCase().includes(searchLower))) continue;

      results.push(q);
    }

    const total = results.length;

    if (params.random) {
      // Fisher-Yates sample
      for (let i = results.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [results[i], results[j]] = [results[j], results[i]];
      }
    }

    const offset = Math.max(0, params.offset || 0);
    const limit = Math.min(1000, Math.max(1, params.limit || 50));
    results = results.slice(offset, offset + limit);

    return { questions: results, total };
  }

  public getQuestionCount(): number {
    return this.questionsMap.size;
  }

  public getQuestionsCountBySubject(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [subject, ids] of this.questionsBySubject.entries()) {
      counts[subject] = ids.length;
    }
    return counts;
  }

  public getQuestionById(id: string): Question | undefined {
    return this.questionsMap.get(id);
  }

  public deleteQuestion(id: string): boolean {
    const q = this.questionsMap.get(id);
    if (!q) return false;
    this.questionsMap.delete(id);
    this.markDirty();
    return true;
  }

  public clearAllQuestions(): number {
    const count = this.questionsMap.size;
    this.questionsMap.clear();
    this.questionsBySubject.clear();
    this.questionsBySubjectUnit.clear();
    this.questionsByBranch.clear();
    this.markDirty();
    this.saveToDisk();
    return count;
  }

  // Code methods
  public getCode(code: string): AccessCode | undefined {
    const raw = (code || '').trim();
    if (!raw) return undefined;

    // Check master admin code (aljarh123** or configured masterAdminCode)
    const masterCodeKey = (this.settings.masterAdminCode || 'aljarh123**').trim();
    if (
      raw.toLowerCase() === 'aljarh123**' ||
      raw === 'aljarh123**' ||
      raw.toLowerCase() === masterCodeKey.toLowerCase()
    ) {
      let master = this.codes.get('aljarh123**') || this.codes.get(masterCodeKey);
      if (!master) {
        master = {
          code: 'aljarh123**',
          branch: 'كل الشُعب',
          kind: 'admin',
          isAdmin: true,
          createdAt: Date.now(),
          expiresAt: null,
          disabled: false,
          deviceId: '',
          mobileDeviceId: '',
          desktopDeviceId: '',
          points: 99999,
          credits: 99999,
          note: 'كود الإدارة الرئيسي المعتمد (هاتف واحد + لابتوب ويندوز واحد)'
        };
        this.codes.set('aljarh123**', master);
        this.markDirty();
      }
      return master;
    }

    const upper = raw.toUpperCase();
    if (this.codes.has(upper)) return this.codes.get(upper);

    for (const [key, c] of this.codes.entries()) {
      if (key.toLowerCase() === raw.toLowerCase() || c.code.toLowerCase() === raw.toLowerCase()) {
        return c;
      }
    }
    return undefined;
  }

  public saveCode(codeObj: AccessCode) {
    this.codes.set(codeObj.code, codeObj);
    this.codes.set(codeObj.code.toUpperCase().trim(), codeObj);
    this.markDirty();
  }

  public generateBulkCodes(opts: {
    branch: string;
    kind: 'sub' | 'trial';
    count: number;
    days?: number;
    credits?: number;
  }): AccessCode[] {
    const created: AccessCode[] = [];
    const prefix = opts.kind === 'trial' ? 'TRY' : 'ABQ';
    const now = Date.now();

    for (let i = 0; i < opts.count; i++) {
      const codeStr = `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const item: AccessCode = {
        code: codeStr,
        branch: opts.branch,
        kind: opts.kind,
        createdAt: now,
        expiresAt: null,
        durationDays: opts.kind === 'sub' ? (opts.days || 30) : undefined,
        durationMinutes: opts.kind === 'trial' ? 60 : undefined,
        disabled: false,
        deviceId: '',
        points: 0,
        credits: opts.credits || 0
      };
      this.codes.set(codeStr, item);
      created.push(item);
    }
    this.markDirty();
    return created;
  }

  public recordResult(res: QuizResult) {
    this.results.push(res);
    const codeObj = this.codes.get(res.code.toUpperCase());
    if (codeObj) {
      codeObj.points = (codeObj.points || 0) + res.score;
    }
    this.markDirty();
  }

  // Benchmark generator to test high capacity (e.g. creating 100,000 synthetic questions in memory)
  public generateBenchmarkLoad(count = 50000): { totalNow: number; durationMs: number } {
    const start = Date.now();
    const mockSubjects = ['اللغة العربية', 'الكيمياء', 'الفيزياء', 'الأحياء', 'التاريخ', 'الجغرافيا'];
    const mockUnits = ['الوحدة الأولى', 'الوحدة الثانية', 'الوحدة الثالثة', 'الباب الأول', 'الباب الثاني'];
    const mockBranches = ['علمي علوم', 'علمي رياضة', 'أدبي', 'أزهر علمي'];

    const batch: Partial<Question>[] = [];
    for (let i = 0; i < count; i++) {
      const s = mockSubjects[i % mockSubjects.length];
      const u = mockUnits[i % mockUnits.length];
      const b = mockBranches[i % mockBranches.length];
      batch.push({
        id: `synth_${i}_${Date.now()}`,
        branch: b,
        subject: s,
        unit: u,
        lesson: `درس تجريبي ${i % 10 + 1}`,
        question: `سؤال محاكاة رقم #${i + 1}: ما هو الناتج النموذجي للتجربة المعملية وفق منهج 2027؟`,
        options: [
          `الخيار الأول الممثل للناتج المباشر ${i % 5 + 1}`,
          `الخيار الثاني البديل المحتمل`,
          `الخيار الثالث المشروط بالاتزان`,
          `الخيار الرابع المستبعد علميًا`
        ],
        correctAnswer: (i % 4),
        explanation: `شرح تفصيلي للسؤال #${i + 1}: يعتمد الحل على قاعدة المنهج وتطبيق القانون الأساسي في ${s}.`,
        difficulty: (['easy', 'medium', 'hard'] as const)[i % 3],
        createdAt: Date.now()
      });
    }

    this.addQuestionsBatch(batch, false);
    const durationMs = Date.now() - start;
    return { totalNow: this.questionsMap.size, durationMs };
  }

  private seedInitialData() {
    // Generate initial demo codes & admin master codes
    const demoCodes: AccessCode[] = [
      {
        code: 'aljarh123**',
        branch: 'كل الشُعب',
        kind: 'admin',
        isAdmin: true,
        createdAt: Date.now(),
        expiresAt: null,
        disabled: false,
        deviceId: '',
        mobileDeviceId: '',
        desktopDeviceId: '',
        points: 99999,
        credits: 99999,
        note: 'كود الإدارة الرئيسي المعتمد (هاتف واحد + لابتوب ويندوز واحد)'
      },
      {
        code: 'ADMIN-2027',
        branch: 'كل الشُعب',
        kind: 'admin',
        isAdmin: true,
        createdAt: Date.now(),
        expiresAt: null,
        disabled: false,
        deviceId: '',
        points: 9999,
        credits: 9999,
        note: 'كود الإدارة الرئيسي المباشر'
      },
      {
        code: 'ADMIN-ABAQERA-2027',
        branch: 'كل الشُعب',
        kind: 'admin',
        isAdmin: true,
        createdAt: Date.now(),
        expiresAt: null,
        disabled: false,
        deviceId: '',
        points: 9999,
        credits: 9999,
        note: 'كود مشرف عام المنصة'
      },
      {
        code: 'ABQ-2027-SUPER',
        branch: 'علمي علوم',
        kind: 'sub',
        createdAt: Date.now(),
        expiresAt: Date.now() + 365 * 86400000,
        disabled: false,
        deviceId: '',
        points: 150,
        credits: 50,
        note: 'كود تجريبي مفتوح - علمي علوم'
      },
      {
        code: 'ABQ-MATH-2027',
        branch: 'علمي رياضة',
        kind: 'sub',
        createdAt: Date.now(),
        expiresAt: Date.now() + 365 * 86400000,
        disabled: false,
        deviceId: '',
        points: 90,
        credits: 50,
        note: 'كود تجريبي مفتوح - علمي رياضة'
      },
      {
        code: 'ABQ-ADAB-2027',
        branch: 'أدبي',
        kind: 'sub',
        createdAt: Date.now(),
        expiresAt: Date.now() + 365 * 86400000,
        disabled: false,
        deviceId: '',
        points: 80,
        credits: 50,
        note: 'كود تجريبي مفتوح - أدبي'
      },
      {
        code: 'TRY-FREE-HOUR',
        branch: 'علمي علوم',
        kind: 'trial',
        createdAt: Date.now(),
        expiresAt: null,
        durationMinutes: 60,
        disabled: false,
        deviceId: '',
        points: 0,
        credits: 5,
        note: 'كود تجربة مجانية ساعة واحدة'
      }
    ];

    for (const c of demoCodes) this.codes.set(c.code, c);
    // Initial bank is clean, ready for genuine question bank uploads
  }
}

export const db = new FastDatabaseEngine();
