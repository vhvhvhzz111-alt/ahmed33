import React, { useState, useEffect } from 'react';
import { AccessCode } from '../types.ts';
import { Clock, ShieldAlert, Sparkles, Smartphone, Laptop, AlertTriangle } from 'lucide-react';

interface TopTimerBarProps {
  userCode: AccessCode | null;
  onOpenAdmin?: () => void;
}

export const TopTimerBar: React.FC<TopTimerBarProps> = ({ userCode, onOpenAdmin }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!userCode) {
    return (
      <div id="top-timer-guest-banner" className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-500/30 py-2.5 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-center sm:text-right">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-sm sm:text-base text-emerald-300">
              ⚡ نظام التايمر الذكي بالثانية 2027
            </span>
            <span className="hidden md:inline text-slate-300 text-xs sm:text-sm">
              — متاح تجربة مجانية 60 دقيقة أو اشتراكات شهرية وسنوية تبدأ بالثانية فور إدخال الكود!
            </span>
          </div>

          <div className="flex items-center gap-3 mx-auto sm:mx-0 text-xs sm:text-sm font-mono font-bold text-amber-300 bg-black/40 px-3 py-1 rounded-lg border border-amber-500/30">
            <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>01:00:00 ساعة تجريبية مجانية لكل طالب</span>
          </div>
        </div>
      </div>
    );
  }

  // Admin view (Master Code aljarh123** or isAdmin)
  if (userCode.isAdmin || userCode.kind === 'admin' || userCode.code.toLowerCase() === 'aljarh123**') {
    return (
      <div id="top-timer-admin-bar" className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white border-b-2 border-amber-500 py-3 px-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded-md text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20">
              <Sparkles className="w-4 h-4" />
              <span>لوحة الإدارة العليا</span>
            </div>
            <div>
              <div className="font-black text-sm sm:text-base text-amber-200 flex items-center gap-2">
                <span>الكود الإداري الرئيسي:</span>
                <span className="font-mono text-emerald-400 bg-slate-800/80 px-2 py-0.5 rounded border border-emerald-500/40 text-base sm:text-lg">
                  {userCode.code}
                </span>
                <span className="text-xs text-amber-400 font-normal hidden lg:inline">
                  (صلاحيات مطلقة غير محدودة)
                </span>
              </div>
            </div>
          </div>

          {/* Dual-device indicators (1 Phone + 1 Windows PC) */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-800/90 text-slate-200 px-3 py-1 rounded-lg border border-slate-700 text-xs font-medium">
              <Smartphone className={`w-4 h-4 ${userCode.mobileDeviceId ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>هاتف معتمد:</span>
              <span className={`font-mono font-bold ${userCode.mobileDeviceId ? 'text-emerald-400' : 'text-amber-400'}`}>
                {userCode.mobileDeviceId ? '✓ مُسجل' : 'في الانتظار'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/90 text-slate-200 px-3 py-1 rounded-lg border border-slate-700 text-xs font-medium">
              <Laptop className={`w-4 h-4 ${userCode.desktopDeviceId ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>لابتوب ويندوز:</span>
              <span className={`font-mono font-bold ${userCode.desktopDeviceId ? 'text-emerald-400' : 'text-amber-400'}`}>
                {userCode.desktopDeviceId ? '✓ مُسجل' : 'في الانتظار'}
              </span>
            </div>

            {onOpenAdmin && (
              <button
                id="btn-quick-admin-open"
                onClick={onOpenAdmin}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs transition shadow"
              >
                فتح لوحة الإدارة ⚙️
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Student Countdown calculation
  const expiresAt = userCode.expiresAt;
  const isExpired = expiresAt ? now >= expiresAt : false;
  const remainingMs = expiresAt ? Math.max(0, expiresAt - now) : 0;

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      id="top-student-timer-banner"
      className={`border-b-2 py-3 px-4 shadow-xl transition-colors duration-500 ${
        isExpired
          ? 'bg-red-950/90 border-red-500 text-red-100 animate-pulse'
          : remainingMs < 10 * 60 * 1000
          ? 'bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-amber-500 text-white'
          : 'bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-indigo-500/50 text-white'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
        {/* Title & Status */}
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl flex items-center justify-center ${
              isExpired ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-cyan-400'
            }`}
          >
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-2 justify-center sm:justify-start">
              <span>{userCode.kind === 'trial' ? '⏳ الفترة التجريبية النشطة' : '💎 مدة الاشتراك الساري'}</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white border border-white/10">
                كود: {userCode.code}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {userCode.branch} • {userCode.points || 0} نقطة
            </div>
          </div>
        </div>

        {/* Large Prominent Bold Timer Display */}
        <div className="flex flex-col items-center sm:items-end">
          {isExpired ? (
            <div className="flex items-center gap-2 text-red-400 font-bold text-lg sm:text-2xl font-mono">
              <AlertTriangle className="w-6 h-6" />
              <span>انتهت صلاحية الكود! (00:00:00)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-sans hidden md:inline">الوقت المتبقي بدقة:</span>
              <div
                id="live-countdown-digits"
                className="font-mono text-xl sm:text-2xl md:text-3xl font-black tracking-wider text-amber-300 bg-black/60 px-4 py-1.5 rounded-xl border border-amber-500/40 shadow-inner flex items-center gap-1.5"
                dir="ltr"
              >
                {days > 0 && (
                  <>
                    <span className="text-white">{days}</span>
                    <span className="text-xs text-amber-400 font-sans font-normal mr-1">يوم</span>
                    <span className="text-slate-500">:</span>
                  </>
                )}
                <span className="text-amber-200">{pad(hours)}</span>
                <span className="text-slate-500 animate-ping" style={{ animationDuration: '1s' }}>:</span>
                <span className="text-amber-300">{pad(minutes)}</span>
                <span className="text-slate-500 animate-ping" style={{ animationDuration: '1s' }}>:</span>
                <span className="text-emerald-400">{pad(seconds)}</span>
                <span className="text-xs text-slate-400 font-sans font-normal ml-1 hidden sm:inline">ث</span>
              </div>
            </div>
          )}
          {isExpired && (
            <div className="text-xs text-red-300 mt-1">
              يُرجى مراجعة إدارة المنصة للتجديد واستعادة الوصول الكامل للبنك.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
