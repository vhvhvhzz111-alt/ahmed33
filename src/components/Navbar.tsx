import React from 'react';
import { Shield, User, LogOut, Award, Sparkles, Smartphone } from 'lucide-react';
import { AccessCode } from '../types.ts';

interface NavbarProps {
  userCode: AccessCode | null;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  siteName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  userCode,
  onOpenProfile,
  onOpenAdmin,
  onLogout,
  siteName
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#07111f]/90 backdrop-blur-md border-b border-[#223b57] transition-all">
      <div className="w-[min(1240px,94%)] mx-auto py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#43e6a8] to-[#55a8ff] flex items-center justify-center text-[#04121a] font-black text-2xl shadow-lg shadow-[#43e6a8]/20">
            ع
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight flex items-center gap-1.5">
              <span>{siteName}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-[#132942] text-[#43e6a8] border border-[#223b57]">
                2027
              </span>
            </div>
            <div className="text-xs text-[#9fb1c7]">المنصة الشاملة للثانوية العامة والأزهرية</div>
          </div>
        </div>

        {/* User Stats & Badges */}
        {userCode && (
          <div className="hidden md:flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#0b1a2b] text-[#55a8ff] border border-[#223b57]">
              {userCode.branch}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#0b1a2b] text-[#ffc857] border border-[#223b57]">
              <Award className="w-3.5 h-3.5" />
              <span>{userCode.points} نقطة</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#0b1a2b] text-[#43e6a8] border border-[#223b57]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{userCode.credits} كريديت</span>
            </span>
            {userCode.deviceId && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-[#124632] text-[#8ff0c7]" title="مرتبط بجهازك">
                <Smartphone className="w-3 h-3" />
                <span>جهاز معتمد</span>
              </span>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {userCode && (
            <>
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#132942] hover:bg-[#1b3a5c] text-[#f5f8ff] border border-[#223b57] transition cursor-pointer"
                title="حسابي والنتائج"
              >
                <User className="w-3.5 h-3.5 text-[#55a8ff]" />
                <span>حسابي</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#18324f]/60 hover:bg-[#ff5570]/20 hover:text-[#ff647c] text-[#9fb1c7] border border-[#223b57] transition cursor-pointer"
                title="تسجيل خروج"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </>
          )}

          {userCode && (userCode.isAdmin || userCode.kind === 'admin') && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#ffc857]/20 via-[#43e6a8]/20 to-[#55a8ff]/20 hover:brightness-125 text-[#f5f8ff] border border-[#ffc857]/50 transition cursor-pointer shadow-lg shadow-[#ffc857]/10"
              title="لوحة تحكم المشرف العام"
            >
              <Shield className="w-3.5 h-3.5 text-[#ffc857]" />
              <span>لوحة الإدارة (مشرف)</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
