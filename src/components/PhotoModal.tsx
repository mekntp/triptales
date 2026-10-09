import React from 'react';
import { X, Download } from 'lucide-react';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string | null;
  title: string;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  title,
}) => {
  if (!isOpen || !photoUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = photoUrl;
    a.download = `triptales_${title.replace(/\s+/g, '_')}.jpg`;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex items-center justify-between text-white pb-3 px-1">
          <span className="font-bold text-sm truncate">{title}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full cursor-pointer transition-all"
              title="บันทึกรูป"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full cursor-pointer transition-all"
              title="ปิด"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-white/20 max-h-[75vh] w-full flex items-center justify-center bg-black">
          <img
            src={photoUrl}
            alt={title}
            className="w-full h-auto max-h-[75vh] object-contain"
          />
        </div>
      </div>
    </div>
  );
};
