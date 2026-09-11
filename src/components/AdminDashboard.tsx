import React, { useState, useEffect } from 'react';
import { 
  AccessCode, 
  Question, 
  QuizResult, 
  PlatformSettings, 
  BranchType 
} from '../types.ts';
import { BRANCHES, SUBJECTS_BY_BRANCH, DETAILED_CURRICULUM, getCurriculumSections } from '../data/curriculum.ts';
import {
  fetchCodesApi,
  generateBulkCodesApi,
  renewCodeApi,
  resetDeviceApi,
  toggleCodeApi,
  fetchQuestions,
  importQuestionsBatch,
  deleteQuestionApi,
  generateAiQuestionsApi,
  fetchResultsApi,
  fetchAdminSettingsApi,
  updateAdminSettingsApi,
  runStressBenchmarkApi,
  restoreBackupApi,
  verifyAdminPinApi,
  fetchPlatformStats,
  clearAllQuestionsApi
} from '../services/api.ts';
import JSZip from 'jszip';
import {
  Shield,
  KeyRound,
  Layers,
  BarChart3,
  Settings,
  Cpu,
  Download,
  Upload,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Smartphone,
  X,
  FileSpreadsheet,
  Zap,
  Loader2,
  FileArchive
} from 'lucide-react';

interface AdminDashboardProps {
  onClose: () => void;
  siteName: string;
  onSettingsUpdated: () => void;
  isAdminAuthenticated?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onClose,
  siteName,
  onSettingsUpdated,
  isAdminAuthenticated = false
}) => {
  const [authenticated, setAuthenticated] = useState(isAdminAuthenticated || false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'codes' | 'questions' | 'results' | 'benchmark' | 'settings'>('codes');

  // Codes State
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [codeBranchFilter, setCodeBranchFilter] = useState<string>('all');
  const [codeSearch, setCodeSearch] = useState('');

  // Bulk Generator State
  const [bulkBranch, setBulkBranch] = useState<BranchType>('علمي علوم');
  const [bulkKind, setBulkKind] = useState<'sub' | 'trial'>('sub');
  const [bulkCount, setBulkCount] = useState<number>(1);
  const [bulkDays, setBulkDays] = useState<number>(30);
  const [bulkCredits, setBulkCredits] = useState<number>(0);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalQuestionsInDb, setTotalQuestionsInDb] = useState(0);
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionSubjectFilter, setQuestionSubjectFilter] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // AI Question Generation Form
  const [aiBranch, setAiBranch] = useState<BranchType>('علمي علوم');
  const [aiSubject, setAiSubject] = useState<string>('اللغة العربية');
  const [aiUnit, setAiUnit] = useState<string>('النحو');
  const [aiLesson, setAiLesson] = useState<string>('');
  const [aiCount, setAiCount] = useState<number>(5);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  // Results State
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  // Benchmark / High Capacity State
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [benchmarkCount, setBenchmarkCount] = useState<number>(25000);
  const [benchmarkRunning, setBenchmarkRunning] = useState(false);
  const [benchmarkOutcome, setBenchmarkOutcome] = useState<any>(null);

  // Settings State
  const [settings, setSettings] = useState<PlatformSettings>({
    siteName: 'منصة العباقرة 2027',
    allowTrial: true,
    trialMinutes: 60,
    allowPdf: true,
    allowImages: true,
    pdfCover: true,
    pdfTitle: true,
    questionsPerPage: 5
  });
  const [newPin, setNewPin] = useState('');
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // Verify PIN or Master Admin Code
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    const trimmed = pinInput.trim().toUpperCase();
    if (trimmed === 'ADMIN-2027' || trimmed === 'ADMIN-ABAQERA-2027') {
      setAuthenticated(true);
      return;
    }
    try {
      const res = await verifyAdminPinApi(pinInput.trim());
      if (res.valid) {
        setAuthenticated(true);
      } else {
        setPinError('رمز PIN أو كود الإدارة غير صحيح. رمز PIN الافتراضي 2027 أو كود ADMIN-2027');
      }
    } catch (e: any) {
      setPinError('خطأ أثناء التحقق: ' + e.message);
    }
  };

  // Load Data on Tab Switch
  useEffect(() => {
    if (!authenticated) return;

    if (activeTab === 'codes') {
      loadCodes();
    } else if (activeTab === 'questions') {
      loadQuestionsList();
    } else if (activeTab === 'results') {
      loadResults();
    } else if (activeTab === 'benchmark') {
      loadStats();
    } else if (activeTab === 'settings') {
      loadSettings();
    }
  }, [authenticated, activeTab]);

  const loadCodes = async () => {
    setLoadingCodes(true);
    try {
      const list = await fetchCodesApi();
      setCodes(list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCodes(false);
    }
  };

  const loadQuestionsList = async () => {
    setLoadingQuestions(true);
    try {
      const res = await fetchQuestions({
        search: questionSearch,
        subject: questionSubjectFilter || undefined,
        limit: 50
      });
      setQuestions(res.questions || []);
      setTotalQuestionsInDb(res.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadResults = async () => {
    setLoadingResults(true);
    try {
      const list = await fetchResultsApi();
      setResults(list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingResults(false);
    }
  };

  const loadStats = async () => {
    try {
      const s = await fetchPlatformStats();
      setPlatformStats(s);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetchAdminSettingsApi();
      if (res.settings) setSettings(res.settings);
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk Code Generation
  const handleBulkGenerate = async () => {
    setBulkGenerating(true);
    try {
      const res = await generateBulkCodesApi({
        branch: bulkBranch,
        kind: bulkKind,
        count: bulkCount,
        days: bulkDays,
        credits: bulkCredits
      });

      if (res.success) {
        alert(`تم إنشاء ${res.count} كود بنجاح.`);
        const codesListText = res.codes.map((c) => c.code).join('\n');
        navigator.clipboard?.writeText(codesListText);
        loadCodes();
      }
    } catch (e: any) {
      alert('خطأ أثناء إنشاء الأكواد: ' + e.message);
    } finally {
      setBulkGenerating(false);
    }
  };

  // Code Actions
  const handleRenewCode = async (code: string) => {
    const days = prompt('أدخل عدد الأيام المطلوب إضافتها لتجديد صلاحية الكود:', '30');
    if (!days || isNaN(+days) || +days <= 0) return;
    try {
      const res = await renewCodeApi(code, +days);
      if (res.success) {
        alert(`تم تجديد الكود ${code} لمدة ${days} يوم إضافية.`);
        loadCodes();
      }
    } catch (e: any) {
      alert('خطأ: ' + e.message);
    }
  };

  const handleResetDevice = async (code: string) => {
    if (
      !confirm(
        `تجديد الجهاز للكود (${code})؟\nسيتم فك ارتباط الجهاز القديم، وأول جهاز يدخل بالكود بعد ذلك سيصبح هو الجهاز المعتمد الجديد.`
      )
    )
      return;

    try {
      const res = await resetDeviceApi(code);
      if (res.success) {
        alert(res.message);
        loadCodes();
      }
    } catch (e: any) {
      alert('خطأ: ' + e.message);
    }
  };

  const handleToggleCode = async (code: string) => {
    try {
      const res = await toggleCodeApi(code);
      if (res.success) {
        loadCodes();
      }
    } catch (e: any) {
      alert('خطأ: ' + e.message);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    alert('تم نسخ الكود: ' + code);
  };

  // Export Codes CSV
  const handleExportCodesCsv = () => {
    const rows = [
      ['الكود', 'الشعبة', 'نوع الكود', 'تاريخ الإنشاء', 'تاريخ الانتهاء', 'مربوط بجهاز', 'الحالة', 'النقاط', 'الكريديت'],
      ...codes.map((c) => [
        c.code,
        c.branch,
        c.kind === 'trial' ? 'تجربة' : 'اشتراك',
        new Date(c.createdAt).toLocaleDateString('ar-EG'),
        c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('ar-EG') : 'بدون انتهاء',
        c.deviceId ? 'نعم' : 'لا',
        c.disabled ? 'موقوف' : 'فعال',
        c.points || 0,
        c.credits || 0
      ])
    ];

    const csvContent = '\ufeff' + rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadBlob('abaqera_codes.csv', csvContent, 'text/csv');
  };

  // Export Results CSV
  const handleExportResultsCsv = () => {
    const rows = [
      ['الكود', 'الشعبة', 'المادة', 'الوحدة / الباب', 'الدرجة', 'إجمالي الأسئلة', 'النسبة المئوية', 'المدة بالثواني', 'التاريخ'],
      ...results.map((r) => [
        r.code,
        r.branch,
        r.subject,
        r.unit,
        r.score,
        r.total,
        `${Math.round((r.score / (r.total || 1)) * 100)}%`,
        r.durationSeconds,
        new Date(r.createdAt).toLocaleString('ar-EG')
      ])
    ];

    const csvContent = '\ufeff' + rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadBlob('abaqera_exam_results.csv', csvContent, 'text/csv');
  };

  // File Bank Import (ZIP or JSON - supports AbqaraBank.zip & abqara.questions.v2)
  const handleImportBankFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportStatus('جاري فحص وقراءة بنك الأسئلة...');

    try {
      let extractedQuestions: Partial<Question>[] = [];
      let manifestInfo = '';

      if (file.name.toLowerCase().endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);
        let fileCount = 0;

        // Check for manifest.json
        if (zip.files['manifest.json']) {
          try {
            const mText = await zip.files['manifest.json'].async('text');
            const mData = JSON.parse(mText);
            manifestInfo = mData.bank_name ? ` [${mData.bank_name}]` : '';
          } catch (e) {
            console.warn('Could not parse manifest.json', e);
          }
        }

        for (const [filename, entry] of Object.entries(zip.files)) {
          if (entry.dir || !/\.(json|txt)$/i.test(filename)) continue;
          if (filename.toLowerCase().endsWith('manifest.json')) continue;

          fileCount++;
          try {
            const content = await entry.async('text');
            const parsed = JSON.parse(content);
            const pathParts = filename.replace(/\\/g, '/').split('/').filter((p) => p && !/\.(json|txt)$/i.test(p));

            // Guess subject & units from folder path if not specified in json
            const guessedSubject = pathParts.find((p) =>
              Object.values(SUBJECTS_BY_BRANCH)
                .flat()
                .some((s) => s.name === p)
            ) || (pathParts.length > 0 ? pathParts[0] : undefined);

            const guessedUnit = pathParts.length > 1 ? pathParts[1] : undefined;
            const guessedLesson = pathParts.length > 2 ? pathParts[2] : undefined;

            const items = extractQuestionsFromObject(parsed, guessedSubject, guessedUnit, guessedLesson);
            extractedQuestions.push(...items);
          } catch (err) {
            console.warn(`Error parsing file ${filename} inside zip:`, err);
          }
        }
        setImportStatus(`تم العثور على ${extractedQuestions.length} سؤال في ${fileCount} ملف${manifestInfo}. جاري الفهرسة والتخزين...`);
      } else {
        const content = await file.text();
        const parsed = JSON.parse(content);
        extractedQuestions = extractQuestionsFromObject(parsed);
      }

      if (extractedQuestions.length === 0) {
        throw new Error('لم يتم العثور على أسئلة بتنسيق صالح داخل الملف');
      }

      // Send batch to server
      const res = await importQuestionsBatch({
        questions: extractedQuestions,
        defaultBranch: 'علمي علوم'
      });

      setImportStatus(`✅ تم استيراد وفهرسة ${res.added} سؤال بنجاح!${manifestInfo} (تم تجاهل ${res.skipped} مكرر). المستغرق: ${res.timeMs}ms.`);
      loadQuestionsList();
      onSettingsUpdated();
    } catch (e: any) {
      setImportStatus(`❌ خطأ أثناء الاستيراد: ${e.message}`);
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };

  const extractQuestionsFromObject = (
    obj: any, 
    fallbackSubject?: string, 
    fallbackUnit?: string,
    fallbackLesson?: string
  ): Partial<Question>[] => {
    const list: Partial<Question>[] = [];

    const processItem = (
      q: any, 
      defaultSub = fallbackSubject, 
      defaultU = fallbackUnit, 
      defaultL = fallbackLesson,
      parentType?: string
    ) => {
      const qText = q.q_text || q.question || q.text;
      if (!qText) return;

      const qType = q.question_type || q.type || parentType || 'mcq';
      const isEssay = qType === 'essay';

      // Parse options
      let opts: string[] = [];
      if (!isEssay) {
        if (Array.isArray(q.options) && q.options.length > 0) {
          opts = q.options.map(String);
        } else if (q.opt1 !== undefined || q.opt2 !== undefined) {
          opts = [q.opt1, q.opt2, q.opt3, q.opt4].filter((v) => v !== undefined && v !== null).map(String);
        }
        if (opts.length < 2) {
          opts = ['أ', 'ب', 'ج', 'د'];
        }
      }

      // Parse correct answer (handles 1-based correct_opt: 1->0, 2->1, 3->2, 4->3)
      let correct = 0;
      if (typeof q.correct_opt === 'number') {
        correct = q.correct_opt >= 1 && q.correct_opt <= 4 ? q.correct_opt - 1 : q.correct_opt;
      } else if (typeof q.correctAnswer === 'number') {
        correct = q.correctAnswer;
      } else if (typeof q.correct === 'number') {
        correct = q.correct >= 1 && q.correct <= 4 ? q.correct - 1 : q.correct;
      }

      // Parse path: ["الباب الأول", "الدرس الأول"]
      let unit = defaultU;
      let lesson = defaultL;
      if (Array.isArray(q.path) && q.path.length > 0) {
        unit = q.path[0];
        lesson = q.path[1] || lesson;
      }

      list.push({
        subject: q.subject || defaultSub || 'عام',
        unit: q.unit || q.l1 || unit || 'الوحدة الأولى',
        lesson: q.lesson || q.l2 || lesson || '',
        question: qText,
        options: opts,
        correctAnswer: correct,
        explanation: q.explanation || '',
        branch: q.branch || '',
        question_type: qType as any,
        model_answer: q.model_answer || '',
        keywords: Array.isArray(q.keywords) ? q.keywords : [],
        diagram: q.diagram || '',
        layout: q.layout || 'list'
      });
    };

    if (Array.isArray(obj)) {
      obj.forEach((i) => processItem(i));
    } else if (obj && typeof obj === 'object') {
      const sub = obj.subject || fallbackSubject;
      let u = fallbackUnit;
      let l = fallbackLesson;

      if (Array.isArray(obj.path) && obj.path.length > 0) {
        u = obj.path[0];
        l = obj.path[1] || l;
      } else if (obj.unit) {
        u = obj.unit;
      }

      const pType = obj.question_type;

      if (Array.isArray(obj.questions)) obj.questions.forEach((i: any) => processItem(i, sub, u, l, pType));
      if (Array.isArray(obj.questions_v2)) obj.questions_v2.forEach((i: any) => processItem(i, sub, u, l, pType));
      if (Array.isArray(obj.challenge_questions)) obj.challenge_questions.forEach((i: any) => processItem(i, sub, u, l, 'challenge'));
      if (Array.isArray(obj.banks)) {
        obj.banks.forEach((b: any) => list.push(...extractQuestionsFromObject(b, sub, u, l)));
      }
    }

    return list;
  };

  // Download Sample AbqaraBank.zip template
  const handleDownloadSampleZip = async () => {
    try {
      const zip = new JSZip();

      // manifest.json
      const manifest = {
        bank_name: "بنك أسئلة العباقرة V41",
        version: "2.0",
        author: "إدارة منصة العباقرة 2027",
        total_subjects: 3,
        format: "abqara.questions.v2"
      };
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));

      // 1. Chemistry MCQ
      const chemistryQuestions = {
        schema: "abqara.questions.v2",
        subject: "الكيمياء",
        question_type: "mcq",
        path: ["الباب الأول: العناصر الانتقالية", "الدرس الأول: السلسلة الانتقالية الأولى"],
        questions: [
          {
            q_text: "أي من العناصر التالية يتميز بأعلى حالة تأكسد شائعة في السلسلة الانتقالية الأولى؟",
            opt1: "السكانديوم (Sc)",
            opt2: "المنجنيز (Mn)",
            opt3: "الحديد (Fe)",
            opt4: "النحاس (Cu)",
            correct_opt: 2,
            explanation: "المنجنيز يصل لأقصى حالة تأكسد وهي +7 بفقد جميع إلكترونات 4s و 3d.",
            layout: "2x2"
          },
          {
            q_text: "عنصر انتقالي ينتهي تركيبه الإلكتروني بـ 3d5 4s1 هو:",
            opt1: "الكروم (Cr)",
            opt2: "المنجنيز (Mn)",
            opt3: "الفاناديوم (V)",
            opt4: "التيتانيوم (Ti)",
            correct_opt: 1,
            explanation: "توزيع شاذ للكروم 24 لتكون أوربيتالات 3d نصف ممتلئة وأكثر استقراراً.",
            layout: "2x2"
          }
        ]
      };
      zip.file("الكيمياء/الباب الأول/الدرس الأول/questions.json", JSON.stringify(chemistryQuestions, null, 2));

      // 2. Arabic Grammar MCQ
      const arabicQuestions = {
        schema: "abqara.questions.v2",
        subject: "اللغة العربية",
        question_type: "mcq",
        path: ["النحو", "الوحدة الأولى: النطق والإملاء"],
        questions: [
          {
            q_text: "كلمة (استعان) همزتها همزة وصل لأنها:",
            opt1: "ماضي فعل خماسي",
            opt2: "ماضي فعل سداسي",
            opt3: "مصدر لفعل سداسي",
            opt4: "أمر لفعل سداسي",
            correct_opt: 2,
            explanation: "الفعل استعان ماضٍ مكون من 6 أحرف.",
            layout: "list"
          }
        ]
      };
      zip.file("اللغة العربية/النحو/الوحدة الأولى/questions.json", JSON.stringify(arabicQuestions, null, 2));

      // 3. Physics Essay Question
      const physicsQuestions = {
        schema: "abqara.questions.v2",
        subject: "الفيزياء",
        question_type: "essay",
        path: ["الفصل الأول: التيار الكهربي وقانون أوم", "الدرس الأول: شدة التيار وفرق الجهد"],
        questions: [
          {
            q_text: "علل: تزداد مقاومة موصل معدني بارتفاع درجة حرارته؟",
            model_answer: "لأن ارتفاع درجة الحرارة يزيد من سعة واهتزاز ذرات الموصل مما يزيد من معدل تصادم الإلكترونات معها فتزداد المقاومة.",
            keywords: ["اهتزاز", "ذرات", "تصادم", "إلكترونات", "مقاومة"],
            explanation: "زيادة الطاقة الحركية للذرات تعيق مرور سيل الإلكترونات."
          }
        ]
      };
      zip.file("الفيزياء/الفصل الأول/الدرس الأول/questions.json", JSON.stringify(physicsQuestions, null, 2));

      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "AbqaraBank_Sample.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    } catch (e: any) {
      alert("خطأ أثناء إنشاء نموذج ZIP: " + e.message);
    }
  };

  // Clear All Questions
  const handleClearAllQuestions = async () => {
    if (
      !confirm(
        '⚠️ تحذير شديد:\nهل أنت متأكد من تفريغ بنك الأسئلة بالكامل؟\nسيتم حذف جميع الأسئلة لتتمكن من رفع بنك الأسئلة الشامل (AbqaraBank.zip) نظيفاً.'
      )
    ) {
      return;
    }
    try {
      const res = await clearAllQuestionsApi();
      alert(`تم بنجاح تفريغ بنك الأسئلة! تم مسح ${res.cleared} سؤال. الأسئلة المتبقية: ${res.totalNow}`);
      loadQuestionsList();
      onSettingsUpdated();
    } catch (e: any) {
      alert('خطأ أثناء مسح الأسئلة: ' + e.message);
    }
  };

  // AI Question Generation inside Admin
  const handleAdminGenerateAi = async () => {
    setAiGenerating(true);
    setAiNotice(null);
    try {
      const res = await generateAiQuestionsApi({
        branch: aiBranch,
        subject: aiSubject,
        unit: aiUnit,
        lesson: aiLesson || undefined,
        count: aiCount,
        difficulty: 'medium',
        autoSave: true
      });

      if (res.success) {
        setAiNotice(`تم توليد وإضافة ${res.savedCount || res.questions.length} أسئلة جديدة بنجاح في مادة [${aiSubject} - ${aiUnit}].`);
        loadQuestionsList();
      }
    } catch (e: any) {
      alert('خطأ أثناء التوليد: ' + e.message);
    } finally {
      setAiGenerating(false);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال نهائياً؟')) return;
    try {
      await deleteQuestionApi(id);
      loadQuestionsList();
    } catch (e: any) {
      alert('خطأ: ' + e.message);
    }
  };

  // Run Benchmark Test (Simulating High Capacity 500,000 Questions)
  const handleRunBenchmark = async () => {
    setBenchmarkRunning(true);
    setBenchmarkOutcome(null);
    try {
      const res = await runStressBenchmarkApi(benchmarkCount);
      setBenchmarkOutcome(res);
      loadStats();
    } catch (e: any) {
      alert('خطأ: ' + e.message);
    } finally {
      setBenchmarkRunning(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      await updateAdminSettingsApi({
        siteName: settings.siteName,
        allowTrial: settings.allowTrial,
        trialMinutes: settings.trialMinutes,
        allowPdf: settings.allowPdf,
        allowImages: settings.allowImages,
        pdfCover: settings.pdfCover,
        pdfTitle: settings.pdfTitle,
        questionsPerPage: settings.questionsPerPage,
        newPin: newPin || undefined
      });
      setSettingsSavedMsg(true);
      onSettingsUpdated();
      setTimeout(() => setSettingsSavedMsg(false), 3000);
    } catch (e: any) {
      alert('خطأ: ' + e.message);
    }
  };

  // Download Full System Backup
  const handleDownloadBackup = () => {
    window.open('/api/admin/backup', '_blank');
  };

  // Restore Backup
  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('تحذير: استعادة النسخة الاحتياطية ستستبدل بيانات الأسئلة والأكواد والنتائج الحالية. هل تود المتابعة؟')) return;

    try {
      const json = JSON.parse(await file.text());
      const res = await restoreBackupApi(json);
      if (res.success) {
        alert(`تمت الاستعادة بنجاح: ${res.questionsRestored} سؤال، ${res.codesRestored} كود، ${res.resultsRestored} نتيجة.`);
        loadCodes();
        loadQuestionsList();
      }
    } catch (e: any) {
      alert('ملف النسخة الاحتياطية غير صالح: ' + e.message);
    } finally {
      e.target.value = '';
    }
  };

  const downloadBlob = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  // 1. PIN Login Screen
  if (!authenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-[#0f2035] border border-[#223b57] rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-fadeIn">
          <button
            onClick={onClose}
            className="absolute top-5 left-5 p-2 rounded-xl bg-[#091827] text-[#9fb1c7] hover:text-[#f5f8ff] border border-[#223b57] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-[#132942] border border-[#223b57] flex items-center justify-center text-[#43e6a8] mx-auto mb-4 shadow-lg">
            <Shield className="w-7 h-7" />
          </div>

          <h3 className="text-2xl font-black text-center text-[#f5f8ff] mb-1">لوحة الإدارة والأمان</h3>
          <p className="text-xs text-center text-[#9fb1c7] mb-6">
            أدخل رمز PIN الخاص بإدارة منصة العباقرة
          </p>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#bfd0e5] mb-2">
                رمز PIN (الافتراضي: 2027)
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="أدخل رمز PIN"
                className="w-full bg-[#091827] border border-[#223b57] focus:border-[#43e6a8] text-[#f5f8ff] px-4 py-3.5 rounded-xl font-mono text-center text-lg tracking-widest outline-none transition"
              />
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-[#391823] border border-[#6b2b3d] text-[#ffd8df] text-xs leading-relaxed flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#ff5570] shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#43e6a8] to-[#2ecf91] hover:brightness-110 text-[#04160f] transition shadow-lg shadow-[#43e6a8]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>دخول لوحة التحكم</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Admin Dashboard Main View
  return (
    <div className="fixed inset-0 z-50 bg-[#07111f] overflow-y-auto">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-20 bg-[#0b1727]/95 backdrop-blur-md border-b border-[#223b57] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#43e6a8] to-[#55a8ff] flex items-center justify-center text-[#04121a] font-black text-xl shadow">
            ع
          </div>
          <div>
            <div className="font-extrabold text-base text-[#f5f8ff] flex items-center gap-2">
              <span>لوحة التحكم والإدارة المركزية</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#124632] text-[#8ff0c7] font-mono">
                Admin v2027
              </span>
            </div>
            <div className="text-xs text-[#9fb1c7]">منصة العباقرة 2027 — بنك الأسئلة والتحكم بالأجهزة</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#132942] hover:bg-[#1b3a5c] text-[#f5f8ff] border border-[#223b57] transition cursor-pointer"
          >
            <span>العودة للموقع</span>
          </button>
        </div>
      </header>

      {/* Main Admin Grid */}
      <div className="w-[min(1360px,96%)] mx-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 bg-[#0f2035] border border-[#223b57] rounded-3xl p-4 space-y-1.5 shadow-xl sticky top-20">
          <button
            onClick={() => setActiveTab('codes')}
            className={`w-full text-right p-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 cursor-pointer ${
              activeTab === 'codes'
                ? 'bg-[#18324f] text-[#43e6a8] border border-[#43e6a8]/40 shadow-md'
                : 'text-[#bfd0e5] hover:bg-[#132942]'
            }`}
          >
            <KeyRound className="w-4 h-4 text-[#55a8ff]" />
            <span>إدارة الأكواد ({codes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`w-full text-right p-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-[#18324f] text-[#43e6a8] border border-[#43e6a8]/40 shadow-md'
                : 'text-[#bfd0e5] hover:bg-[#132942]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#43e6a8]" />
            <span>بنك الأسئلة والاستيراد</span>
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`w-full text-right p-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 cursor-pointer ${
              activeTab === 'results'
                ? 'bg-[#18324f] text-[#43e6a8] border border-[#43e6a8]/40 shadow-md'
                : 'text-[#bfd0e5] hover:bg-[#132942]'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#ffc857]" />
            <span>نتائج الطلاب ({results.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('benchmark')}
            className={`w-full text-right p-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 cursor-pointer ${
              activeTab === 'benchmark'
                ? 'bg-[#18324f] text-[#43e6a8] border border-[#43e6a8]/40 shadow-md'
                : 'text-[#bfd0e5] hover:bg-[#132942]'
            }`}
          >
            <Cpu className="w-4 h-4 text-[#ff5570]" />
            <span>محاكاة 500k سؤال و10k مستخدم</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full text-right p-3 rounded-2xl text-xs font-bold transition flex items-center gap-3 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#18324f] text-[#43e6a8] border border-[#43e6a8]/40 shadow-md'
                : 'text-[#bfd0e5] hover:bg-[#132942]'
            }`}
          >
            <Settings className="w-4 h-4 text-[#bfd0e5]" />
            <span>إعدادات النظام والنسخ الاحتياطي</span>
          </button>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-9 bg-[#0f2035] border border-[#223b57] rounded-3xl p-6 sm:p-8 shadow-xl min-h-[600px]">
          {/* TAB 1: CODES */}
          {activeTab === 'codes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-extrabold text-[#f5f8ff]">إدارة أكواد الوصول</h3>
                  <p className="text-xs text-[#9fb1c7]">
                    توليد حتى 10,000 كود دفعة واحدة، ربط الأجهزة، تجديد الاشتراكات، وتجديد الجهاز.
                  </p>
                </div>
                <button
                  onClick={handleExportCodesCsv}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#132942] hover:bg-[#1b3a5c] text-[#55a8ff] border border-[#223b57] transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير CSV</span>
                </button>
              </div>

              {/* Bulk Generator Card */}
              <div className="bg-[#091827] border border-[#223b57] rounded-2xl p-5">
                <h4 className="font-extrabold text-sm text-[#43e6a8] mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>توليد أكواد جديدة (توليد مجمع فوري)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] text-[#9fb1c7] font-semibold mb-1">الشعبة</label>
                    <select
                      value={bulkBranch}
                      onChange={(e: any) => setBulkBranch(e.target.value)}
                      className="w-full bg-[#0b1a2b] border border-[#223b57] rounded-xl px-3 py-2 text-xs text-[#f5f8ff] outline-none"
                    >
                      {BRANCHES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#9fb1c7] font-semibold mb-1">نوع الكود</label>
                    <select
                      value={bulkKind}
                      onChange={(e: any) => setBulkKind(e.target.value)}
                      className="w-full bg-[#0b1a2b] border border-[#223b57] rounded-xl px-3 py-2 text-xs text-[#f5f8ff] outline-none"
                    >
                      <option value="sub">اشتراك رسمي</option>
                      <option value="trial">تجربة مجانية (ساعة كاملة)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#9fb1c7] font-semibold mb-1">عدد الأكواد (حتى 10,000)</label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={bulkCount}
                      onChange={(e) => setBulkCount(Math.max(1, Math.min(10000, +e.target.value || 1)))}
                      className="w-full bg-[#0b1a2b] border border-[#223b57] rounded-xl px-3 py-2 text-xs text-[#f5f8ff] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  {bulkKind === 'sub' && (
                    <div>
                      <label className="block text-[11px] text-[#9fb1c7] font-semibold mb-1">مدة الاشتراك بالأيام</label>
                      <input
                        type="number"
                        min={1}
                        value={bulkDays}
                        onChange={(e) => setBulkDays(Math.max(1, +e.target.value || 30))}
                        className="w-full bg-[#0b1a2b] border border-[#223b57] rounded-xl px-3 py-2 text-xs text-[#f5f8ff] outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] text-[#9fb1c7] font-semibold mb-1">رصيد الكريديت المبدئي</label>
                    <input
                      type="number"
                      min={0}
                      value={bulkCredits}
                      onChange={(e) => setBulkCredits(Math.max(0, +e.target.value || 0))}
                      className="w-full bg-[#0b1a2b] border border-[#223b57] rounded-xl px-3 py-2 text-xs text-[#f5f8ff] outline-none"
                    />
                  </div>

                  <div>
                    <button
                      onClick={handleBulkGenerate}
                      disabled={bulkGenerating}
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#43e6a8] to-[#2ecf91] hover:brightness-110 disabled:opacity-50 text-[#04160f] transition shadow flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {bulkGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      <span>إنشاء الأكواد ({bulkCount})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Codes Table Filter */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#9fb1c7]" />
                  <input
                    type="text"
                    value={codeSearch}
                    onChange={(e) => setCodeSearch(e.target.value)}
                    placeholder="بحث برقم الكود..."
                    className="w-full bg-[#091827] border border-[#223b57] text-[#f5f8ff] pr-9 pl-3 py-1.5 rounded-xl text-xs outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={codeBranchFilter}
                    onChange={(e) => setCodeBranchFilter(e.target.value)}
                    className="bg-[#091827] border border-[#223b57] text-[#f5f8ff] px-3 py-1.5 rounded-xl text-xs outline-none"
                  >
                    <option value="all">جميع الشُعب ({codes.length})</option>
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Codes Table */}
              <div className="overflow-x-auto border border-[#223b57] rounded-2xl">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#091827] text-[#9fb1c7] border-b border-[#223b57]">
                      <th className="p-3 font-semibold">الكود</th>
                      <th className="p-3 font-semibold">الشعبة</th>
                      <th className="p-3 font-semibold">النوع</th>
                      <th className="p-3 font-semibold">الصلاحية</th>
                      <th className="p-3 font-semibold">الجهاز</th>
                      <th className="p-3 font-semibold">الحالة</th>
                      <th className="p-3 font-semibold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes
                      .filter((c) => codeBranchFilter === 'all' || c.branch === codeBranchFilter)
                      .filter((c) => !codeSearch || c.code.toLowerCase().includes(codeSearch.toLowerCase()))
                      .slice(0, 100)
                      .map((c) => (
                        <tr key={c.code} className="border-b border-[#223b57]/60 hover:bg-[#091827]/40 transition">
                          <td className="p-3 font-mono font-bold text-[#55a8ff]">{c.code}</td>
                          <td className="p-3 font-semibold">{c.branch}</td>
                          <td className="p-3">
                            {c.kind === 'trial' ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] bg-[#4d3a12] text-[#ffe29a]">
                                تجربة
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] bg-[#12335a] text-[#72b9ff]">
                                اشتراك
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-[#bfd0e5]">
                            {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('ar-EG') : 'غير محدد'}
                          </td>
                          <td className="p-3">
                            {c.deviceId ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#8ff0c7]" title={c.deviceId}>
                                <Smartphone className="w-3 h-3" />
                                <span>مربوط</span>
                              </span>
                            ) : (
                              <span className="text-[#9fb1c7]">غير مربوط</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.disabled ? 'bg-[#4a1c28] text-[#ffadc0]' : 'bg-[#124632] text-[#8ff0c7]'
                            }`}>
                              {c.disabled ? 'موقوف' : 'فعال'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => handleCopyCode(c.code)}
                                className="px-2 py-1 rounded bg-[#132942] hover:bg-[#1b3a5c] text-[#55a8ff] transition cursor-pointer"
                                title="نسخ الكود"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleRenewCode(c.code)}
                                className="px-2 py-1 rounded bg-[#132942] hover:bg-[#1b3a5c] text-[#43e6a8] transition cursor-pointer"
                                title="تجديد الاشتراك بالأيام"
                              >
                                <Clock className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleResetDevice(c.code)}
                                className="px-2 py-1 rounded bg-[#4d3a12] hover:bg-[#684e18] text-[#ffe29a] transition cursor-pointer"
                                title="تجديد الجهاز (فك الارتباط)"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleToggleCode(c.code)}
                                className={`px-2 py-1 rounded transition cursor-pointer ${
                                  c.disabled ? 'bg-[#124632] text-[#8ff0c7]' : 'bg-[#4a1c28] text-[#ffadc0]'
                                }`}
                                title={c.disabled ? 'تفعيل الكود' : 'إيقاف الكود'}
                              >
                                {c.disabled ? 'تفعيل' : 'إيقاف'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: QUESTIONS */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-extrabold text-[#f5f8ff]">بنك الأسئلة والاستيراد</h3>
                  <p className="text-xs text-[#9fb1c7]">
                    رفع ملف ZIP يجمع كل المواد والوحدات، أو استخدام Gemini AI لتوليد أسئلة مطابقة لمواصفات 2027.
                  </p>
                </div>
                <div className="text-xs font-bold text-[#43e6a8] bg-[#091827] px-3 py-1.5 rounded-xl border border-[#223b57]">
                  {totalQuestionsInDb.toLocaleString('ar-EG')} سؤال في قاعدة البيانات
                </div>
              </div>

              {/* Upload ZIP / JSON Box */}
              <div className="bg-[#091827] border border-[#223b57] rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <h4 className="font-extrabold text-sm text-[#55a8ff] flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>رفع بنك أسئلة شامل (AbqaraBank.zip أو ملفات JSON)</span>
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleDownloadSampleZip}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#132942] hover:bg-[#1b3a5c] text-[#ffc857] border border-[#ffc857]/40 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="تحميل ملف مضغوط جاهز يحتوي على الهيكل والشكل القياسي للبنك"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل نموذج ZIP تجريبي</span>
                    </button>
                    <button
                      onClick={handleClearAllQuestions}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#391823] hover:bg-[#522030] text-[#ffadc0] border border-[#7a2a3e] transition flex items-center gap-1.5 cursor-pointer"
                      title="مسح وتفريغ بنك الأسئلة بالكامل للبدء من الصفر"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#ff5570]" />
                      <span>تفريغ الأسئلة</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#9fb1c7] mb-4 leading-relaxed">
                  يدعم رفع ملف ZIP مضغوط يحتوي على مجلدات المواد والوحدات والدروس وملفات questions.json المطابقة لـ (schema: abqara.questions.v2)، مع قراءة manifest.json التلقائية ودعم الأسئلة الاختيارية والمقالية.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="px-5 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-[#43e6a8] to-[#2ecf91] hover:brightness-110 text-[#04160f] transition flex items-center gap-2 cursor-pointer shadow-lg shadow-[#43e6a8]/20">
                    <Upload className="w-4 h-4" />
                    <span>اختر ملف AbqaraBank.zip أو JSON من جهازك</span>
                    <input
                      type="file"
                      accept=".zip,.json,.txt,application/zip,application/json,text/plain"
                      onChange={handleImportBankFile}
                      className="hidden"
                    />
                  </label>
                  {importLoading && (
                    <div className="flex items-center gap-2 text-xs text-[#55a8ff]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري معالجة الملف واستخراج الأسئلة...</span>
                    </div>
                  )}
                </div>

                {importStatus && (
                  <div className="mt-3 p-3 rounded-xl bg-[#0b1a2b] border border-[#223b57] text-xs text-[#d7e9ff] font-mono">
                    {importStatus}
                  </div>
                )}
              </div>

              {/* AI Question Generator Box */}
              <div className="bg-[#091827] border border-[#223b57] rounded-2xl p-5">
                <h4 className="font-extrabold text-sm text-[#ff0080] mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>توليد أسئلة ذكية بامتداد Gemini AI (نموذج 2027)</span>
                </h4>
                <p className="text-xs text-[#9fb1c7] mb-4">
                  اختر المادة والوحدة وسيتم إنشاء أسئلة MCQ جديدة بدقة عالية مع بدائل وشرح وإضافتها مباشرة للبنك.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3 text-xs">
                  <div>
                    <label className="block text-[#9fb1c7] font-semibold mb-1">الشعبة</label>
                    <select
                      value={aiBranch}
                      onChange={(e: any) => setAiBranch(e.target.value)}
                      className="w-full bg-[#0b1a2b] border border-[#223b57] rounded-xl px-3 py-2 text-[#f5f8ff] outline-none"
                    >
                      {BRANCHES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#9fb1c7] font-semibold mb-1">المادة</label>
                    <select
                      value={aiSubject}
                      onChange={(e) => {
                        setAiSubject(e.target.value);
                        const secs = getCurriculumSections(e.target.value, ['الوحدة الأولى']);
                        setAiUnit(secs[0] || 'الوحدة الأولى');
                      }}
                      className="w-full bg-[#0b1a2b] border border-[#223b57] rounded-xl px-3 py-2 text-[#f5f8ff] outline-none"
                    >
                      {(SUBJECTS_BY_BRANCH[aiBranch] || []).map((s) => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#9fb1c7] font-semibold mb-1">الوحدة / الباب</label>
                    <select
                      value={aiUnit}
                      onChange={(e) => setAiUnit(e.target.value)}
                      className="w-full bg-[#0b1a2b] border border-[#223b57] rounded-xl px-3 py-2 text-[#f5f8ff] outline-none"
                    >
                      {getCurriculumSections(aiSubject, ['الوحدة الأولى']).map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#9fb1c7] font-semibold mb-1">العدد (1-20)</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={aiCount}
                      onChange={(e) => setAiCount(Math.max(1, Math.min(20, +e.target.value || 5)))}
                      className="w-full bg-[#0b1a2b] border border-[#223b57] rounded-xl px-3 py-2 text-[#f5f8ff] outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAdminGenerateAi}
                  disabled={aiGenerating}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#7928ca] to-[#ff0080] hover:brightness-110 disabled:opacity-50 text-white transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>توليد {aiCount} أسئلة وحفظها في البنك الآن</span>
                </button>

                {aiNotice && (
                  <div className="mt-3 p-3 rounded-xl bg-[#0d3025] border border-[#1f6e54] text-[#d5ffef] text-xs">
                    {aiNotice}
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#9fb1c7]" />
                    <input
                      type="text"
                      value={questionSearch}
                      onChange={(e) => {
                        setQuestionSearch(e.target.value);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && loadQuestionsList()}
                      placeholder="بحث في نص السؤال أو الشرح..."
                      className="w-full bg-[#091827] border border-[#223b57] text-[#f5f8ff] pr-9 pl-3 py-1.5 rounded-xl text-xs outline-none"
                    />
                  </div>

                  <button
                    onClick={loadQuestionsList}
                    className="px-3.5 py-1.5 rounded-xl bg-[#132942] text-xs font-bold text-[#55a8ff] hover:bg-[#1b3a5c] transition cursor-pointer"
                  >
                    تحديث القائمة
                  </button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-3.5 rounded-2xl bg-[#091827] border border-[#223b57] flex items-start justify-between gap-4 text-xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#132942] text-[#43e6a8] font-bold">
                            {q.subject}
                          </span>
                          <span className="text-[#9fb1c7]">• {q.unit}</span>
                          {q.branch && <span className="text-[#55a8ff]">• {q.branch}</span>}
                        </div>
                        <div className="font-bold text-[#f5f8ff] leading-relaxed">
                          {q.question || q.q_text}
                        </div>
                        <div className="text-[11px] text-[#8ff0c7] mt-1">
                          الإجابة: {q.options[q.correctAnswer]}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-2 rounded-xl bg-[#391823] hover:bg-[#4d1f2d] text-[#ff5570] transition cursor-pointer shrink-0"
                        title="حذف السؤال"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RESULTS */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-[#f5f8ff]">سجل نتائج الطلاب</h3>
                  <p className="text-xs text-[#9fb1c7]">
                    نتائج الاختبارات المسجلة، الدرجات، والوقت المستغرق لكل طالب.
                  </p>
                </div>
                <button
                  onClick={handleExportResultsCsv}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#132942] hover:bg-[#1b3a5c] text-[#55a8ff] border border-[#223b57] transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-[#223b57] rounded-2xl">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#091827] text-[#9fb1c7] border-b border-[#223b57]">
                      <th className="p-3 font-semibold">الكود</th>
                      <th className="p-3 font-semibold">الشعبة</th>
                      <th className="p-3 font-semibold">المادة</th>
                      <th className="p-3 font-semibold">الوحدة / القسم</th>
                      <th className="p-3 font-semibold">الدرجة</th>
                      <th className="p-3 font-semibold">الوقت</th>
                      <th className="p-3 font-semibold">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.slice(0, 100).map((r) => (
                      <tr key={r.id} className="border-b border-[#223b57]/60 hover:bg-[#091827]/40">
                        <td className="p-3 font-mono font-bold text-[#55a8ff]">{r.code}</td>
                        <td className="p-3">{r.branch}</td>
                        <td className="p-3 font-semibold">{r.subject}</td>
                        <td className="p-3 text-[#bfd0e5]">{r.unit}</td>
                        <td className="p-3 font-bold text-[#43e6a8]">
                          {r.score} / {r.total} ({Math.round((r.score / (r.total || 1)) * 100)}%)
                        </td>
                        <td className="p-3 font-mono text-[#9fb1c7]">{r.durationSeconds} ثانية</td>
                        <td className="p-3 text-[#9fb1c7]">{new Date(r.createdAt).toLocaleString('ar-EG')}</td>
                      </tr>
                    ))}
                    {results.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-[#9fb1c7]">
                          لا توجد نتائج مسجلة حتى الآن.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: BENCHMARK & HIGH CAPACITY */}
          {activeTab === 'benchmark' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-extrabold text-[#f5f8ff]">
                  القدرة الفائقة والمحاكاة (500,000 سؤال و10,000 مستخدم)
                </h3>
                <p className="text-xs text-[#9fb1c7]">
                  اختبار استيعاب الباك إند للبيانات الضخمة والتحميل المليوني بأقصى سرعة استجابة.
                </p>
              </div>

              {platformStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#091827] border border-[#223b57] rounded-2xl p-4">
                    <div className="text-xs text-[#9fb1c7] mb-1">الأسئلة المفهرسة حالياً</div>
                    <div className="text-2xl font-black text-[#43e6a8]">
                      {platformStats.totalQuestions.toLocaleString('ar-EG')}
                    </div>
                  </div>
                  <div className="bg-[#091827] border border-[#223b57] rounded-2xl p-4">
                    <div className="text-xs text-[#9fb1c7] mb-1">إجمالي الأكواد والطلاب</div>
                    <div className="text-2xl font-black text-[#55a8ff]">
                      {platformStats.totalCodes.toLocaleString('ar-EG')}
                    </div>
                  </div>
                  <div className="bg-[#091827] border border-[#223b57] rounded-2xl p-4">
                    <div className="text-xs text-[#9fb1c7] mb-1">استهلاك الذاكرة (RAM)</div>
                    <div className="text-2xl font-black text-[#ffc857]">
                      {platformStats.memoryUsageMB} MB
                    </div>
                  </div>
                  <div className="bg-[#091827] border border-[#223b57] rounded-2xl p-4">
                    <div className="text-xs text-[#9fb1c7] mb-1">Heap المستخدم</div>
                    <div className="text-2xl font-black text-[#f5f8ff]">
                      {platformStats.heapUsedMB} MB
                    </div>
                  </div>
                </div>
              )}

              {/* Stress Simulation Tool */}
              <div className="bg-[#091827] border border-[#223b57] rounded-2xl p-6">
                <h4 className="font-extrabold text-sm text-[#f5f8ff] mb-2 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#ff5570]" />
                  <span>تشغيل محاكاة التحميل الفائق (Stress Benchmark)</span>
                </h4>
                <p className="text-xs text-[#9fb1c7] mb-4 leading-relaxed">
                  يقوم هذا الاختبار بتوليد وفهرسة عشرات الآلاف من الأسئلة في الذاكرة لقياس معدل المعالجة (Throughput) وسرعة استعلام الباك إند تحت أقصى ضغط.
                </p>

                <div className="flex items-center gap-3 max-w-sm mb-4">
                  <select
                    value={benchmarkCount}
                    onChange={(e) => setBenchmarkCount(Number(e.target.value))}
                    className="flex-1 bg-[#0b1a2b] border border-[#223b57] text-xs text-[#f5f8ff] p-2.5 rounded-xl outline-none"
                  >
                    <option value={10000}>توليد 10,000 سؤال محاكاة</option>
                    <option value={25000}>توليد 25,000 سؤال محاكاة</option>
                    <option value={50000}>توليد 50,000 سؤال محاكاة</option>
                  </select>

                  <button
                    onClick={handleRunBenchmark}
                    disabled={benchmarkRunning}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#ff5570] to-[#cf3451] hover:brightness-110 disabled:opacity-50 text-white transition flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    {benchmarkRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    <span>بدء المحاكاة</span>
                  </button>
                </div>

                {benchmarkOutcome && (
                  <div className="p-4 rounded-2xl bg-[#0d3025] border border-[#1f6e54] text-xs text-[#d5ffef] space-y-1.5 animate-fadeIn">
                    <div className="font-black text-sm text-[#43e6a8] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>اكتملت المحاكاة بنجاح باهر!</span>
                    </div>
                    <div>
                      • تم توليد وفهرسة {benchmarkOutcome.addedSynthetic.toLocaleString('ar-EG')} سؤال في وقت قدره{' '}
                      <b>{benchmarkOutcome.indexingDurationMs} مللي ثانية</b> فقط!
                    </div>
                    <div>
                      • معدل الإدخال والفهرسة الفعلي: <b>{benchmarkOutcome.throughputPerSecond.toLocaleString('ar-EG')} سؤال / ثانية</b>.
                    </div>
                    <div>
                      • إجمالي الأسئلة في المحرك الآن: <b>{benchmarkOutcome.totalQuestionsNow.toLocaleString('ar-EG')} سؤال</b> جاهزة للبحث والاستعلام اللحظي.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS & BACKUP */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-extrabold text-[#f5f8ff]">إعدادات المنصة والنسخ الاحتياطي</h3>
                <p className="text-xs text-[#9fb1c7]">
                  تخصيص الخيارات العامة، الأذونات، وتصدير النسخة الاحتياطية الشاملة واستعادتها.
                </p>
              </div>

              <div className="space-y-4 max-w-xl text-xs">
                <div>
                  <label className="block text-[#bfd0e5] font-semibold mb-1">اسم المنصة الرسمي</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full bg-[#091827] border border-[#223b57] rounded-xl px-4 py-2.5 text-[#f5f8ff] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#bfd0e5] font-semibold mb-1">مدة كود التجربة (بالدقائق)</label>
                    <input
                      type="number"
                      value={settings.trialMinutes}
                      onChange={(e) => setSettings({ ...settings, trialMinutes: +e.target.value || 60 })}
                      className="w-full bg-[#091827] border border-[#223b57] rounded-xl px-4 py-2.5 text-[#f5f8ff] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#bfd0e5] font-semibold mb-1">أسئلة صفحة الطباعة الافتراضية</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={settings.questionsPerPage}
                      onChange={(e) => setSettings({ ...settings, questionsPerPage: +e.target.value || 5 })}
                      className="w-full bg-[#091827] border border-[#223b57] rounded-xl px-4 py-2.5 text-[#f5f8ff] outline-none"
                    />
                  </div>
                </div>

                <div className="bg-[#091827] border border-[#223b57] rounded-2xl p-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.allowPdf}
                      onChange={(e) => setSettings({ ...settings, allowPdf: e.target.checked })}
                      className="w-4 h-4 rounded text-[#43e6a8] accent-[#43e6a8]"
                    />
                    <span className="text-[#f5f8ff]">السماح بتصدير PDF للطلاب</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.allowImages}
                      onChange={(e) => setSettings({ ...settings, allowImages: e.target.checked })}
                      className="w-4 h-4 rounded text-[#43e6a8] accent-[#43e6a8]"
                    />
                    <span className="text-[#f5f8ff]">السماح بتصدير صور A4 للطلاب</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.pdfCover}
                      onChange={(e) => setSettings({ ...settings, pdfCover: e.target.checked })}
                      className="w-4 h-4 rounded text-[#43e6a8] accent-[#43e6a8]"
                    />
                    <span className="text-[#f5f8ff]">إضافة غلاف رسمي تلقائي لملفات الطباعة</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[#bfd0e5] font-semibold mb-1">
                    تغيير رمز PIN الإدارة (اتركه فارغاً إن لم ترد التغيير)
                  </label>
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="رمز PIN جديد (4 أرقام على الأقل)"
                    className="w-full bg-[#091827] border border-[#223b57] rounded-xl px-4 py-2.5 text-[#f5f8ff] outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveSettings}
                    className="px-6 py-2.5 rounded-xl font-bold bg-[#43e6a8] hover:bg-[#2ecf91] text-[#04160f] transition cursor-pointer shadow-md"
                  >
                    حفظ الإعدادات
                  </button>
                  {settingsSavedMsg && (
                    <span className="mr-3 text-xs font-bold text-[#8ff0c7]">تم الحفظ بنجاح!</span>
                  )}
                </div>

                {/* Backup & Restore Buttons */}
                <div className="pt-6 border-t border-[#223b57]">
                  <h4 className="font-bold text-sm text-[#f5f8ff] mb-3">النسخ الاحتياطي واستعادة البيانات</h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleDownloadBackup}
                      className="px-4 py-2.5 rounded-xl bg-[#132942] hover:bg-[#1b3a5c] text-[#55a8ff] border border-[#223b57] transition flex items-center gap-2 cursor-pointer font-bold text-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>تحميل نسخة احتياطية JSON</span>
                    </button>

                    <label className="px-4 py-2.5 rounded-xl bg-[#18324f] hover:bg-[#223b57] text-[#bfd0e5] border border-[#2a4a6e] transition flex items-center gap-2 cursor-pointer font-bold text-xs">
                      <Upload className="w-4 h-4 text-[#ffc857]" />
                      <span>استعادة نسخة احتياطية</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleRestoreBackup}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
