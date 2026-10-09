# 🚗📸 TripTales

> **"Plan the trip. Capture the memories."**  
> *เรื่องราวการเดินทาง • วางแผนทริป บันทึกความทรงจำ*

**TripTales** เป็น Mobile-First PWA (Progressive Web App) สำหรับวางแผนการเดินทางและบันทึกความทรงจำของครอบครัว ออกแบบมาเป็นพิเศษให้ใช้งานง่าย สีสันสดใส ปุ่มใหญ่ อ่านง่ายสำหรับเด็ก 6 ขวบและผู้ปกครอง พร้อมระบบคำนวณเส้นทางขับรถ ปรับลำดับจุดแวะให้อัตโนมัติ (Route Optimization) และภารกิจตามล่าภาพถ่าย (Photo Scavenger Hunt) ที่รองรับระบบ Offline-First 100%

---

## ✨ ไฮไลต์และฟีเจอร์เด่น (Features)

### 🗺️ 1. แผนการเดินทาง & นำทาง (Trip Plan & Route)
- **ระบบกำหนดจุดแวะยืดหยุ่น (Configurable Itinerary)**: เพิ่ม แก้ไข ลบ และสลับลำดับสถานที่ได้อิสระ ไม่ต้อง Hard-code ข้อมูล
- **สถานะเข้าใจง่าย**: ปักหมุดสถานะได้ 3 รูปแบบ:
  - `ยังไม่ไป` (Planned)
  - `ไปแล้ว` (Visited - เช็คอิน)
  - `ข้าม` (Skipped - ตัดออกจากเส้นทางคำนวณ)
- **พรีวิวแผนที่ในตัว (Interactive Route Map)**: ขับเคลื่อนด้วย Leaflet & OpenStreetMap (ใช้งานฟรี 100% ไม่ต้องใช้ API Key) แสดงหมุดหมายเลข 1, 2, 3... และเส้นเชื่อมโยงระหว่างจุด
- **คำนวณระยะทางและเวลาขับรถ**: แสดงระยะทาง (กม.) และเวลาเดินทางโดยประมาณระหว่างแต่ละจุด รวมถึงผลรวมตลอดเส้นทาง
- **จัดเส้นทางให้สั้นลง (Optimize Route)**: ระบบคำนวณลำดับสถานที่ที่ดีที่สุด (TSP Heuristic) เพื่อประหยัดระยะทางและน้ำมัน พร้อมแสดงตัวอย่างผลประหยัด (กม. / เวลา) ให้ยืนยันก่อนกดนำไปใช้จริง
- **เชื่อมต่อ Google Maps ทันที**: มีปุ่มเปิดเส้นทางเต็มหรือนำทางเฉพาะจุดเข้าแอป Google Maps บนมือถือได้ทันที

### 📸 2. ภารกิจล่าภาพถ่าย (Photo Scavenger Hunt)
- **เก็บบันทึกหลายรูปต่อภารกิจ**: รองรับการถ่ายรูปด้วยกล้อง (`capture="environment"`) หรือเลือกรูปหลายใบพร้อมกันจากคลังภาพ
- **ยกเลิก / ทำใหม่ (Undo / Do Again)**: สามารถกด "ทำใหม่" เพื่อเปลี่ยนสถานะภารกิจได้ โดยที่**รูปถ่าย ดาว และโน้ตจะไม่ถูกลบ**
- **ให้ดาวเข้าใจง่ายสำหรับเด็ก 6 ขวบ**:
  - ⭐ 1 ดาว: หาเจอภารกิจ
  - ⭐⭐ 2 ดาว: หาเจอ + ถ่ายรูปสำเร็จ
  - ⭐⭐⭐ 3 ดาว: ลูกเป็นคนถ่ายรูปเอง!
- **เขียนโน้ตประจำภารกิจ**: จดข้อความสั้นๆ น่ารักๆ เช่น *"ชอบแมวตัวนี้"*, *"จระเข้ตัวใหญ่มาก"*
- **เกียรติบัตร & สรุปเหรียญรางวัล (Victory Modal)**: มีฉายาเลื่อนขั้น อัลบั้มภาพถ่าย และปุ่มแชร์ผลงานความสำเร็จของสองพ่อลูก

### 📖 3. บันทึกทริปประจำวัน (Today's Memories)
- พื้นที่เขียนไดอารี่สั้นๆ ของครอบครัว *"ความทรงจำวันนี้"*
- เลือกระดับอารมณ์และอิโมจิประจำวัน (😄 🚀 🐊 🍦 😴)
- บันทึกลงหน่วยความจำเครื่อง (IndexedDB) อัตโนมัติ และซิงค์ขึ้น Supabase เมื่อมีอินเทอร์เน็ต

### 📱 4. Child-Friendly & Mobile UX
- ออกแบบสำหรับสมาร์ทโฟน (Android / iOS) จอสัมผัส ปุ่มกดขนาดใหญ่ (Target > 48px)
- ภาษาไทยเข้าใจง่าย กระชับ ชัดเจน
- **Offline-First**: จัดเก็บรูปถ่ายและข้อมูลลง IndexedDB ในเครื่อง ไม่ต้องกลัวสัญญาณเน็ตหลุดระหว่างเดินทาง

