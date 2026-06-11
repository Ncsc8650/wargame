# Wargame Situation Report

เว็บรายงานสถานการณ์ Wargame แบบ static site สำหรับ GitHub Pages พร้อมการซิงก์ข้อมูลไปยัง Google Sheets ผ่าน Google Apps Script

## ไฟล์สำคัญ

- `index.html` เว็บหลัก
- `custom_map.html` ตัวแสดงแผนที่ด้วย Leaflet
- `001pubgmap.png` ภาพแผนที่
- `google_apps_script.gs` โค้ด API สำหรับวางใน Google Apps Script

## Google Sheets ที่ใช้

Spreadsheet ID:

```text
1fHx-iquw-pGeWmHsr0szKxylxIhlFpmujU5PYqvmP0w
```

Apps Script จะสร้างชีตเหล่านี้ให้อัตโนมัติ:

- `Reports`
- `Statuses`
- `Config`

## ตั้งค่า Google Apps Script

1. เปิด Google Sheets ตามลิงก์ของโครงการ
2. ไปที่ `Extensions` > `Apps Script`
3. ลบโค้ดเดิม แล้ววางโค้ดจากไฟล์ `google_apps_script.gs`
4. กด Save
5. กด `Deploy` > `New deployment`
6. เลือกชนิดเป็น `Web app`
7. ตั้งค่า:
   - Execute as: `Me`
   - Who has access: `Anyone`
8. กด Deploy และคัดลอก Web App URL ที่ลงท้ายด้วย `/exec`
9. เปิดเว็บ Wargame > หน้า `ข้อมูลพื้นฐาน`
10. วาง URL ในช่อง `Google Apps Script Web App URL`
11. กด `บันทึกการเชื่อมต่อ`

## การป้องกันข้อมูลเสียหาย

- ทุกการแก้ไขถูกบันทึกลง `localStorage` ในเครื่องทันที
- หากยังไม่ได้เชื่อม Google Sheets หรืออินเทอร์เน็ตหลุด รายการจะถูกเก็บไว้ในคิวรอซิงก์
- เมื่อเชื่อมต่อได้ ระบบจะส่งรายการค้างไป Google Sheets
- การเขียนลงชีตใช้ `id` ของแต่ละรายการเพื่อ upsert แถวเดิม ไม่ล้างข้อมูลทั้งชีต
- มีปุ่ม `สำรองไฟล์ JSON` สำหรับดาวน์โหลด backup ออกจาก browser

## นำขึ้น GitHub Pages

```powershell
git clone https://github.com/Ncsc8650/wargame.git
cd wargame
```

จากนั้นนำไฟล์ชุดนี้เข้า repo แล้ว push ขึ้น GitHub จากหน้า repository ให้เปิด `Settings` > `Pages` และเลือก deploy จาก branch ที่ต้องการ
