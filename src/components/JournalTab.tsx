import React, { useState } from 'react';
import type { TripJournal } from '../types';
import { BookOpen, Save, CheckCircle2, Calendar } from 'lucide-react';

interface JournalTabProps {
  currentJournal: TripJournal;
  allJournals: TripJournal[];
  onSaveJournal: (journal: TripJournal) => void;
}

const MOODS = [
  { emoji: '😄', label: 'สนุกมาก' },
  { emoji: '🚀', label: 'ตื่นเต้น' },
  { emoji: '🐊', label: 'ประทับใจ' },
  { emoji: '🍦', label: 'อิ่มอร่อย' },
  { emoji: '😴', label: 'หมดพลัง' },
];

export const JournalTab: React.FC<JournalTabProps> = ({
  currentJournal,
  allJournals,
  onSaveJournal,
}) => {
  const [note, setNote] = useState(currentJournal.note || '');
  const [selectedMood, setSelectedMood] = useState(currentJournal.mood || '😄');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onSaveJournal({
      ...currentJournal,
      note,
      mood: selectedMood,
      updatedAt: new Date().toISOString(),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-4 text-white shadow-md shadow-orange-500/15">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-yellow-200" />
          <h3 className="font-black text-base">ความทรงจำวันนี้ (Trip Journal)</h3>
        </div>
        <p className="text-xs text-amber-100">
          บันทึกเรื่องราวสั้นๆ ความประทับใจ หรือคำพูดน่ารักๆ ของลูกในวันนี้
        </p>
      </div>

      {/* Journal Entry Card */}
      <div className="bg-white rounded-3xl border border-amber-200/80 p-4 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>วันที่: {currentJournal.date}</span>
          </div>

          {/* Mood Picker */}
          <div className="flex items-center gap-1">
            {MOODS.map((m) => (
              <button
                key={m.emoji}
                onClick={() => setSelectedMood(m.emoji)}
                className={`w-8 h-8 rounded-xl text-base flex items-center justify-center cursor-pointer transition-all ${
                  selectedMood === m.emoji
                    ? 'bg-amber-100 border border-amber-300 scale-110'
                    : 'opacity-60 hover:opacity-100'
                }`}
                title={m.label}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            บันทึกความทรงจำของครอบครัว:
          </label>
          <textarea
            rows={5}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="เช่น วันนี้ลูกตื่นเต้นมากที่ได้เห็นจระเข้ยักษ์พญาชาละวัน และกินไอศกรีมด้วยกันอย่างมีความสุข..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-slate-400">
            {isSaved ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> บันทึกเรียบร้อย!
              </span>
            ) : (
              <span>บันทึกทั้งในเครื่อง & คลาวด์</span>
            )}
          </div>

          <button
            onClick={handleSave}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>บันทึก</span>
          </button>
        </div>
      </div>

      {/* Previous Entries List (if any) */}
      {allJournals.length > 1 && (
        <div className="space-y-2 pt-2">
          <div className="text-xs font-bold text-slate-700 uppercase px-1">
            บันทึกวันก่อนหน้า ({allJournals.length})
          </div>

          <div className="space-y-2">
            {allJournals
              .filter((j) => j.date !== currentJournal.date)
              .map((j) => (
                <div key={j.date} className="bg-white rounded-2xl border border-slate-200 p-3 text-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="font-bold">{j.date}</span>
                    <span>{j.mood || '😄'}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{j.note}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
