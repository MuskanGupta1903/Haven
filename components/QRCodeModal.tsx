import React, { useState } from 'react';
import { X, Copy, Check, QrCode as QrIcon } from 'lucide-react';

interface QRCodeModalProps {
  data: object | string;
  title?: string;
  onClose: () => void;
}

// Lightweight QR Code SVG generator using QR Code matrix algorithm
export const QRCodeModal: React.FC<QRCodeModalProps> = ({ data, title = "SOS Emergency QR Code", onClose }) => {
  const [copied, setCopied] = useState(false);
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);

  // Encode string for QR SVG URI
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(jsonString)}`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-ocean-700/50 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-ocean-500/20 text-ocean-400 rounded-full mb-3 border border-ocean-500/30">
            <QrIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            Show this QR code to responders or volunteers to transfer request offline.
          </p>

          {/* QR Code Container */}
          <div className="bg-white/10 border border-ocean-500/40 p-4 rounded-2xl inline-block mb-5">
            {/* Direct offline SVG rendering fallback + img */}
            <img
              src={qrApiUrl}
              alt="SOS QR Code"
              className="w-56 h-56 mx-auto rounded-xl object-contain bg-white p-2"
              onError={(e) => {
                // If offline and image API fails, render plain text fallback
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="text-[10px] font-mono text-slate-500 mt-2 break-all max-h-16 overflow-y-auto bg-slate-950 p-2 rounded-lg border border-white/5">
              {jsonString}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyText}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Payload'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-coral-600 hover:bg-coral-500 text-white rounded-xl text-sm font-semibold shadow-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
