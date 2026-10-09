import React, { useState } from 'react';
import type { Place, PlaceStatus } from '../types';
import { X, Save, Trash2, MapPin, Sparkles } from 'lucide-react';

interface EditPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  place: Place | null; // null means adding a new place
  onSave: (place: Place) => void;
  onDelete?: (placeId: string) => void;
}

const COMMON_ICONS = ['📍', '🚂', '🐊', '🙏', '🐟', '🍧', '🌳', '🏯', '🏛️', '☕', '🎪', '🏨', '⛽'];

export const EditPlaceModal: React.FC<EditPlaceModalProps> = ({
  isOpen,
  onClose,
  place,
  onSave,
  onDelete,
}) => {
  const isEditing = !!place;

  const [formData, setFormData] = useState<Partial<Place>>(() => {
    if (place) return { ...place };
    return {
      id: `custom-${Date.now()}`,
      name: '',
      icon: '📍',
      subtitle: '',
      description: '',
      tags: [],
      googleMapsUrl: '',
      latitude: undefined,
      longitude: undefined,
      durationMinutes: 30,
      sortOrder: 99,
      status: 'planned' as PlaceStatus,
      isFavoriteForKids: false,
    };
  });

  const [tagInput, setTagInput] = useState(place?.tags?.join(', ') || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('กรุณากรอกชื่อสถานที่ครับ');
      return;
    }

    const tagsArray = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    let mapsUrl = formData.googleMapsUrl?.trim() || '';
    if (!mapsUrl && formData.latitude && formData.longitude) {
      mapsUrl = `https://maps.google.com/?q=${formData.latitude},${formData.longitude}`;
    } else if (!mapsUrl) {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.name || '')}`;
    }

    onSave({
      id: formData.id || `p-${Date.now()}`,
      name: formData.name.trim(),
      icon: formData.icon || '📍',
      subtitle: formData.subtitle?.trim() || '',
      description: formData.description?.trim() || '',
      tags: tagsArray,
      googleMapsUrl: mapsUrl,
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined,
      durationMinutes: formData.durationMinutes ? Number(formData.durationMinutes) : 30,
      sortOrder: formData.sortOrder || 1,
      status: formData.status || 'planned',
      isFavoriteForKids: !!formData.isFavoriteForKids,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-800 text-base">
              {isEditing ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่ใหม่'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Icon Selector */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">ไอคอนประจำจุด:</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_ICONS.map((icon) => (
                <button
                  type="button"
                  key={icon}
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center cursor-pointer transition-all ${
                    formData.icon === icon
                      ? 'bg-amber-500 text-white shadow-xs scale-110'
                      : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Place Name */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              ชื่อสถานที่ <span className="text-rose-500">*</span>:
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="เช่น บึงสีไฟ หรือ วัดท่าหลวง"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">คำโปรยสั้นๆ:</label>
            <input
              type="text"
              value={formData.subtitle || ''}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="เช่น จระเข้ยักษ์ & ลานวิ่งเล่นกว้าง"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">รายละเอียด:</label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="เล่าไฮไลต์หรือกิจกรรมสำหรับครอบครัว..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
            />
          </div>

          {/* GPS Coordinates */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">ละติจูด (Lat):</label>
              <input
                type="number"
                step="any"
                value={formData.latitude ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    latitude: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="16.4258"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">ลองจิจูด (Lng):</label>
              <input
                type="number"
                step="any"
                value={formData.longitude ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    longitude: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="100.3394"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">แท็ก (คั่นด้วยจุลภาค ,):</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="จระเข้, แอร์เย็น, ของอร่อย"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Favorite for Kids toggle */}
          <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-amber-950">จุดนี้เด็กชอบมากเป็นพิเศษ</span>
            </div>
            <input
              type="checkbox"
              checked={formData.isFavoriteForKids || false}
              onChange={(e) => setFormData({ ...formData, isFavoriteForKids: e.target.checked })}
              className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มสถานที่'}</span>
            </button>

            {isEditing && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`ต้องการลบ "${formData.name}" หรือไม่?`)) {
                    onDelete(formData.id!);
                    onClose();
                  }
                }}
                className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer"
                title="ลบสถานที่นี้"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
