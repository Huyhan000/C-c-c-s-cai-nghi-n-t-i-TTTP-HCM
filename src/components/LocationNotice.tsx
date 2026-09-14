import React from 'react';
import { AlertCircle, MapPinOff, CheckCircle2, X } from 'lucide-react';
import { LocationPermissionState } from '../types';

interface LocationNoticeProps {
  locationState: LocationPermissionState;
  onDismiss: () => void;
  onRequestAgain: () => void;
}

export const LocationNotice: React.FC<LocationNoticeProps> = ({
  locationState,
  onDismiss,
  onRequestAgain,
}) => {
  if (locationState === 'idle' || locationState === 'prompting') {
    return null;
  }

  if (locationState === 'denied') {
    return (
      <div 
        role="alert" 
        className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-4.5 text-[var(--color-text-main)] shadow-xs transition-all animate-fadeIn"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5" aria-hidden="true">
              <MapPinOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Quyền truy cập vị trí đang tắt
              </h3>
              <p className="text-xs sm:text-sm text-amber-800 mt-1 leading-relaxed">
                Bạn hoàn toàn có thể tiếp tục <strong>tra cứu thủ công</strong> bằng thanh tìm kiếm, chọn khu vực hoặc bấm trực tiếp vào các cơ sở trên bản đồ mà không cần chia sẻ vị trí.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onRequestAgain}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 transition-colors focus-accessible min-h-[36px]"
                >
                  Thử lại quyền vị trí
                </button>
                <span className="text-xs text-amber-700">
                  (Hoặc chọn khu vực Hóc Môn, Củ Chi, Bình Triệu bên dưới)
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Đóng thông báo vị trí"
            className="p-1.5 text-amber-700 hover:text-amber-950 rounded-lg hover:bg-amber-100 transition-colors focus-accessible"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (locationState === 'unsupported') {
    return (
      <div 
        role="alert" 
        className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[var(--color-text-main)] shadow-xs transition-all"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Trình duyệt chưa hỗ trợ định vị tự động
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Vui lòng sử dụng tính năng tìm kiếm theo địa chỉ hoặc chọn cơ sở trực tiếp trên danh sách và bản đồ.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Đóng thông báo"
            className="p-1 text-slate-500 hover:text-slate-800 rounded-lg focus-accessible"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (locationState === 'granted') {
    return (
      <div 
        role="status" 
        className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 sm:p-3.5 text-emerald-950 shadow-xs flex items-center justify-between gap-3 animate-fadeIn"
      >
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-[var(--color-cta)] shrink-0" />
          <p className="text-xs sm:text-sm font-medium">
            Đã xác định tọa độ hiện tại. Danh sách đã được sắp xếp theo <strong>khoảng cách gần nhất đến bạn</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Ẩn thông báo xác định vị trí"
          className="p-1 text-emerald-700 hover:text-emerald-950 rounded-lg hover:bg-emerald-100 transition-colors focus-accessible shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
};
