import React, { useState, useEffect } from 'react';
import { AccessCode } from '../types.ts';
import { Clock, ShieldCheck, AlertTriangle, Sparkles, Smartphone, Monitor, Zap } from 'lucide-react';

interface CountdownBannerProps {
  userCode: AccessCode | null;
  onOpenAdmin?: () => void;
}

export const CountdownBanner: React.FC<CountdownBannerProps> = ({
  userCode,
  onOpenAdmin
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Guest View (Before Login) - Always show top banner explaining the precise timer system!
  if (!userCode) {
    return (
      <header id="global-timer-guest" className="w-full bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white border-b-2 border-indigo-500/40 py-3 px-4 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-center sm:text-right">
          <div className="flex items-center gap-2.5 mx-auto sm:mx-0">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="font-black text-sm sm:text-base text-emerald-300">
              ⚡ نظام التايمر الذكي بالثانية 2027
            </span>
            <span className="hidden md:inline text-slate-300 text-xs">
              — تجربة مجانية (ساعة كاملة 60 دقيقة) تبدأ بالثانية فور إدخال الكود، أو اشتراكات شهرية متجددة
            </span>
          </div>

          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="text-xs text-slate-300 font-sans hidden sm:inline">المدة الافتراضية:</span>
            <div className="font-mono text-base sm:text-lg font-black text-amber-300 bg-black/60 px-3 py-1 rounded-xl border border-amber-500/40 shadow-inner flex items-center gap-1.5" dir="ltr">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
              <span>01:00:00</span>
              <span className="text-xs font-sans text-amber-400 font-normal">ساعة مجانية</span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  const isAdmin = userCode.isAdmin || userCode.kind === 'admin' || userCode.code.toLowerCase() === 'aljarh123**';

  // 2. Admin Master Banner (Permanent - aljarh123**)
  if (isAdmin) {
    return (
      <header id="global-timer-admin" className="w-full bg-gradient-to-r from-amber-950 via-slate-950 to-amber-950 border-b-2 border-amber-500 text-white py-3 px-4 shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-black text-amber-300 tracking-wide">
                  👑 حساب المشرف العام الأعلى للمنصة (Admin)
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-amber-500/50 text-emerald-400 text-xs sm:text-sm font-mono font-black">
                  {userCode.code}
                </span>
              </div>
              <div className="text-xs text-amber-200/80">
                صلاحيات كاملة غير محدودة • قيد الجهاز: هاتف ذكي واحد + لابتوب ويندوز واحد فقط
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Dual Device Indicators */}
            <div className="flex items-center gap-2 text-xs bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-200">
              <span className={`flex items-center gap-1 font-semibold ${userCode.mobileDeviceId ? 'text-emerald-400' : 'text-amber-400'}`}>
                <Smartphone className="w-3.5 h-3.5" />
                <span>هاتف: {userCode.mobileDeviceId ? '✓ مُسجل' : 'متاح'}</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className={`flex items-center gap-1 font-semibold ${userCode.desktopDeviceId ? 'text-emerald-400' : 'text-amber-400'}`}>
                <Monitor className="w-3.5 h-3.5" />
                <span>لابتوب ويندوز: {userCode.desktopDeviceId ? '✓ مُسجل' : 'متاح'}</span>
              </span>
            </div>

            {onOpenAdmin && (
              <button
                id="btn-admin-panel-top"
                onClick={onOpenAdmin}
                className="px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 transition cursor-pointer shadow-lg shadow-amber-500/20"
              >
                لوحة الإدارة ⚙️
              </button>
            )}
          </div>
        </div>
      </header>
    );
  }

  // 3. Open / Unlimited Code (no expiresAt)
  if (!userCode.expiresAt) {
    return (
      <header id="global-timer-unlimited" className="w-full bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 border-b-2 border-emerald-500/50 text-white py-2.5 px-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="font-extrabold text-emerald-300">اشتراك دائم ومفتوح</span>
            <span className="text-slate-400 hidden sm:inline">• متاح لجميع الامتحانات وتصدير الـ PDF بدون قيود زمنية</span>
          </div>
          <div className="font-mono text-cyan-300 font-bold bg-black/40 px-2.5 py-1 rounded-lg border border-cyan-500/30">
            كود: {userCode.code}
          </div>
        </div>
      </header>
    );
  }

  // 4. Time-Limited Code (Trial Hour or Monthly Sub) with Big Bold Real-Time Countdown!
  const remainingMs = Math.max(0, userCode.expiresAt - now);
  const isExpired = remainingMs <= 0;

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const isTrial = userCode.kind === 'trial' || (userCode.durationMinutes && userCode.durationMinutes <= 120);

  return (
    <header
      id="global-prominent-timer"
      className={`w-full transition-all duration-500 sticky top-0 z-50 shadow-2xl border-b-2 ${
        isExpired
          ? 'bg-gradient-to-r from-red-950 via-slate-950 to-red-950 border-red-500 text-white'
          : isTrial
          ? 'bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-indigo-500 text-white'
          : 'bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 border-emerald-500 text-white'
      }`}
    >
      <div className="max-w-7xl mx-auto py-3 px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center sm:text-right">
          {/* Left Title & Status */}
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black ${
                isExpired
                  ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/40'
                  : isTrial
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {isExpired ? <AlertTriangle className="w-6 h-6" /> : <Clock className="w-6 h-6 animate-pulse" />}
            </div>

            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-sm sm:text-base font-black text-slate-100 tracking-wide">
                  {isExpired
                    ? '⚠️ انتهت صلاحية الكود بالكامل!'
                    : isTrial
                    ? '⏱️ العداد التنازلي للتجربة المجانية (ساعة بالثانية)'
                    : '📅 العداد التنازلي لصلاحية الاشتراك الساري:'}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/20">
                  {userCode.code}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {isExpired
                  ? 'تواصل مع إدارة المنصة لتجديد الكود فوراً ومتابعة الامتحانات'
                  : `${userCode.branch} • ${userCode.points || 0} نقطة محققة`}
              </div>
            </div>
          </div>

          {/* Right: Big, Bold, High-Contrast Digital Timer */}
          <div className="flex flex-col items-center sm:items-end">
            {isExpired ? (
              <div className="flex items-center gap-2 text-red-400 font-mono font-black text-xl sm:text-2xl bg-black/60 px-4 py-1.5 rounded-xl border border-red-500/50">
                <span>00:00:00</span>
                <span className="text-xs font-sans text-red-300 font-bold">(مغلق)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-sans hidden lg:inline">الوقت المتبقي بدقة:</span>
                <div
                  id="live-digital-countdown"
                  className="font-mono text-xl sm:text-2xl md:text-3xl font-black text-amber-300 bg-black/80 px-4 py-1.5 rounded-2xl border-2 border-amber-500/50 shadow-inner flex items-center gap-1.5 tracking-wider"
                  dir="ltr"
                >
                  {days > 0 && (
                    <>
                      <span className="text-white">{days}</span>
                      <span className="text-xs text-amber-400 font-sans font-normal mr-1">يوم</span>
                      <span className="text-slate-600">:</span>
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
          </div>
        </div>
      </div>
    </header>
  );
};
