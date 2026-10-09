import React, { useState } from 'react';
import { X, Cloud, Save, RefreshCw, Trash2, CheckCircle2, Download, Upload, Shield } from 'lucide-react';
import { getStoredSupabaseConfig, saveSupabaseConfig, resetSupabaseClient, getSupabaseClient } from '../lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetAllData: () => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSyncToSupabase: () => Promise<void>;
  isSyncing: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onResetAllData,
  onExportBackup,
  onImportBackup,
  onSyncToSupabase,
  isSyncing,
}) => {
  const [config, setConfig] = useState(getStoredSupabaseConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    saveSupabaseConfig(config);
    resetSupabaseClient();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const isConnected = !!getSupabaseClient();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-800 text-base">การตั้งค่า & ระบบคลาวด์</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs">
          {/* Offline First Notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5 text-emerald-900">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">ระบบ Offline-First พร้อมทำงาน 100%:</p>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                รูปถ่าย แผนการเดินทาง และบันทึกทริปจะถูกบันทึกลงในเครื่อง (IndexedDB) อัตโนมัติ ไม่มีเน็ตก็เปิดดูและใช้งานได้
              </p>
            </div>
          </div>

          {/* Supabase Cloud Sync Section */}
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>⚡ เชื่อมต่อ Supabase Cloud</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isConnected
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {isConnected ? '✓ พร้อมซิงค์' : 'โหมดในเครื่อง'}
              </span>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Supabase Project URL:
              </label>
              <input
                type="text"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                placeholder="https://your-project.supabase.co"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Supabase Anon Key (Public Key):
              </label>
              <input
                type="password"
                value={config.anonKey}
                onChange={(e) => setConfig({ ...config, anonKey: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                ดูคีย์นี้ได้จาก Supabase Dashboard &gt; Project Settings &gt; API
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveConfig}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกการตั้งค่า</span>
              </button>

              <button
                onClick={onSyncToSupabase}
                disabled={isSyncing}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                  isSyncing
                    ? 'bg-amber-300 text-amber-800 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ขึ้น Cloud'}</span>
              </button>
            </div>

            {savedSuccess && (
              <div className="text-emerald-600 text-xs flex items-center gap-1 font-semibold justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" /> บันทึกการตั้งค่าเรียบร้อย!
              </div>
            )}
          </div>

          {/* Backup / Export Section */}
          <div className="space-y-2 pt-1">
            <span className="font-bold text-slate-700 block">📦 สำรองและกู้คืนข้อมูล (JSON):</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExportBackup}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>สำรองไฟล์ (JSON)</span>
              </button>

              <label className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all text-center">
                <Upload className="w-3.5 h-3.5" />
                <span>นำเข้าไฟล์สำรอง</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={onImportBackup}
                />
              </label>
            </div>
          </div>

          {/* GitHub Repo Link */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <span className="font-bold text-slate-700 block">🔗 รหัสโปรเจกต์ (GitHub):</span>
            <a
              href="https://github.com/nattapat-poo/triptales"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
            >
              <span className="font-semibold text-slate-800">🐙 GitHub Repo</span>
              <span className="text-slate-400 text-[10px]">nattapat-poo/triptales</span>
            </a>
          </div>

          {/* Reset All Progress Section */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={onResetAllData}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>รีเซ็ตข้อมูลทริปทั้งหมด (เริ่มต้นใหม่)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
