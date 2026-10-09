import React, { useRef, useState } from 'react';
import type { PhotoMission, MissionState } from '../types';
import {
  Camera,
  Image as ImageIcon,
  Check,
  Star,
  Sparkles,
  Trash2,
  Maximize2,
  RotateCcw,
  PenLine,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PhotoHuntTabProps {
  missions: PhotoMission[];
  missionStates: Record<number, MissionState>;
  onUpdateMission: (missionId: number, update: Partial<MissionState>) => void;
  onOpenPhotoPreview: (url: string, title: string) => void;
}

export const PhotoHuntTab: React.FC<PhotoHuntTabProps> = ({
  missions,
  missionStates,
  onUpdateMission,
  onOpenPhotoPreview,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const cameraInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const galleryInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Helper to read and append files
  const handleFilesSelected = (missionId: number, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const current = missionStates[missionId] || {
      missionId,
      completed: false,
      stars: 0,
      photos: [],
      notes: '',
    };

    const currentPhotos = [...(current.photos || [])];
    const fileArray = Array.from(files);

    let loadedCount = 0;
    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        currentPhotos.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          dataUrl: result,
          createdAt: new Date().toISOString(),
        });
        loadedCount++;

        if (loadedCount === fileArray.length) {
          // Auto upgrade stars to at least 2 when photos are captured
          const newStars = current.stars >= 2 ? current.stars : 2;

          onUpdateMission(missionId, {
            photos: currentPhotos,
            stars: newStars,
            completed: true,
            timestamp: new Date().toISOString(),
          });

          // Confetti celebration
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6'],
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove single photo from a mission
  const handleRemovePhoto = (missionId: number, photoId: string) => {
    const current = missionStates[missionId];
    if (!current) return;

    const remainingPhotos = (current.photos || []).filter((p) => p.id !== photoId);
    onUpdateMission(missionId, {
      photos: remainingPhotos,
      // If no photos left, don't necessarily reset stars or completion unless user wants
    });
  };

  // Toggle or choose star rating
  const handleStarSelect = (missionId: number, stars: number) => {
    const current = missionStates[missionId] || {
      missionId,
      completed: false,
      stars: 0,
      photos: [],
      notes: '',
    };

    const isNowCompleted = stars > 0;
    onUpdateMission(missionId, {
      stars,
      completed: isNowCompleted,
    });

    if (stars === 3 || (current.stars === 0 && stars > 0)) {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
      });
    }
  };

  // Undo mission: keep photos, keep note, keep stars, just mark completed = false!
  const handleUndoMission = (missionId: number) => {
    onUpdateMission(missionId, {
      completed: false,
    });
  };

  // Mark mission completed again
  const handleCompleteMission = (missionId: number) => {
    const current = missionStates[missionId];
    const newStars = (current?.stars || 0) > 0 ? current!.stars : 2;
    onUpdateMission(missionId, {
      completed: true,
      stars: newStars,
    });
  };

  // Update mission short note
  const handleNoteChange = (missionId: number, notes: string) => {
    onUpdateMission(missionId, { notes });
  };

  // Filtered missions
  const filteredMissions = missions.filter((m) => {
    const state = missionStates[m.id];
    const isCompleted = state?.completed;
    if (filter === 'completed') return isCompleted;
    if (filter === 'pending') return !isCompleted;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Scoring Explainer Card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3.5 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>กติกาให้ดาว (เข้าใจง่ายสำหรับลูก 6 ขวบ):</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-white/80 p-2 rounded-xl border border-amber-200/50">
            <div className="text-amber-500 font-bold flex justify-center mb-0.5">⭐ 1 ดาว</div>
            <div className="text-slate-600 text-[11px] leading-tight">หาเจอภารกิจ</div>
          </div>
          <div className="bg-white/80 p-2 rounded-xl border border-amber-200/50">
            <div className="text-amber-500 font-bold flex justify-center mb-0.5">⭐⭐ 2 ดาว</div>
            <div className="text-slate-600 text-[11px] leading-tight">หาเจอ + ถ่ายรูป</div>
          </div>
          <div className="bg-amber-100/80 p-2 rounded-xl border border-amber-300">
            <div className="text-orange-600 font-bold flex justify-center mb-0.5">⭐⭐⭐ 3 ดาว</div>
            <div className="text-orange-950 font-semibold text-[11px] leading-tight">ลูกถ่ายรูปเอง!</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-1 bg-white p-1 rounded-2xl border border-slate-200 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-medium transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-amber-500 text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ทั้งหมด ({missions.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-medium transition-all cursor-pointer ${
            filter === 'pending'
              ? 'bg-amber-500 text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ยังไม่ทำ ({missions.filter((m) => !missionStates[m.id]?.completed).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-medium transition-all cursor-pointer ${
            filter === 'completed'
              ? 'bg-emerald-600 text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ทำแล้ว ({missions.filter((m) => missionStates[m.id]?.completed).length})
        </button>
      </div>

      {/* Missions List */}
      <div className="space-y-4">
        {filteredMissions.map((mission) => {
          const state = missionStates[mission.id] || {
            missionId: mission.id,
            completed: false,
            stars: 0,
            photos: [],
            notes: '',
          };
          const isCompleted = state.completed;
          const photos = state.photos || [];

          return (
            <div
              key={mission.id}
              className={`rounded-3xl transition-all duration-200 border overflow-hidden ${
                isCompleted
                  ? 'bg-white border-emerald-300 shadow-sm'
                  : 'bg-white border-amber-200 shadow-xs'
              }`}
            >
              {/* Mission Card Header */}
              <div
                className={`p-3.5 flex items-center justify-between border-b ${
                  isCompleted
                    ? 'bg-emerald-50/70 border-emerald-100'
                    : 'bg-amber-50/50 border-amber-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl drop-shadow-xs">{mission.icon}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-500">
                        {mission.isBonus ? '🏆 ภารกิจพิเศษ' : `⭐ #${mission.id}`}
                      </span>
                      {mission.isBonus && (
                        <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                          +1 Bonus
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{mission.title}</h3>
                  </div>
                </div>

                {/* Status Badges & Undo/Do Again Button */}
                <div className="flex items-center gap-1.5">
                  {isCompleted ? (
                    <>
                      <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-300">
                        <Check className="w-3.5 h-3.5" />
                        <span>ทำแล้ว</span>
                      </div>
                      <button
                        onClick={() => handleUndoMission(mission.id)}
                        className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer"
                        title="ย้อนกลับสถานะ (ไม่ลบรูปถ่าย)"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>ทำใหม่</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleCompleteMission(mission.id)}
                      className="inline-flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-300 transition-all cursor-pointer"
                    >
                      <span>ทำเสร็จแล้ว</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-3.5">
                {/* 🔎 Hint Box */}
                <div className="bg-amber-50/80 rounded-2xl p-3 border border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-950">
                  <span className="text-base shrink-0 mt-[-2px]">🔎</span>
                  <div className="leading-relaxed">
                    <span className="font-bold text-amber-900">คำใบ้: </span>
                    <span>{mission.hint}</span>
                  </div>
                </div>

                {/* Photo Gallery Grid (Multiple Photos) */}
                {photos.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-between">
                      <span>รูปถ่ายในภารกิจ ({photos.length} รูป):</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {photos.map((item, pIdx) => {
                        const imgUrl = item.url || item.dataUrl;
                        if (!imgUrl) return null;

                        return (
                          <div
                            key={item.id || pIdx}
                            className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group aspect-4/3"
                          >
                            <img
                              src={imgUrl}
                              alt={mission.title}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => onOpenPhotoPreview(imgUrl, mission.title)}
                            />

                            <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                              <button
                                onClick={() => onOpenPhotoPreview(imgUrl, mission.title)}
                                className="text-white text-[10px] flex items-center gap-0.5 bg-black/40 px-1.5 py-0.5 rounded cursor-pointer"
                              >
                                <Maximize2 className="w-2.5 h-2.5" /> ดูรูป
                              </button>

                              <button
                                onClick={() => handleRemovePhoto(mission.id, item.id)}
                                className="text-rose-300 hover:text-white bg-rose-600/80 p-1 rounded-full cursor-pointer"
                                title="ลบรูปนี้"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Photo Capture & Upload Buttons */}
                <div className="flex gap-2">
                  {/* Camera Button */}
                  <button
                    onClick={() => cameraInputRefs.current[mission.id]?.click()}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{photos.length > 0 ? 'ถ่ายรูปเพิ่ม' : 'ถ่ายรูป'}</span>
                  </button>

                  {/* Gallery Button */}
                  <button
                    onClick={() => galleryInputRefs.current[mission.id]?.click()}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer border border-slate-200"
                  >
                    <ImageIcon className="w-4 h-4 text-slate-600" />
                    <span>เลือกรูป</span>
                  </button>
                </div>

                {/* Hidden File Inputs */}
                <input
                  ref={(el) => {
                    cameraInputRefs.current[mission.id] = el;
                  }}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    handleFilesSelected(mission.id, e.target.files);
                    e.target.value = '';
                  }}
                />

                <input
                  ref={(el) => {
                    galleryInputRefs.current[mission.id] = el;
                  }}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFilesSelected(mission.id, e.target.files);
                    e.target.value = '';
                  }}
                />

                {/* Mission Short Note Input */}
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
                    <PenLine className="w-3 h-3 text-amber-600" />
                    <span>เขียนโน้ตสั้นๆ:</span>
                  </div>
                  <input
                    type="text"
                    value={state.notes || ''}
                    onChange={(e) => handleNoteChange(mission.id, e.target.value)}
                    placeholder="เช่น ชอบตัวนี้มาก, ลูกตื่นเต้นสุดๆ"
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Star Rating Selector */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">
                      ระดับดาวที่ได้รับ:
                    </span>
                    <span className="text-xs font-bold text-amber-600">
                      {state.stars === 3
                        ? '⭐⭐⭐ 3 ดาว (ลูกถ่ายเอง!)'
                        : state.stars === 2
                        ? '⭐⭐ 2 ดาว (ถ่ายรูปสำเร็จ)'
                        : state.stars === 1
                        ? '⭐ 1 ดาว (หาเจอภารกิจ)'
                        : 'ยังไม่ได้เลือกดาว'}
                    </span>
                  </div>

                  {mission.isBonus ? (
                    <button
                      onClick={() => handleStarSelect(mission.id, state.stars === 1 ? 0 : 1)}
                      className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                        state.stars === 1
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${state.stars === 1 ? 'fill-yellow-200 text-yellow-200' : ''}`} />
                      <span>{state.stars === 1 ? '🏆 ได้รับ Bonus (+1 ดาว) แล้ว' : 'กดรับ Bonus (+1 ดาว)'}</span>
                    </button>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((starNum) => {
                        const isSelected = state.stars === starNum;
                        return (
                          <button
                            key={starNum}
                            onClick={() => handleStarSelect(mission.id, isSelected ? 0 : starNum)}
                            className={`py-2 px-1.5 rounded-2xl text-xs font-medium transition-all cursor-pointer border flex flex-col items-center gap-0.5 ${
                              isSelected
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-bold'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-200'
                            }`}
                          >
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: starNum }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    isSelected
                                      ? 'fill-yellow-200 text-yellow-200'
                                      : 'fill-amber-400 text-amber-400'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px]">
                              {starNum === 1 ? 'หาเจอ' : starNum === 2 ? 'ถ่ายรูปได้' : 'ลูกถ่ายเอง!'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredMissions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">ไม่พบภารกิจในหมวดนี้</p>
            <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนตัวกรองเป็น "ทั้งหมด"</p>
          </div>
        )}
      </div>
    </div>
  );
};
