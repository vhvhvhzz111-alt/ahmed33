import React, { useState, useEffect } from 'react';
import { AccessCode, SubjectMeta, Question } from './types.ts';
import { Navbar } from './components/Navbar.tsx';
import { HeroLogin } from './components/HeroLogin.tsx';
import { BranchExplorer } from './components/BranchExplorer.tsx';
import { UnitLessonView } from './components/UnitLessonView.tsx';
import { QuizEngine } from './components/QuizEngine.tsx';
import { ExportModal } from './components/ExportModal.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { CountdownBanner } from './components/CountdownBanner.tsx';
import { 
  verifyAccessCode, 
  getSavedSession, 
  setSavedSession, 
  fetchPlatformStats, 
  fetchQuestions, 
  fetchAdminSettingsApi 
} from './services/api.ts';

export default function App() {
  const [siteName, setSiteName] = useState('منصة العباقرة');
  const [userCode, setUserCode] = useState<AccessCode | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [selectedSubject, setSelectedSubject] = useState<SubjectMeta | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<{
    questions: Question[];
    subject: string;
    unit: string;
    lesson?: string;
  } | null>(null);

  const [exportModal, setExportModal] = useState<{
    mode: 'pdf' | 'images';
    subject: string;
    unit: string;
    lesson?: string;
    questions: Question[];
  } | null>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const [totalQuestions, setTotalQuestions] = useState(0);
  const [questionCountsBySubject, setQuestionCountsBySubject] = useState<Record<string, number>>({});

  // Fetch initial stats and verify saved session
  useEffect(() => {
    refreshStats();
    loadSiteSettings();

    const saved = getSavedSession();
    if (saved) {
      handleLogin(saved, true);
    }
  }, []);

  const refreshStats = async () => {
    try {
      const stats = await fetchPlatformStats();
      if (stats) {
        setTotalQuestions(stats.totalQuestions || 0);
        if (stats.questionsBySubject && Object.keys(stats.questionsBySubject).length > 0) {
          setQuestionCountsBySubject(stats.questionsBySubject);
        }
      }
    } catch (e) {
      console.error('Failed to fetch platform stats:', e);
    }
  };

  const loadSiteSettings = async () => {
    try {
      const res = await fetchAdminSettingsApi();
      if (res && res.settings && res.settings.siteName) {
        setSiteName(res.settings.siteName);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  // Login handler
  const handleLogin = async (codeToVerify: string, silent = false) => {
    if (!silent) {
      setLoginLoading(true);
      setLoginError(null);
    }

    try {
      const res = await verifyAccessCode(codeToVerify);
      if (res.valid) {
        const codeObj: AccessCode = {
          code: res.code!,
          branch: res.branch as any,
          kind: res.kind || 'sub',
          expiresAt: res.expiresAt || null,
          createdAt: Date.now(),
          deviceId: res.deviceId || '',
          disabled: false,
          points: res.points || 0,
          credits: res.credits || 0
        };
        setUserCode(codeObj);
        setSavedSession(codeObj.code);
        setLoginError(null);
      } else {
        if (!silent) {
          setLoginError(res.message || 'الكود غير صالح أو منتهي الصلاحية');
        } else {
          setSavedSession(null);
        }
      }
    } catch (e: any) {
      if (!silent) {
        setLoginError('تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      if (!silent) setLoginLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    setUserCode(null);
    setSelectedSubject(null);
    setActiveQuiz(null);
    setExportModal(null);
    setSavedSession(null);
  };

  // Start Quiz
  const handleStartQuiz = async (subject: string, unit: string, lesson?: string) => {
    try {
      const res = await fetchQuestions({
        branch: userCode?.branch,
        subject,
        unit,
        lesson: lesson || undefined,
        limit: 50,
        random: true
      });

      if (!res.questions || res.questions.length === 0) {
        alert('لا توجد أسئلة متوفرة في هذا القسم بعد. يمكنك توليد أسئلة بالذكاء الاصطناعي أولاً.');
        return;
      }

      setActiveQuiz({
        questions: res.questions,
        subject,
        unit,
        lesson
      });
    } catch (e: any) {
      alert('خطأ أثناء تحميل أسئلة الاختبار: ' + e.message);
    }
  };

  // Open Export Modal (PDF / Images)
  const handleOpenExport = async (
    subject: string,
    unit: string,
    lesson?: string,
    mode: 'pdf' | 'images' = 'pdf'
  ) => {
    try {
      const res = await fetchQuestions({
        branch: userCode?.branch,
        subject,
        unit,
        lesson: lesson || undefined,
        limit: 100
      });

      if (!res.questions || res.questions.length === 0) {
        alert('لا توجد أسئلة متوفرة في هذا القسم للتصدير');
        return;
      }

      setExportModal({
        mode,
        subject,
        unit,
        lesson,
        questions: res.questions
      });
    } catch (e: any) {
      alert('خطأ أثناء تحميل الأسئلة للتصدير: ' + e.message);
    }
  };

  const handleScoreEarned = (earnedPoints: number) => {
    if (userCode) {
      setUserCode({
        ...userCode,
        points: (userCode.points || 0) + earnedPoints
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-[#f5f8ff] flex flex-col selection:bg-[#43e6a8] selection:text-[#04121a]">
      {/* Top Prominent Countdown Timer Banner */}
      <CountdownBanner
        userCode={userCode}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      {/* Navbar */}
      <Navbar
        userCode={userCode}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
        onLogout={handleLogout}
        siteName={siteName}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeQuiz ? (
          <QuizEngine
            questions={activeQuiz.questions}
            subject={activeQuiz.subject}
            unit={activeQuiz.unit}
            lesson={activeQuiz.lesson}
            userCode={userCode!}
            onExit={() => setActiveQuiz(null)}
            onScoreEarned={handleScoreEarned}
          />
        ) : !userCode ? (
          <HeroLogin
            onLogin={(code) => handleLogin(code, false)}
            loading={loginLoading}
            error={loginError}
            totalQuestions={totalQuestions}
          />
        ) : selectedSubject ? (
          <UnitLessonView
            subject={selectedSubject}
            branch={userCode.branch}
            onBack={() => setSelectedSubject(null)}
            onStartQuiz={handleStartQuiz}
            onOpenExport={handleOpenExport}
          />
        ) : (
          <BranchExplorer
            userCode={userCode}
            onSelectSubject={(sub) => setSelectedSubject(sub)}
            questionCounts={questionCountsBySubject}
            totalQuestionsCount={totalQuestions}
          />
        )}
      </main>

      {/* Export Modal (PDF / Images) */}
      {exportModal && (
        <ExportModal
          mode={exportModal.mode}
          subject={exportModal.subject}
          unit={exportModal.unit}
          lesson={exportModal.lesson}
          questions={exportModal.questions}
          onClose={() => setExportModal(null)}
          siteName={siteName}
        />
      )}

      {/* Profile Modal */}
      {profileOpen && userCode && (
        <ProfileModal
          userCode={userCode}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {/* Admin Dashboard */}
      {adminOpen && (
        <AdminDashboard
          onClose={() => {
            setAdminOpen(false);
            refreshStats();
          }}
          siteName={siteName}
          onSettingsUpdated={() => {
            loadSiteSettings();
            refreshStats();
          }}
          isAdminAuthenticated={Boolean(userCode?.isAdmin || userCode?.kind === 'admin')}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-[#223b57]/60 py-6 text-center text-xs text-[#9fb1c7]">
        <div className="w-[min(1240px,94%)] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span>{siteName} 2027</span> — المنصة الرقمية الشاملة لطلاب الثانوية العامة والأزهرية
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>طاقة استيعابية: 500,000 سؤال</span>
            <span>•</span>
            <span>10,000 مستخدم متزامن</span>
            <span>•</span>
            <button
              onClick={() => setAdminOpen(true)}
              className="text-[#43e6a8] hover:underline cursor-pointer"
            >
              دخول الإدارة
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