---

## 🛠️ สถาปัตยกรรมเทคโนโลยี (Tech Stack)

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 8](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Interactive Maps**: [Leaflet](https://leafletjs.com/) + OpenStreetMap Tiles (พร้อม Fallback Google Maps directions)
- **Local Storage**: IndexedDB (รูปภาพ Base64, แผนที่, ไดอารี่) + `localStorage`
- **Cloud Backend**: [Supabase](https://supabase.com/) (Postgres DB + Supabase Storage Bucket)
- **Hosting & CI/CD**: [Vercel](https://vercel.com/) / GitHub Pages

---

## 🚀 การติดตั้งและรันในเครื่อง (Local Development)

### 1. Clone Repository & ติดตั้ง Dependencies

```bash
git clone https://github.com/mekntp/triptales.git
cd triptales
npm install
```

### 2. กำหนดค่าตัวแปรสภาพแวดล้อม (Environment Variables)

คัดลอกไฟล์ `.env.example` เป็น `.env`:

```bash
cp .env.example .env
```

ระบุค่าคอนฟิก:
```env
# Supabase Configuration (นำมาจาก Supabase Dashboard -> Project Settings -> API)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Google Maps API Key (ไม่บังคับ — หากเว้นว่าง ระบบจะใช้ Leaflet + OpenStreetMap ฟรี 100%)
VITE_GOOGLE_MAPS_API_KEY=
```

### 3. รันเซิร์ฟเวอร์สำหรับพัฒนา

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:5173`

---

## 🗄️ การตั้งค่า Supabase (Database & Storage)

### 1. สร้างตารางฐานข้อมูล (Run Migration)
1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard) แล้วเลือกโปรเจกต์ของคุณ
2. เข้าไปที่เมนู **SQL Editor**
3. คัดลอกโค้ดจากไฟล์ [`supabase/migration_triptales.sql`](./supabase/migration_triptales.sql) มาวางและกด **Run**
4. โครงสร้างตารางจะถูกสร้างขึ้นอัตโนมัติ:
   - `trips`: ข้อมูลทริป
   - `places`: รายการสถานที่และสถานะการเดินทาง
   - `photo_missions`: สถานะภารกิจล่าภาพถ่ายและระดับดาว
   - `photos`: รูปถ่ายที่เก็บใน Supabase Storage
   - `trip_journal`: ไดอารี่ความทรงจำประจำวัน

### 2. ตั้งค่า Storage Bucket (`trip-photos`)
ไฟล์ migration ข้างต้นจะสร้าง Storage Bucket ชื่อ `trip-photos` พร้อมเปิด Public Access ให้อัตโนมัติ:
- หากต้องการตรวจสอบ ให้ไปที่เมนู **Storage** ใน Supabase
- ตรวจสอบว่ามี Bucket ชื่อ `trip-photos` และตั้งค่าเป็น **Public bucket**

---

## 🗺️ การตั้งค่า Google Maps Platform (Optional)

> 💡 **หมายเหตุ**: TripTales ได้รับการออกแบบให้ทำงานได้อย่างสมบูรณ์แบบโดย**ไม่ต้องเสียค่าบริการ Google Maps** โดยใช้แผนที่นำทาง Leaflet ร่วมกับ OpenStreetMap และลิงก์เปิด Directions ในแอป Google Maps บนมือถือ

หากคุณต้องการเปิดใช้งาน Google Maps Platform เพิ่มเติม:
1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้างโปรเจกต์และเปิดใช้งาน Google Maps Platform
3. เปิดใช้งาน API ดังต่อไปนี้:
   - **Maps JavaScript API** (สำหรับแสดงแผนที่ Google ในหน้าเว็บ)
   - **Directions API** (สำหรับดึงเส้นทางขับรถผ่าน API)
4. สร้าง API Key และจำกัดสิทธิ์ (Restrict Key) ให้เฉพาะโดเมนของแอป
5. นำ API Key มาระบุใน `VITE_GOOGLE_MAPS_API_KEY` ในไฟล์ `.env`

---

## 🌐 การนำขึ้นใช้งานจริงบน Vercel (Deployment)

1. Push โค้ดขึ้น GitHub:
   ```bash
   git add .
   git commit -m "Deploy TripTales PWA"
   git push origin main
   ```
2. ไปที่ [Vercel Dashboard](https://vercel.com/) แล้วเลือก **Add New... -> Project**
3. Import คลังโค้ด `triptales`
4. ในส่วน **Environment Variables** เพิ่มค่า:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. กด **Deploy** แอปจะพร้อมใช้งานทันทีและรองรับการติดตั้งเป็น PWA บนมือถือ

---

## 📄 ลิขสิทธิ์ (License)

MIT License © 2026 TripTales — Plan the trip. Capture the memories.
