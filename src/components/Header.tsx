import React from 'react';
import { PhoneCall, ShieldCheck, HeartHandshake, Info } from 'lucide-react';

interface HeaderProps {
  onOpenSupportInfo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSupportInfo }) => {
  return (
    <header className="bg-white border-b border-[var(--color-border)] shadow-xs sticky top-0 z-30">
      {/* Skip to main content link for screen readers and keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Chuyển thẳng đến nội dung chính (Phím tắt Tab)
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Identity & Logo */}
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div 
              id="app-logo-badge"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[var(--color-primary-subtle)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] shadow-xs shrink-0"
              aria-hidden="true"
            >
              {/* Shield with embedded heart SVG symbol */}
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-6 h-6 sm:w-7 sm:h-7"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" className="text-[var(--color-primary)] fill-cyan-50" />
                <path d="M12 8c-1.5-1.5-3.5-1-4 0.5-0.5 1.5 0.5 3 4 5.5 3.5-2.5 4.5-4 4-5.5-0.5-1.5-2.5-2-4-0.5z" className="fill-[var(--color-cta)] stroke-[var(--color-cta)]" />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-[var(--color-text-main)] leading-tight">
                  Bản đồ cơ sở hỗ trợ
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-cta-light)] text-[var(--color-cta)] border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Chính quy & Bảo mật
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] font-medium mt-0.5">
                Thông tin hỗ trợ tại TP. Hồ Chí Minh
              </p>
            </div>
          </div>

          {/* Quick Helpline Call Action */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              id="header-consultation-call"
              href="tel:18001096"
              className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[var(--color-primary-light)] hover:bg-[var(--color-primary-subtle)] text-[var(--color-primary-hover)] border border-[var(--color-border)] transition-colors min-h-[44px] focus-accessible"
              aria-label="Gọi tổng đài tư vấn hỗ trợ miễn phí 1800 1096"
              title="Tổng đài tư vấn hỗ trợ tâm lý & cai nghiện miễn phí"
            >
              <PhoneCall className="w-4 h-4 text-[var(--color-primary)] shrink-0 animate-pulse" />
              <div className="text-left leading-tight hidden xs:block">
                <span className="text-[10px] text-[var(--color-text-muted)] block font-normal">Tư vấn miễn phí</span>
                <span className="font-bold tracking-wide">1800 1096</span>
              </div>
              <span className="xs:hidden font-bold">1800 1096</span>
            </a>

            {onOpenSupportInfo && (
              <button
                type="button"
                onClick={onOpenSupportInfo}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl text-[var(--color-text-main)] hover:bg-[var(--color-primary-light)] transition-colors border border-transparent hover:border-[var(--color-border)] min-h-[44px] focus-accessible"
                aria-label="Xem hướng dẫn tra cứu và chính sách bảo mật"
              >
                <Info className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Hướng dẫn</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
