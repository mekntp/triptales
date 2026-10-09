import React, { useEffect } from 'react';
import { Star, X, Share2, Award, Camera } from 'lucide-react';
import type { PhotoMission, MissionState } from '../types';
import { getRank } from '../data/missions';
import confetti from 'canvas-confetti';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalStars: number;
  missionStates: Record<number, MissionState>;
  missions: PhotoMission[];
  onOpenPhotoPreview: (url: string, title: string) => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onClose,
  totalStars,
  missionStates,
  missions,
  onOpenPhotoPreview,
}) => {
  const currentRank = getRank(totalStars);

  // Collect all photos from all missions
  const allPhotos: { url: string; title: string; stars: number }[] = [];
  missions.forEach((m) => {
    const state = missionStates[m.id];
    if (state?.photos && state.photos.length > 0) {
      state.photos.forEach((p) => {
        const u = p.url || p.dataUrl;
        if (u) {
          allPhotos.push({
            url: u,
            title: m.title,
            stars: state.stars,
          });
        }
      });
    }
  });

  const completedCount = missions.filter((m) => missionStates[m.id]?.completed).length;

  useEffect(() => {
    if (isOpen) {
      const end = Date.now() + 1.2 * 1000;
      const colors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#fbbf24'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleShare = async () => {
    const text = `🎉 TripTales Phichit Adventure: ครอบครัวเราสะสมได้ ${totalStars} ดาว และเก็บภาพความทรงจำได้ ${allPhotos.length} รูป! ได้รับฉายา ${currentRank.badge} ${currentRank.title}!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TripTales: Phichit Adventure 2026',
          text,
          url: window.location.href,
        });
      } catch {
        // Ignored
      }
    } else {
      alert(text);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-amber-200">
        {/* Banner */}
        <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-6 text-white text-center rounded-t-3xl overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-1.5 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-5xl mb-2 drop-shadow-md animate-bounce">{currentRank.badge}</div>

          <h2 className="text-xl font-black tracking-tight text-white">
            🎉 สรุปผลการผจญภัย TripTales!
          </h2>
          <p className="text-amber-100 text-xs font-medium mt-1">
            Phichit Adventure 2026 • Plan the trip. Capture the memories.
          </p>

          {/* Stats Badges */}
          <div className="mt-4 grid grid-cols-3 gap-2 bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/20">
            <div>
              <div className="text-[10px] text-amber-200 uppercase font-semibold">คะแนนดาว</div>
              <div className="text-base font-black text-yellow-300 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-yellow-300" />
                <span>{totalStars}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-amber-200 uppercase font-semibold">ภารกิจสำเร็จ</div>
              <div className="text-base font-black text-white">
                {completedCount} / {missions.length}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-amber-200 uppercase font-semibold">รูปที่บันทึก</div>
              <div className="text-base font-black text-white flex items-center justify-center gap-1">
                <Camera className="w-3.5 h-3.5" />
                <span>{allPhotos.length} รูป</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Certificate Card */}
          <div className="bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-2xl p-4 text-center">
            <div className="inline-flex items-center gap-1.5 bg-amber-200/80 text-amber-900 text-xs font-bold px-3 py-1 rounded-full mb-2">
              <Award className="w-3.5 h-3.5 text-amber-700" />
              <span>เกียรติบัตรนักผจญภัย</span>
            </div>
            <h3 className="text-lg font-black text-slate-800">
              {currentRank.badge} {currentRank.title}
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
              "{currentRank.description}"
            </p>
          </div>

          {/* Photo Gallery Scrapbook */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              📸 อัลบั้มภาพถ่ายความทรงจำ ({allPhotos.length} รูป)
            </h4>

            {allPhotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {allPhotos.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => onOpenPhotoPreview(item.url, item.title)}
                    className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-md transition-all"
                  >
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 text-white">
                      <div className="text-[10px] font-bold truncate">{item.title}</div>
                      <div className="text-[9px] text-amber-300">
                        {item.stars === 3 ? '⭐⭐⭐' : item.stars === 2 ? '⭐⭐' : '⭐'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
                ยังไม่มีรูปถ่ายในระบบ ถ่ายรูปภารกิจแล้วรูปจะปรากฏที่นี่ครับ!
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-2">
            <button
              onClick={handleShare}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>แชร์ความสำเร็จ</span>
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
