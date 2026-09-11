import React, { useState } from 'react';
import { AccessCode, BranchType, SubjectMeta } from '../types.ts';
import { SUBJECTS_BY_BRANCH } from '../data/curriculum.ts';
import { BookOpen, Search, ChevronLeft, Sparkles, Clock, Layers } from 'lucide-react';
import { getSubjectStyle } from '../utils/subjectStyles.ts';

interface BranchExplorerProps {
  userCode: AccessCode;
  onSelectSubject: (subject: SubjectMeta) => void;
  questionCounts: Record<string, number>;
  totalQuestionsCount?: number;
}

export const BranchExplorer: React.FC<BranchExplorerProps> = ({
  userCode,
  onSelectSubject,
  questionCounts,
  totalQuestionsCount = 0
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const branch = userCode.branch as BranchType;
  const subjects = SUBJECTS_BY_BRANCH[branch] || [];

  const totalInBranch = Object.values(questionCounts).reduce((a, b) => a + b, 0);
  const displayTotal = totalQuestionsCount && totalQuestionsCount > 0 ? totalQuestionsCount : totalInBranch;

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.defaultSections.some(sec => sec.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatExpiry = (ts: number | null) => {
    if (!ts) return 'بدون تاريخ انتهاء (مفتوح)';
    const d = new Date(ts);
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-[min(1240px,94%)] mx-auto py-8">
      {/* Top Welcome Panel */}
      <div className="bg-gradient-to-r from-[#132942] to-[#0c1c2e] border border-[#223b57] rounded-3xl p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0b1a2b] border border-[#223b57] text-xs font-bold text-[#43e6a8] mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>شعبتك الحالية: {userCode.branch}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#f5f8ff] mb-2">
              أهلاً بك في منصة العباقرة 👋
            </h2>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#9fb1c7]">
              <Clock className="w-4 h-4 text-[#55a8ff]" />
              <span>صلاحية الكود حتى: {formatExpiry(userCode.expiresAt)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-[#091827] border border-[#223b57] px-5 py-4 rounded-2xl">
            <div className="text-center">
              <div className="text-2xl font-black text-[#43e6a8]">
                {displayTotal > 0 ? displayTotal.toLocaleString('ar-EG') : '100,000+'}
              </div>
              <div className="text-xs text-[#9fb1c7]">إجمالي بنك الأسئلة</div>
            </div>
            <div className="w-px h-8 bg-[#223b57]" />
            <div className="text-center">
              <div className="text-2xl font-black text-[#55a8ff]">{subjects.length}</div>
              <div className="text-xs text-[#9fb1c7]">مواد الشعبة</div>
            </div>
            <div className="w-px h-8 bg-[#223b57]" />
            <div className="text-center">
              <div className="text-2xl font-black text-[#ffc857]">{userCode.points || 0}</div>
              <div className="text-xs text-[#9fb1c7]">نقاطك</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-[#f5f8ff]">المواد الدراسية المقررة</h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#43e6a8]/10 text-[#43e6a8] border border-[#43e6a8]/30">
              {displayTotal.toLocaleString('ar-EG')} سؤال متاح
            </span>
          </div>
          <p className="text-xs text-[#9fb1c7]">
            اختر المادة لتصفح بنك الأسئلة، الأبواب، الدروس، وبدء الامتحانات التفاعلية أو تحميل وطباعة الأسئلة
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9fb1c7]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث في المواد والوحدات..."
            className="w-full bg-[#0b1a2b] border border-[#223b57] focus:border-[#55a8ff] text-[#f5f8ff] pr-10 pl-4 py-2 rounded-xl text-xs outline-none transition placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSubjects.map((s) => {
          const qCount = questionCounts[s.name] || 0;
          const style = getSubjectStyle(s.name);
          return (
            <div
              key={s.name}
              onClick={() => onSelectSubject(s)}
              className={`group bg-gradient-to-b ${style.gradient} border border-[#223b57] ${style.borderHover} rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer flex flex-col justify-between relative overflow-hidden`}
              style={{
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
              }}
            >
              {/* Subtle glowing corner */}
              <div 
                className="absolute -top-12 -left-12 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity"
                style={{ backgroundColor: style.accentColor }}
              />

              <div>
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-[#091827]/90 border border-[#223b57] flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                    {style.emoji}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span 
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#091827]/90 border border-[#223b57] shadow-sm"
                      style={{ color: style.accentColor }}
                    >
                      <span>{qCount.toLocaleString('ar-EG')} سؤال</span>
                    </span>
                    <span className="text-[10px] text-[#9fb1c7] font-medium">
                      {style.badge}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1.5 relative z-10">
                  <h4 className="text-xl font-black text-[#f5f8ff] group-hover:text-white transition-colors">
                    {s.name}
                  </h4>
                  <span className="text-sm">{style.secondaryEmoji}</span>
                </div>

                <div className="text-xs text-[#9fb1c7] mb-4 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#55a8ff]" />
                  <span>{s.defaultSections.length} أبواب وفصول رئيسية</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2 relative z-10">
                  {s.defaultSections.slice(0, 4).map((sec) => (
                    <span
                      key={sec}
                      className="px-2 py-0.5 rounded-md bg-[#091827]/80 text-[#bfd0e5] text-[11px] border border-[#223b57]/60 truncate max-w-[140px]"
                    >
                      {sec}
                    </span>
                  ))}
                  {s.defaultSections.length > 4 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-[#091827] text-[#55a8ff] text-[11px] border border-[#223b57]">
                      +{s.defaultSections.length - 4} المزيد
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#223b57]/60 flex items-center justify-between text-xs font-bold text-[#55a8ff] group-hover:text-[#43e6a8] transition-colors relative z-10">
                <span>فتح المنهج وبنك الأسئلة</span>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="p-12 text-center bg-[#0b1a2b] border border-[#223b57] rounded-2xl text-[#9fb1c7]">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-[#55a8ff] opacity-60" />
          <div className="font-bold text-sm">لا توجد مواد مطابقة لكلمة البحث</div>
          <div className="text-xs mt-1">جرّب البحث باسم وحدة أخرى أو امسح البحث.</div>
        </div>
      )}
    </div>
  );
};
