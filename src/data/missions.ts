import type { PhotoMission, RankInfo } from '../types';

export const INITIAL_PHOTO_MISSIONS: PhotoMission[] = [
  {
    id: 1,
    title: 'จระเข้ยักษ์พญาชาละวัน',
    icon: '🐊',
    hint: 'ไปที่บึงสีไฟ แล้วถ่ายรูปคู่กับรูปปั้นจระเข้ตัวใหญ่ที่สุด!',
    placeId: 'p-3',
  },
  {
    id: 2,
    title: 'สถานีรถไฟสุดคลาสสิก',
    icon: '🚂',
    hint: 'ถ่ายรูปตัวอาคารสถานีรถไฟพิจิตรสีครีม หรือคู่กับหัวรถจักร',
    placeId: 'p-1',
  },
  {
    id: 3,
    title: 'ไหว้พระหลวงพ่อเพชร',
    icon: '🙏',
    hint: 'กราบขอพรที่วัดท่าหลวง แล้วถ่ายรูปบริเวณหน้าวิหาร',
    placeId: 'p-2',
  },
  {
    id: 4,
    title: 'ปลาตัวโปรดในอควาเรียม',
    icon: '🐟',
    hint: 'เลือกปลาที่ลูกชอบที่สุดในสถานแสดงพันธุ์ปลา แล้วแชะรูปไว้เลย',
    placeId: 'p-4',
  },
  {
    id: 5,
    title: 'ของกินหรือขนมสุดโปรด',
    icon: '🍧',
    hint: 'ถ่ายรูปเมนูอร่อย ไอศกรีม หรือขนมหวานมื้อนี้',
    placeId: 'p-5',
  },
  {
    id: 6,
    title: 'กำแพงอิฐหรือต้นไม้ยักษ์',
    icon: '🏯',
    hint: 'ถ่ายรูปคู่กับกำแพงโบราณ หรือต้นไม้ใหญ่ที่วัดโพธิ์ประทับช้าง',
    placeId: 'p-7',
  },
  {
    id: 7,
    title: 'วิวน้ำหรือใบบัวบึงสีไฟ',
    icon: '🪷',
    hint: 'ถ่ายภาพวิวผืนน้ำกว้างๆ หรือดอกบัวสวยๆ ริมบึง',
    placeId: 'p-3',
  },
  {
    id: 8,
    title: 'รอยยิ้มพ่อลูกสุดสนุก',
    icon: '📸',
    hint: 'เซลฟี่หรือถ่ายรูปคู่กัน ให้เห็นรอยยิ้มกว้างๆ ในทริปนี้!',
    isBonus: true,
  },
];

export const RANKS: RankInfo[] = [
  {
    minStars: 0,
    maxStars: 5,
    title: 'Explorer เริ่มต้น',
    badge: '🎒',
    description: 'ก้าวแรกของการออกเดินทางสู่แดนพญาชาละวัน!',
    color: 'from-amber-500 to-orange-500',
  },
  {
    minStars: 6,
    maxStars: 12,
    title: 'นักล่าภาพ',
    badge: '📸',
    description: 'เริ่มจับตามองสิ่งรอบตัวและถ่ายรูปสนุกสนาน',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    minStars: 13,
    maxStars: 18,
    title: 'นักผจญภัยยอดเยี่ยม',
    badge: '🧭',
    description: 'สายตาแหลมคม เก็บภารกิจไปได้เยอะมาก!',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    minStars: 19,
    maxStars: 22,
    title: 'Super Explorer',
    badge: '⚡',
    description: 'สุดยอดนักสำรวจตัวจริง ลุยเต็มที่ทุกภารกิจ!',
    color: 'from-purple-500 to-pink-500',
  },
  {
    minStars: 23,
    maxStars: 25,
    title: 'TripTales Photo Master',
    badge: '👑',
    description: 'ปรมาจารย์แห่งภาพถ่าย พิชิตภารกิจสมบูรณ์แบบ!',
    color: 'from-amber-400 via-orange-500 to-yellow-500',
  },
];

export function getRank(totalStars: number): RankInfo {
  if (totalStars >= 23) return RANKS[4];
  if (totalStars >= 19) return RANKS[3];
  if (totalStars >= 13) return RANKS[2];
  if (totalStars >= 6) return RANKS[1];
  return RANKS[0];
}
