import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { CertificateItem } from '../types/portfolio';
import { getSafeMediaUrl } from '../utils/media';

interface CertificateLightboxProps {
  certificate: CertificateItem | null;
  onClose: () => void;
}

export function CertificateLightbox({ certificate, onClose }: CertificateLightboxProps) {
  useEffect(() => {
    if (!certificate) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [certificate, onClose]);

  if (!certificate) return null;

  const safeImage = getSafeMediaUrl(certificate.imageUrl);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={certificate.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#191919] rounded-[4px] border border-white/10 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-white/10">
          <div className="min-w-0">
            <p className="text-xs text-[#109E6B] font-medium">
              {certificate.category}
              {certificate.date ? ` · ${certificate.date}` : ''}
            </p>
            <h3 className="font-display text-lg font-semibold text-white mt-0.5">
              {certificate.title}
            </h3>
            <p className="text-sm text-zinc-400 mt-0.5">{certificate.issuer}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close certificate preview"
            className="inline-flex items-center justify-center w-11 h-11 rounded-[3px] border border-white/15 text-zinc-300 hover:bg-white/10 hover:text-white shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#109E6B]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-[#111111] p-4 sm:p-6 flex items-center justify-center">
          {safeImage ? (
            <img
              src={safeImage}
              alt={certificate.title}
              referrerPolicy="no-referrer"
              className="max-h-[65vh] w-auto object-contain rounded-[3px] border border-white/10 bg-white"
            />
          ) : (
            <div className="w-full h-64 rounded-[3px] bg-[#191919] flex items-center justify-center text-sm text-zinc-400">
              Certificate image unavailable
            </div>
          )}
        </div>

        {(certificate.details || certificate.credentialId) && (
          <div className="px-5 py-3.5 border-t border-white/10 bg-[#191919] flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-300">
            <span>{certificate.details}</span>
            {certificate.credentialId && (
              <span className="font-mono text-xs text-zinc-400 tabular-nums">
                ID: {certificate.credentialId}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
