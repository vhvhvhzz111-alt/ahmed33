import React, { useEffect, useState } from 'react';
import { AccessCode, QuizResult } from '../types.ts';
import { fetchResultsApi } from '../services/api.ts';
import { X, User, Award, Clock, Smartphone, Sparkles, CheckCircle2, History } from 'lucide-react';

interface ProfileModalProps {
  userCode: AccessCode;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ userCode, onClose }) => {
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResultsApi(userCode.code)
      .then((res) => setHistory(res || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [userCode.code]);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('ar-EG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatExpiry = (ts: number | null) => {
    if (!ts) return 'اشتراك مفتوح (بدون تاريخ انتهاء)';
    return new Date(ts).toLocaleString('ar-EG');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f2035] border border-[#223b57] rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl bg-[#091827] text-[#9fb1c7] hover:text-[#f5f8ff] border border-[#223b57] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#55a8ff] to-[#43e6a8] flex items-center justify-center text-[#04121a] font-black text-xl shadow-lg">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#f5f8ff]">حسابي والنتائج</h3>
            <p className="text-xs font-mono text-[#55a8ff]">{userCode.code}</p>
          </div>
        </div>

        {/* Account Details Box */}
        <div className="bg-[#091827] border border-[#223b57] rounded-2xl p-5 mb-6 space-y-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-[#223b57]/60">
            <span className="text-[#9fb1c7]">الشعبة الدراسية:</span>
            <span className="font-bold text-[#f5f8ff]">{userCode.branch}</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#223b57]/60">
            <span className="text-[#9fb1c7]">نوع الكود:</span>
            <span className="font-bold text-[#43e6a8]">
              {userCode.kind === 'trial' ? 'تجربة مجانية (ساعة)' : 'اشتراك رسمي'}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#223b57]/60">
            <span className="text-[#9fb1c7]">تاريخ الصلاحية:</span>
            <span className="font-mono text-[#bfd0e5]">{formatExpiry(userCode.expiresAt)}</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#223b57]/60">
            <span className="text-[#9fb1c7]">ربط الجهاز (Device ID):</span>
            <span className="font-mono text-[11px] text-[#55a8ff] truncate max-w-[200px]">
              {userCode.deviceId || 'غير مربوط بعد'}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[#9fb1c7]">النقاط والكريديت:</span>
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#ffc857]">{userCode.points || 0} نقطة</span>
              <span className="font-bold text-[#43e6a8]">{userCode.credits || 0} كريديت</span>
            </div>
          </div>
        </div>

        {/* Past Quiz Results */}
        <div>
          <h4 className="font-extrabold text-sm text-[#f5f8ff] mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-[#55a8ff]" />
            <span>سجل الاختبارات والمحاولات السابقة</span>
          </h4>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#9fb1c7]">جاري تحميل النتائج...</div>
          ) : history.length > 0 ? (
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {history.map((h) => {
                const pct = Math.round((h.score / (h.total || 1)) * 100);
                return (
                  <div
                    key={h.id}
                    className="p-3.5 rounded-2xl bg-[#091827] border border-[#223b57] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#f5f8ff]">
                        {h.subject} — {h.unit}
                      </div>
                      <div className="text-[11px] text-[#9fb1c7] mt-0.5">
                        {formatDate(h.createdAt)} • {h.durationSeconds} ثانية
                      </div>
                    </div>

                    <div className="text-left">
                      <span className="text-sm font-black text-[#43e6a8]">{h.score} / {h.total}</span>
                      <div className="text-[11px] text-[#55a8ff] font-mono">({pct}%)</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center bg-[#091827] border border-dashed border-[#223b57] rounded-2xl text-xs text-[#9fb1c7]">
              لم تقم بإجراء أي اختبار بعد. ابدأ بأول اختبار لتحصيل النقاط!
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl bg-[#18324f] hover:bg-[#223b57] text-[#f5f8ff] text-xs font-bold transition cursor-pointer"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};
