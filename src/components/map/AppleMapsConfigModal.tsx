import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, Check, ExternalLink, HelpCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface AppleMapsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenSaved: (token: string) => void;
  currentToken: string;
}

export const AppleMapsConfigModal: React.FC<AppleMapsConfigModalProps> = ({
  isOpen,
  onClose,
  onTokenSaved,
  currentToken,
}) => {
  const [tokenInput, setTokenInput] = useState<string>(currentToken);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    setTokenInput(currentToken);
  }, [currentToken, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onTokenSaved(tokenInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setTokenInput('');
    onTokenSaved('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apple-maps-config-title"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
              
            </div>
            <div>
              <h3 id="apple-maps-config-title" className="text-base font-bold flex items-center gap-2">
                <span>Trạng thái Bản đồ Apple Maps</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Miễn phí 100%
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Bản đồ hoạt động trực tiếp, sẵn sàng sử dụng — Không yêu cầu API Key
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-sm text-slate-700">
          {/* Active Status Card */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1.5 text-emerald-950 leading-relaxed">
              <p className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                <span>Bản đồ đang hoạt động bình thường</span>
                <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-md font-normal">
                  Không cần API Key
                </span>
              </p>
              <p>
                Ứng dụng sử dụng công nghệ kết xuất vector và ảnh vệ tinh trực tiếp phong cách <strong>Apple Maps Cupertino</strong>. 
                Bạn <strong>không cần phải đăng ký thẻ tín dụng, không cần mua gói API Key</strong> và không bị giới hạn lượt tra cứu.
              </p>
            </div>
          </div>

          {/* Feature confirmation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-medium text-slate-800">Bản đồ giao thông & đường bộ</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-medium text-slate-800">Ảnh viễn thám vệ tinh độ nét cao</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-medium text-slate-800">Khoanh vùng khuôn viên 3D</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-medium text-slate-800">Chỉ đường trực tiếp trên Apple Maps</span>
            </div>
          </div>

          {/* Optional Advanced Developer Section */}
          <div className="pt-2 border-t border-slate-200">
            <details className="group">
              <summary className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer flex items-center justify-between py-1 list-none">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cài đặt nâng cao: Apple Developer JWT Token (Tùy chọn)</span>
                </span>
                <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-3 space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <p className="text-slate-600">
                  Dành riêng cho lập trình viên muốn thử nghiệm thư viện MapKit JS bằng khóa ký Apple Developer của mình. 
                  Người dùng thông thường <strong>không cần nhập mục này</strong>.
                </p>
                <textarea
                  id="apple-jwt-token"
                  rows={3}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Dán mã JWT token (nếu có)..."
                  className="w-full font-mono text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white text-slate-900 placeholder:text-slate-400"
                />
                {tokenInput && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Xóa token đã lưu
                  </button>
                )}
              </div>
            </details>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-100 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            ✓ Trạng thái: Sẵn sàng sử dụng
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
            >
              Đã hiểu & Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
