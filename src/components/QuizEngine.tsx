import React, { useState, useEffect, useRef } from 'react';
import { Question, AccessCode, QuizResult } from '../types.ts';
import { submitQuizResultApi } from '../services/api.ts';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  ArrowRight, 
  Flag, 
  RotateCcw, 
  Award, 
  Sparkles,
  HelpCircle,
  Eye,
  AlertTriangle
} from 'lucide-react';

interface QuizEngineProps {
  questions: Question[];
  subject: string;
  unit: string;
  lesson?: string;
  userCode: AccessCode;
  onExit: () => void;
  onScoreEarned: (points: number) => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({
  questions,
  subject,
  unit,
  lesson,
  userCode,
  onExit,
  onScoreEarned
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showInstantExplanation, setShowInstantExplanation] = useState(false);
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  // Timer configuration: 1 minute per question or default 15 minutes
  const totalSeconds = Math.max(300, questions.length * 90);
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimestamp = useRef(Date.now());

  // Timer countdown
  useEffect(() => {
    if (quizFinished) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizFinished]);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (optionIndex: number) => {
    if (quizFinished) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex
    }));
    setShowInstantExplanation(true);
  };

  const toggleFlag = () => {
    setFlagged((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex]
    }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        score++;
      }
    });
    return score;
  };

  const finishQuiz = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setQuizFinished(true);

    const score = calculateScore();
    const duration = Math.round((Date.now() - startTimestamp.current) / 1000);

    const summary = questions.map((q, idx) => ({
      qid: q.id,
      ok: selectedAnswers[idx] === q.correctAnswer,
      selected: selectedAnswers[idx] ?? -1,
      correct: q.correctAnswer
    }));

    try {
      await submitQuizResultApi({
        code: userCode.code,
        branch: userCode.branch,
        subject,
        unit,
        lesson,
        score,
        total: questions.length,
        durationSeconds: duration,
        answersSummary: summary
      });
      onScoreEarned(score);
    } catch (e) {
      console.error('Failed to submit quiz result:', e);
    }
  };

  // Format timer into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((Object.keys(selectedAnswers).length) / questions.length) * 100;
  const score = calculateScore();
  const percentage = Math.round((score / (questions.length || 1)) * 100);

  // If no questions found
  if (questions.length === 0) {
    return (
      <div className="w-[min(800px,94%)] mx-auto py-16 text-center">
        <div className="bg-[#0f2035] border border-[#223b57] rounded-3xl p-8">
          <AlertTriangle className="w-12 h-12 text-[#ffc857] mx-auto mb-3" />
          <h3 className="text-xl font-black text-[#f5f8ff] mb-2">لا توجد أسئلة كافية لبدء الاختبار</h3>
          <p className="text-xs text-[#9fb1c7] mb-6">
            اختر قسماً أو درساً يحتوي على أسئلة، أو قم بتوليد أسئلة جديدة بالذكاء الاصطناعي.
          </p>
          <button
            onClick={onExit}
            className="px-5 py-2.5 rounded-xl bg-[#18324f] hover:bg-[#223b57] text-[#f5f8ff] text-xs font-bold transition cursor-pointer"
          >
            العودة للمنهج
          </button>
        </div>
      </div>
    );
  }

  // Quiz Finished / Score Screen
  if (quizFinished && !reviewMode) {
    let verdict = 'ممتاز! مستوى متفوق 🌟';
    let verdictColor = 'text-[#43e6a8]';
    if (percentage < 50) {
      verdict = 'تحتاج إلى مراجعة إضافية للدرس 💪';
      verdictColor = 'text-[#ff5570]';
    } else if (percentage < 75) {
      verdict = 'جيد جداً، واصل التقدم 🚀';
      verdictColor = 'text-[#ffc857]';
    }

    return (
      <div className="w-[min(700px,94%)] mx-auto py-12">
        <div className="bg-gradient-to-b from-[#132942] to-[#0b1a2b] border border-[#223b57] rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#43e6a8] to-[#55a8ff] flex items-center justify-center text-4xl mx-auto mb-5 shadow-lg shadow-[#43e6a8]/20">
            🏆
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#091827] text-[#55a8ff] border border-[#223b57] mb-3">
            <span>{subject}</span>
            <span>•</span>
            <span>{unit}</span>
          </span>

          <h2 className="text-3xl font-black text-[#f5f8ff] mb-1">نتيجة الاختبار</h2>
          <div className={`text-sm font-bold ${verdictColor} mb-6`}>{verdict}</div>

          <div className="flex justify-center items-baseline gap-2 mb-6">
            <span className="text-6xl font-black text-[#43e6a8]">{score}</span>
            <span className="text-2xl text-[#9fb1c7] font-bold">/ {questions.length}</span>
            <span className="text-base text-[#55a8ff] font-mono mr-2">({percentage}%)</span>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-8 text-xs">
            <div className="bg-[#091827] border border-[#223b57] p-3 rounded-xl">
              <div className="text-[#9fb1c7] mb-1">الوقت المستغرق</div>
              <div className="font-mono font-bold text-[#f5f8ff]">{formatTime(elapsedSeconds)}</div>
            </div>
            <div className="bg-[#091827] border border-[#223b57] p-3 rounded-xl">
              <div className="text-[#9fb1c7] mb-1">النقاط المكتسبة</div>
              <div className="font-bold text-[#ffc857]">+{score} نقطة</div>
            </div>
            <div className="bg-[#091827] border border-[#223b57] p-3 rounded-xl">
              <div className="text-[#9fb1c7] mb-1">الأسئلة الصحيحة</div>
              <div className="font-bold text-[#43e6a8]">{score} من {questions.length}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setReviewMode(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-black bg-[#18324f] hover:bg-[#223b57] text-[#f5f8ff] border border-[#223b57] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#55a8ff]" />
              <span>مراجعة الإجابات والشرح</span>
            </button>

            <button
              onClick={onExit}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-[#43e6a8] to-[#2ecf91] hover:brightness-110 text-[#04160f] transition shadow-md shadow-[#43e6a8]/20 cursor-pointer"
            >
              العودة للمنهج
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[min(900px,94%)] mx-auto py-8">
      {/* Quiz Top Status Bar */}
      <div className="bg-[#0f2035] border border-[#223b57] rounded-2xl p-4 mb-4 flex items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-[#f5f8ff] flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#18324f] text-[#55a8ff] flex items-center justify-center text-xs font-black">
              {currentIndex + 1}
            </span>
            <span>من {questions.length} سؤال</span>
          </div>
          <span className="hidden sm:inline text-xs text-[#9fb1c7] truncate max-w-[200px]">
            {subject} — {unit}
          </span>
        </div>

        {/* Real-time Countdown Timer */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
          secondsLeft < 120 
            ? 'bg-[#391823] text-[#ff5570] border-[#6b2b3d] animate-pulse' 
            : 'bg-[#091827] text-[#43e6a8] border-[#223b57]'
        }`}>
          <Clock className="w-4 h-4" />
          <span>الوقت المتبقي: {formatTime(secondsLeft)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFlag}
            className={`p-2 rounded-xl text-xs transition cursor-pointer border ${
              flagged[currentIndex]
                ? 'bg-[#ffc857]/20 text-[#ffc857] border-[#ffc857]'
                : 'bg-[#091827] text-[#9fb1c7] border-[#223b57] hover:text-[#f5f8ff]'
            }`}
            title="تعليم السؤال للمراجعة"
          >
            <Flag className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={finishQuiz}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#18324f] hover:bg-[#ff5570] hover:text-white text-[#9fb1c7] border border-[#223b57] transition cursor-pointer"
          >
            إنهاء الاختبار
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#091827] h-2 rounded-full overflow-hidden mb-6 border border-[#223b57]/40">
        <div
          className="h-full bg-gradient-to-r from-[#43e6a8] to-[#55a8ff] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Question Card */}
      <div className="bg-gradient-to-b from-[#132942] to-[#0c1c2e] border border-[#223b57] rounded-3xl p-6 sm:p-8 shadow-2xl mb-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <h3 className="text-lg sm:text-xl font-extrabold text-[#f5f8ff] leading-relaxed">
            {currentQ.question || currentQ.q_text}
          </h3>
          {currentQ.difficulty && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#091827] text-[#9fb1c7] border border-[#223b57] uppercase shrink-0">
              {currentQ.difficulty === 'easy' ? 'سهل' : currentQ.difficulty === 'hard' ? 'تحدي' : 'متوسط'}
            </span>
          )}
        </div>

        {/* Answer Options */}
        <div className="space-y-3 mb-6">
          {currentQ.options.map((opt, oi) => {
            const isSelected = selectedAnswers[currentIndex] === oi;
            const isCorrect = oi === currentQ.correctAnswer;
            const showOutcome = (showInstantExplanation || reviewMode) && selectedAnswers[currentIndex] !== undefined;

            let optionClass = 'bg-[#0b1a2b] hover:bg-[#132942] text-[#f5f8ff] border-[#223b57]';

            if (showOutcome) {
              if (isCorrect) {
                optionClass = 'bg-[#0d3025] text-[#8ff0c7] border-[#1f6e54] font-bold ring-2 ring-[#43e6a8]/30';
              } else if (isSelected) {
                optionClass = 'bg-[#391823] text-[#ffd8df] border-[#6b2b3d] font-bold';
              }
            } else if (isSelected) {
              optionClass = 'bg-[#18324f] text-[#43e6a8] border-[#43e6a8] font-bold shadow-md';
            }

            return (
              <button
                key={oi}
                onClick={() => handleSelectOption(oi)}
                className={`w-full text-right p-4 rounded-2xl border transition-all duration-150 flex items-center justify-between cursor-pointer ${optionClass}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-[#091827] text-xs font-black flex items-center justify-center border border-[#223b57]">
                    {['أ', 'ب', 'ج', 'د'][oi] || oi + 1}
                  </span>
                  <span className="text-sm font-medium leading-relaxed">{opt}</span>
                </div>

                {showOutcome && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-[#43e6a8] shrink-0" />
                )}
                {showOutcome && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-[#ff5570] shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation Box */}
        {((showInstantExplanation && selectedAnswers[currentIndex] !== undefined) || reviewMode) && (
          <div className="p-4 rounded-2xl bg-[#091827] border border-[#223b57] text-xs leading-relaxed animate-fadeIn">
            <div className="font-bold text-[#ffc857] flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>الشرح والنموذج الإرشادي:</span>
            </div>
            <p className="text-[#bfd0e5]">
              {currentQ.explanation || 'الإجابة تعتمد على القواعد والقوانين المقررة في هذا الدرس.'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => {
            setCurrentIndex((prev) => Math.max(0, prev - 1));
            setShowInstantExplanation(selectedAnswers[currentIndex - 1] !== undefined);
          }}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#132942] hover:bg-[#18324f] disabled:opacity-40 text-[#f5f8ff] border border-[#223b57] transition cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>السابق</span>
        </button>

        {/* Question Selector Dots Drawer */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[320px] sm:max-w-[480px]">
          {questions.map((_, idx) => {
            const isAnswered = selectedAnswers[idx] !== undefined;
            const isCurrent = idx === currentIndex;
            const isFlagged = flagged[idx];

            return (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setShowInstantExplanation(selectedAnswers[idx] !== undefined);
                }}
                className={`w-7 h-7 rounded-lg text-xs font-bold shrink-0 transition border flex items-center justify-center cursor-pointer ${
                  isCurrent
                    ? 'ring-2 ring-[#43e6a8] bg-[#43e6a8] text-[#04160f]'
                    : isFlagged
                    ? 'bg-[#ffc857]/30 text-[#ffc857] border-[#ffc857]'
                    : isAnswered
                    ? 'bg-[#18324f] text-[#55a8ff] border-[#223b57]'
                    : 'bg-[#091827] text-[#9fb1c7] border-[#223b57]/60'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => {
              setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
              setShowInstantExplanation(selectedAnswers[currentIndex + 1] !== undefined);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#43e6a8] hover:bg-[#2ecf91] text-[#04160f] transition shadow-md cursor-pointer"
          >
            <span>التالي</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={finishQuiz}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#43e6a8] to-[#2ecf91] hover:brightness-110 text-[#04160f] transition shadow-md shadow-[#43e6a8]/20 cursor-pointer"
          >
            <span>إنهاء وعرض النتيجة</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {reviewMode && (
        <div className="text-center">
          <button
            onClick={onExit}
            className="px-6 py-2.5 rounded-xl bg-[#18324f] text-[#f5f8ff] text-xs font-bold hover:bg-[#223b57] transition cursor-pointer"
          >
            الانتهاء والعودة للمنهج
          </button>
        </div>
      )}
    </div>
  );
};
