import React, { useState } from 'react';
import { ShieldCheck, Lock, X, KeyRound, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => boolean;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(password);
    if (success) {
      setError(false);
      setPassword('');
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in isolate">
      <div className="relative w-full max-w-sm rounded-2xl border border-emerald-700/60 bg-[#092b27] p-6 text-slate-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">Đăng Nhập Quản Trị</h3>
          <p className="mt-1 text-xs text-emerald-300/80">
            Quyền quản trị viên cho phép cập nhật ảnh con và chỉnh sửa thông tin các khu vực
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mật khẩu quản trị:
            </label>
            <div className="relative flex items-center">
              <KeyRound className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400" />
              <input
                type="password"
                placeholder="Nhập mật khẩu (Mặc định: admin)..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className="w-full rounded-xl border border-emerald-800 bg-emerald-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-rose-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Mật khẩu không chính xác. Hãy thử 'admin' hoặc 'admin123'.</span>
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-emerald-500"
            >
              Xác Nhận & Đăng Nhập
            </button>
          </div>

          <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-2.5 text-center text-[11px] text-slate-400">
            💡 Gợi ý nhanh: Bạn có thể nhập mật khẩu <strong className="text-emerald-300">admin</strong> hoặc nhấn Đăng Nhập trực tiếp.
          </div>
        </form>
      </div>
    </div>
  );
};
