import React from 'react';
import { AlertTriangle, Phone, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 bg-white border-t border-[var(--color-border)] py-8 px-4 sm:px-6 lg:px-8 text-xs sm:text-sm text-[var(--color-text-muted)]">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Prominent advisory notice */}
        <div className="flex items-start sm:items-center gap-3 p-4 rounded-2xl bg-[var(--color-bg-light)] border border-[var(--color-border)]">
          <AlertTriangle className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-[var(--color-text-main)] font-semibold leading-relaxed">
            Thông tin mang tính tham khảo. Vui lòng gọi trước khi đến để được hướng dẫn thủ tục tiếp nhận và chuẩn bị hồ sơ chu đáo nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Column 1: Privacy and Ethical policy */}
          <div>
            <h4 className="font-bold text-[var(--color-text-main)] text-sm mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[var(--color-cta)]" />
              Bảo mật & Tôn trọng
            </h4>
            <p className="text-xs leading-relaxed">
              Cam kết bảo mật danh tính tuyệt đối cho người đăng ký tự nguyện và thân nhân. Hệ thống dịch vụ công hướng đến mục tiêu phục hồi thể chất, tâm lý và tái hòa nhập xã hội bình đẳng.
            </p>
          </div>

          {/* Column 2: 24/7 Emergency and Helpline */}
          <div>
            <h4 className="font-bold text-[var(--color-text-main)] text-sm mb-2 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-[var(--color-primary)]" />
              Tổng đài tư vấn khẩn cấp
            </h4>
            <p className="text-xs leading-relaxed mb-2">
              Khi cần trợ giúp tâm lý hoặc có tình huống khẩn cấp, hãy liên hệ:
            </p>
            <div className="space-y-1 text-xs">
              <div>Đường dây nóng tư vấn cai nghiện: <strong className="text-[var(--color-primary)]">1800 1096</strong></div>
              <div>Cấp cứu Y tế: <strong className="text-[var(--color-error)]">115</strong></div>
            </div>
          </div>

          {/* Column 3: Prototype notice */}
          <div>
            <h4 className="font-bold text-[var(--color-text-main)] text-sm mb-2 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500" />
              Cổng thông tin phục vụ cộng đồng
            </h4>
            <p className="text-xs leading-relaxed">
              Dữ liệu được cập nhật dựa trên danh mục cơ sở hỗ trợ tại TP.HCM. Tọa độ bản đồ là số liệu minh họa kỹ thuật trên phiên bản prototype và sẽ được hiệu chỉnh định kỳ.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--color-border-subtle)] text-center text-xs text-[var(--color-text-muted)] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © {new Date().getFullYear()} Bản đồ cơ sở hỗ trợ cai nghiện & phục hồi TP. Hồ Chí Minh.
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-emerald-700">● Hệ thống sẵn sàng</span>
            <span>Tiêu chuẩn trợ năng WCAG AA</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
