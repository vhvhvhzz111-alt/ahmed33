import React, { useState } from 'react';
import { KeyRound, Smartphone, Sparkles, BookOpen, Layers, Zap, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface HeroLoginProps {
  onLogin: (code: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  totalQuestions: number;
}

export const HeroLogin: React.FC<HeroLoginProps> = ({
  onLogin,
  loading,
  error,
  totalQuestions
}) => {
  const [inputCode, setInputCode] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    onLogin(inputCode.trim());
  };

  const demoCodes = [
    { label: 'علمي علوم (شامل)', code: 'ABQ-2027-SUPER', branch: 'علمي علوم' },
    { label: 'علمي رياضة', code: 'ABQ-MATH-2027', branch: 'علمي رياضة' },
    { label: 'أدبي', code: 'ABQ-ADAB-2027', branch: 'أدبي' },
    { label: 'تجربة ساعة مجانية', code: 'TRY-FREE-HOUR', branch: 'تجربة 60 دقيقة' }
  ];

  return (
    <div className="w-[min(1240px,94%)] mx-auto pt-8 pb-16">
      {/* Top Tagline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-14">
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0b1a2b] border border-[#223b57] text-[#43e6a8] text-xs font-semibold w-fit mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>منصة المذاكرة والاختبارات الذكية لثالثة ثانوي 2027</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4 text-[#f5f8ff]">
            ذاكر، اختبر نفسك، وراجع{' '}
            <span className="bg-gradient-to-r from-[#43e6a8] via-[#55a8ff] to-[#f5f8ff] bg-clip-text text-transparent">
              من مكان واحد
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#9fb1c7] leading-relaxed mb-6 max-w-2xl">
            الدخول للمنصة يتم بكود مخصص لشعبتك. الكود يُربط بأول جهاز يتم استخدامه عليه لضمان الأمان والخصوصية، ويمكن للأدمن تجديد مدة الاشتراك أو تجديد الجهاز في أي وقت.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-[#0f2035]/80 border border-[#223b57] rounded-xl p-3">
              <div className="text-xl sm:text-2xl font-black text-[#43e6a8]">{totalQuestions.toLocaleString('ar-EG')}</div>
              <div className="text-xs text-[#9fb1c7]">سؤال بالبنك</div>
            </div>
            <div className="bg-[#0f2035]/80 border border-[#223b57] rounded-xl p-3">
              <div className="text-xl sm:text-2xl font-black text-[#55a8ff]">500,000+</div>
              <div className="text-xs text-[#9fb1c7]">طاقة استيعابية</div>
            </div>
            <div className="bg-[#0f2035]/80 border border-[#223b57] rounded-xl p-3">
              <div className="text-xl sm:text-2xl font-black text-[#ffc857]">10,000+</div>
              <div className="text-xs text-[#9fb1c7]">طالب متزامن</div>
            </div>
            <div className="bg-[#0f2035]/80 border border-[#223b57] rounded-xl p-3">
              <div className="text-xl sm:text-2xl font-black text-[#f5f8ff]">A4 / PDF</div>
              <div className="text-xs text-[#9fb1c7]">تصدير فوري</div>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-gradient-to-b from-[#132942] to-[#0c1c2e] border border-[#223b57] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-between">
            <div className="absolute -top-16 -left-16 w-40 h-40 bg-[#43e6a8]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-[#55a8ff]/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#18324f] border border-[#223b57] flex items-center justify-center text-[#43e6a8]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-[#f5f8ff]">تسجيل الدخول بالكود</h3>
                  <p className="text-xs text-[#9fb1c7]">أدخل كود الاشتراك الخاص بك</p>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#bfd0e5] mb-2">
                    كود الدخول
                  </label>
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="مثال: ABQ-2027-SUPER أو كود التجربة"
                    dir="ltr"
                    className="w-full bg-[#091827] border border-[#223b57] focus:border-[#55a8ff] text-[#f5f8ff] px-4 py-3.5 rounded-xl font-mono text-center text-base tracking-wider outline-none transition placeholder:text-gray-500"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-[#391823] border border-[#6b2b3d] text-[#ffd8df] text-xs leading-relaxed flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#ff5570] shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !inputCode.trim()}
                  className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#43e6a8] to-[#2ecf91] hover:brightness-110 disabled:opacity-50 text-[#04160f] transition shadow-lg shadow-[#43e6a8]/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span>جاري التحقق...</span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      <span>دخول المنصة</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Access Buttons */}
              <div className="mt-6 pt-5 border-t border-[#223b57]">
                <div className="text-xs font-semibold text-[#9fb1c7] mb-2 flex items-center justify-between">
                  <span>أكواد تجريبية سريعة للاختبار:</span>
                  <span className="text-[10px] text-[#43e6a8]">اضغط للدخول المباشر</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {demoCodes.map((d) => (
                    <button
                      key={d.code}
                      type="button"
                      onClick={() => onLogin(d.code)}
                      className="p-2 rounded-lg bg-[#0b1a2b] hover:bg-[#18324f] border border-[#223b57] text-right transition cursor-pointer text-xs"
                    >
                      <div className="font-bold text-[#f5f8ff]">{d.label}</div>
                      <div className="text-[10px] font-mono text-[#55a8ff]">{d.code}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 p-3 rounded-xl bg-[#102844]/60 border border-[#28527d]/60 text-xs text-[#d7e9ff] leading-relaxed flex items-start gap-2">
              <Clock className="w-4 h-4 text-[#ffc857] shrink-0 mt-0.5" />
              <span>
                هدية المنصة: كود التجربة المجانية مدته ساعة كاملة، ويمكن للأدمن تجديده لاحقاً لاشتراك دائم دون فقدان النتائج أو النقاط.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#0f2035]/60 border border-[#223b57] rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#0b1a2b] border border-[#223b57] flex items-center justify-center text-[#43e6a8] shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#f5f8ff] mb-1">المنهج الكامل 2027</h4>
            <p className="text-xs text-[#9fb1c7] leading-relaxed">
              هيكل تفصيلي دقيق لكل المواد والوحدات والدروس لجميع الشُعب (علمي علوم، علمي رياضة، أدبي، وثانوية أزهرية).
            </p>
          </div>
        </div>

        <div className="bg-[#0f2035]/60 border border-[#223b57] rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#0b1a2b] border border-[#223b57] flex items-center justify-center text-[#55a8ff] shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#f5f8ff] mb-1">بنك أسئلة وتصدير احترافي</h4>
            <p className="text-xs text-[#9fb1c7] leading-relaxed">
              إمكانية حل كويز تفاعلي بمؤقت، تصدير ملفات PDF للطباعة بنظام البوكليت، وتصدير صور عالية الدقة (300DPI).
            </p>
          </div>
        </div>

        <div className="bg-[#0f2035]/60 border border-[#223b57] rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#0b1a2b] border border-[#223b57] flex items-center justify-center text-[#ffc857] shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#f5f8ff] mb-1">ربط وحماية الأجهزة</h4>
            <p className="text-xs text-[#9fb1c7] leading-relaxed">
              ربط الكود بأول جهاز مستخدم، مع خاصية تجديد الجهاز من لوحة الإدارة للتحكم الفوري في وصول الطلاب.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
