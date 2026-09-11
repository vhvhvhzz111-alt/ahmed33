import React, { useState, useEffect } from 'react';
import { SubjectMeta, Question } from '../types.ts';
import { getCurriculumSections, getLessonList } from '../data/curriculum.ts';
import { fetchQuestions, generateAiQuestionsApi } from '../services/api.ts';
import { 
  ArrowRight, 
  FileText, 
  Image as ImageIcon, 
  Play, 
  Sparkles, 
  ChevronDown, 
  ChevronLeft, 
  HelpCircle,
  Plus,
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface UnitLessonViewProps {
  subject: SubjectMeta;
  branch: string;
  onBack: () => void;
  onStartQuiz: (subject: string, unit: string, lesson?: string) => void;
  onOpenExport: (subject: string, unit: string, lesson?: string, mode?: 'pdf' | 'images') => void;
}

export const UnitLessonView: React.FC<UnitLessonViewProps> = ({
  subject,
  branch,
  onBack,
  onStartQuiz,
  onOpenExport
}) => {
  const sections = getCurriculumSections(subject.name, subject.defaultSections);
  const [selectedUnit, setSelectedUnit] = useState<string>(sections[0] || '');
  const [selectedSubUnit, setSelectedSubUnit] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [unitQuestions, setUnitQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  const lessonData = selectedUnit ? getLessonList(subject.name, selectedUnit) : [];
  const isNestedUnit = lessonData && typeof lessonData === 'object' && !Array.isArray(lessonData);

  // Load questions whenever unit/lesson changes
  const loadQuestions = async () => {
    if (!selectedUnit) return;
    setLoadingQuestions(true);
    try {
      const res = await fetchQuestions({
        branch,
        subject: subject.name,
        unit: selectedUnit,
        lesson: selectedLesson || undefined,
        limit: 100
      });
      setUnitQuestions(res.questions || []);
    } catch (e) {
      console.error('Error fetching questions:', e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [selectedUnit, selectedLesson, subject.name, branch]);

  // Handle AI question generation on the fly
  const handleGenerateAi = async () => {
    setGeneratingAi(true);
    setAiSuccessMsg(null);
    try {
      const res = await generateAiQuestionsApi({
        branch,
        subject: subject.name,
        unit: selectedUnit,
        lesson: selectedLesson || undefined,
        count: 5,
        difficulty: 'medium',
        autoSave: true
      });

      if (res.success) {
        setAiSuccessMsg(`تم توليد وحفظ ${res.savedCount || res.questions.length} أسئلة جديدة بالذكاء الاصطناعي بنجاح!`);
        await loadQuestions();
        setTimeout(() => setAiSuccessMsg(null), 5000);
      }
    } catch (e: any) {
      alert('خطأ في توليد الأسئلة: ' + e.message);
    } finally {
      setGeneratingAi(false);
    }
  };

  return (
    <div className="w-[min(1240px,94%)] mx-auto py-8">
      {/* Breadcrumb & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={onBack}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0b1a2b] hover:bg-[#132942] text-[#9fb1c7] hover:text-[#f5f8ff] border border-[#223b57] transition cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للمواد</span>
          </button>
          <span className="text-[#223b57]">/</span>
          <span className="text-[#55a8ff] flex items-center gap-1">
            <span>{subject.icon}</span>
            <span>{subject.name}</span>
          </span>
          {selectedUnit && (
            <>
              <span className="text-[#223b57]">/</span>
              <span className="text-[#43e6a8]">{selectedUnit}</span>
            </>
          )}
          {selectedLesson && (
            <>
              <span className="text-[#223b57]">/</span>
              <span className="text-[#f5f8ff]">{selectedLesson}</span>
            </>
          )}
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onStartQuiz(subject.name, selectedUnit, selectedLesson)}
            disabled={unitQuestions.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-[#43e6a8] to-[#2ecf91] hover:brightness-110 disabled:opacity-40 text-[#04160f] transition shadow-md shadow-[#43e6a8]/20 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>بدء اختبار ({unitQuestions.length} سؤال)</span>
          </button>

          <button
            onClick={() => onOpenExport(subject.name, selectedUnit, selectedLesson, 'pdf')}
            disabled={unitQuestions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#132942] hover:bg-[#1b3a5c] disabled:opacity-40 text-[#55a8ff] border border-[#223b57] transition cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => onOpenExport(subject.name, selectedUnit, selectedLesson, 'images')}
            disabled={unitQuestions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#132942] hover:bg-[#1b3a5c] disabled:opacity-40 text-[#ffc857] border border-[#223b57] transition cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            <span>صور A4</span>
          </button>

          <button
            onClick={handleGenerateAi}
            disabled={generatingAi}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#7928ca] to-[#ff0080] hover:brightness-110 disabled:opacity-50 text-white transition shadow-md cursor-pointer"
            title="توليد 5 أسئلة امتحانية جديدة بالذكاء الاصطناعي وإضافتها للبنك"
          >
            {generatingAi ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري التوليد...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>توليد أسئلة AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {aiSuccessMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-[#0d3025] border border-[#1f6e54] text-[#d5ffef] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#43e6a8]" />
          <span>{aiSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Units Sidebar & Lessons Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Units / Chapters List */}
        <div className="lg:col-span-4 bg-[#0f2035]/90 border border-[#223b57] rounded-3xl p-5 shadow-xl">
          <h4 className="font-extrabold text-sm text-[#f5f8ff] mb-3 flex items-center justify-between">
            <span>الأبواب والوحدات</span>
            <span className="text-xs text-[#9fb1c7]">{sections.length}</span>
          </h4>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {sections.map((sec) => {
              const isSelected = selectedUnit === sec;
              return (
                <button
                  key={sec}
                  onClick={() => {
                    setSelectedUnit(sec);
                    setSelectedSubUnit('');
                    setSelectedLesson('');
                  }}
                  className={`w-full text-right p-3.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#18324f] to-[#1a3d66] text-[#43e6a8] border border-[#43e6a8]/40 shadow-md'
                      : 'bg-[#091827] hover:bg-[#132942] text-[#bfd0e5] border border-[#223b57]/60'
                  }`}
                >
                  <span className="truncate max-w-[200px]">{sec}</span>
                  <ChevronLeft className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? '-translate-x-1 text-[#43e6a8]' : 'text-[#9fb1c7]'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Lessons & Question Bank Browser */}
        <div className="lg:col-span-8 space-y-6">
          {/* Lessons / Subunits Accordion */}
          <div className="bg-[#0f2035]/90 border border-[#223b57] rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-extrabold text-base text-[#f5f8ff]">
                  دروس وأقسام: {selectedUnit}
                </h4>
                <p className="text-xs text-[#9fb1c7]">
                  اضغط على أي درس لتصفيته وبدء اختباره بشكل مستقل
                </p>
              </div>

              {selectedLesson && (
                <button
                  onClick={() => setSelectedLesson('')}
                  className="text-xs text-[#55a8ff] hover:underline cursor-pointer"
                >
                  إلغاء تصفية الدرس (عرض كل الوحدة)
                </button>
              )}
            </div>

            {isNestedUnit ? (
              <div className="space-y-4">
                {Object.keys(lessonData).map((sub) => (
                  <div key={sub} className="bg-[#091827] border border-[#223b57] rounded-2xl p-4">
                    <div className="font-bold text-xs text-[#43e6a8] mb-2">{sub}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {lessonData[sub]?.map((les: string) => {
                        const isLesActive = selectedLesson === les;
                        return (
                          <button
                            key={les}
                            onClick={() => setSelectedLesson(les)}
                            className={`p-2.5 rounded-xl text-right text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                              isLesActive
                                ? 'bg-[#18324f] text-[#43e6a8] border border-[#43e6a8]'
                                : 'bg-[#0b1a2b] hover:bg-[#132942] text-[#bfd0e5] border border-[#223b57]/60'
                            }`}
                          >
                            <span className="truncate">{les}</span>
                            {isLesActive && <div className="w-2 h-2 rounded-full bg-[#43e6a8]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : Array.isArray(lessonData) && lessonData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {lessonData.map((les: string) => {
                  const isLesActive = selectedLesson === les;
                  return (
                    <button
                      key={les}
                      onClick={() => setSelectedLesson(isLesActive ? '' : les)}
                      className={`p-3 rounded-2xl text-right text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                        isLesActive
                          ? 'bg-[#18324f] text-[#43e6a8] border border-[#43e6a8] shadow-md'
                          : 'bg-[#091827] hover:bg-[#132942] text-[#bfd0e5] border border-[#223b57]/60'
                      }`}
                    >
                      <span className="truncate">{les}</span>
                      {isLesActive ? (
                        <div className="w-2 h-2 rounded-full bg-[#43e6a8]" />
                      ) : (
                        <ChevronLeft className="w-3.5 h-3.5 text-[#9fb1c7]" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#091827] border border-[#223b57] text-xs text-[#9fb1c7]">
                هذا القسم شامل لجميع الأسئلة الواردة بالباب دون تقسيم إضافي للدروس.
              </div>
            )}
          </div>

          {/* Question List Preview */}
          <div className="bg-[#0f2035]/90 border border-[#223b57] rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-extrabold text-base text-[#f5f8ff] flex items-center gap-2">
                  <span>بنك الأسئلة الحالي</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#091827] text-[#43e6a8] text-xs font-bold border border-[#223b57]">
                    {unitQuestions.length} سؤال
                  </span>
                </h4>
                <p className="text-xs text-[#9fb1c7]">
                  معاينة لأسئلة الامتحان في هذا القسم
                </p>
              </div>

              {unitQuestions.length > 0 && (
                <button
                  onClick={() => onStartQuiz(subject.name, selectedUnit, selectedLesson)}
                  className="px-3 py-1.5 rounded-xl bg-[#43e6a8] hover:bg-[#2ecf91] text-[#04160f] text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>بدء الاختبار الآن</span>
                </button>
              )}
            </div>

            {loadingQuestions ? (
              <div className="py-12 text-center text-[#9fb1c7]">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#55a8ff]" />
                <span className="text-xs font-semibold">جاري تحميل الأسئلة من السيرفر...</span>
              </div>
            ) : unitQuestions.length > 0 ? (
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {unitQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 rounded-2xl bg-[#091827] border border-[#223b57]/80 hover:border-[#55a8ff]/40 transition"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-[#132942] text-[#55a8ff] text-xs font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="text-xs font-bold text-[#f5f8ff] leading-relaxed flex-1">
                        {q.question || q.q_text}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-2 border-t border-[#223b57]/40">
                      {q.options.map((opt, oi) => {
                        const isCorrect = oi === q.correctAnswer;
                        return (
                          <div
                            key={oi}
                            className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-[#0d3025] text-[#8ff0c7] border border-[#1f6e54]/60'
                                : 'bg-[#0b1a2b] text-[#9fb1c7] border border-[#223b57]/40'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full bg-[#07111f] flex items-center justify-center text-[10px] font-bold">
                              {['أ', 'ب', 'ج', 'د'][oi] || oi + 1}
                            </span>
                            <span className="truncate">{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="mt-2.5 text-[11px] text-[#9fb1c7] bg-[#0b1a2b]/60 p-2.5 rounded-xl border border-[#223b57]/40">
                        <span className="font-bold text-[#ffc857]">الشرح والتعليل:</span> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-[#091827] border border-dashed border-[#223b57] rounded-2xl p-6">
                <HelpCircle className="w-10 h-10 mx-auto mb-2 text-[#9fb1c7] opacity-40" />
                <div className="font-bold text-sm text-[#f5f8ff] mb-1">
                  لا توجد أسئلة مضافة لهذا القسم حتى الآن
                </div>
                <p className="text-xs text-[#9fb1c7] max-w-sm mx-auto mb-4">
                  يمكنك رفع ملفات البنك من لوحة الإدارة، أو استخدام زر "توليد أسئلة AI" لتوليد 5 أسئلة فورية بالذكاء الاصطناعي.
                </p>
                <button
                  onClick={handleGenerateAi}
                  disabled={generatingAi}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#7928ca] to-[#ff0080] hover:brightness-110 text-white transition inline-flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>توليد أسئلة بالذكاء الاصطناعي لهذا القسم</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
