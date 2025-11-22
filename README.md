
# FormFlow Builder

เอกสารแนะนำโครงการและการทำงานของ `FormFlow Builder` (เวอร์ชันพัฒนา)

เนื้อหาต่อไปนี้อธิบายภาพรวม สถาปัตยกรรม การตั้งค่า การพัฒนา และการใช้งานของโปรเจคอย่างละเอียด เพื่อช่วยให้คุณเข้าใจและต่อยอดได้อย่างรวดเร็ว

**หมายเหตุ**: เอกสารนี้เขียนเป็นภาษาไทยเพื่อความสะดวก แต่บางตัวอย่างคำสั่งเป็นโค้ด/คอนโซลและใช้ตัวพิมพ์แบบ monospace

---

**ภาพรวมโปรเจค**
- **ชื่อโปรเจค**: FormFlow Builder
- **ประเภท**: Single-page React application (TypeScript) ที่พัฒนาด้วย Vite
- **วัตถุประสงค์**: เครื่องมือสร้างฟอร์มแบบลากวาง (form builder) ที่รองรับการจัดหน้า (pages), conditional logic, ตัวเลือก (options) สำหรับฟิลด์ประเภท select/radio/checkbox, และฟีเจอร์ช่วยเหลือนักออกแบบเช่น autosave / draft / undo-redo

**เทคโนโลยีหลัก**
- React + TypeScript
- Vite (dev server / HMR)
- เบื้องต้นเก็บสถานะในหน่วยความจำของแอปและใช้ `localStorage` สำหรับ draft/autosave

---

**โครงสร้างไฟล์หลัก**
- `App.tsx` — จุดศูนย์กลางของแอป (global state, pages, elements, undo/redo, draft, import/export)
- `types.ts` — คำจำกัดความชนิดข้อมูล (`FormElement`, `FormMetadata`, ฯลฯ)
- `index.tsx` / `index.html` / `vite.config.ts` — การตั้งค่าเริ่มต้นของ Vite/React
- `components/Toolbox.tsx` — รายการ field ที่สามารถเลือกหรือลากเข้าไปใน canvas
- `components/Canvas.tsx` — พื้นที่ทำงานหลัก แสดง elements ตามลำดับ และรองรับการวาง (drop), ย้าย (drag/move), reparenting
- `components/PropertiesPanel.tsx` — แก้ไขคุณสมบัติของ element ที่เลือก (label, placeholder, options, conditional logic และอื่น ๆ)
- `components/Preview.tsx` — แสดงตัวอย่างแบบฟอร์มสำหรับโหมด Preview (read-only)
- `README.md` — ไฟล์นี้

---

**แนวคิดของข้อมูล (Data Model)**
- `FormElement` — แต่ละ field/section ในฟอร์ม มี properties เช่น `id`, `type`, `label`, `placeholder`, `required`, `options?`, `parentId?`, `pageId?`, `logic?` เป็นต้น
- `pages` — อาร์เรย์ของหน้า `{ id, label }` ที่กำหนดโครงสร้างหลายหน้า
- `formMeta` — ข้อมูลเมตาของฟอร์ม (title, description, logo, สี header/footer เป็นต้น)

แนวทางสำคัญ:
- ทุก element มี `id` ที่ไม่ซ้ำ (ระบบรองรับการเปลี่ยนชื่อ label -> auto-generate slug เป็น id และอัพเดต references)
- `parentId` ใช้สำหรับกลุ่ม/section (elements ภายใน section จะมี `parentId` ชี้กลับไปยัง section นั้น)
- `pageId` ระบุหน้าที่ element อยู่ (ช่วยกรอง `Canvas` ให้แสดงเฉพาะ elements ของหน้าเดียวกัน)

---

**ฟีเจอร์เด่นและพฤติกรรมการทำงาน**
- Drag & Drop จาก `Toolbox` ไปยัง `Canvas` — เมื่อวางจะสร้าง `FormElement` ใหม่ โดยสืบทอด `pageId` ของตำแหน่งที่วาง
- Add / Insert behavior — เมื่อมี `selected` element อยู่ การเพิ่ม element ใหม่จะพยายามแทรกภายใน section หรือแทรกหลัง element ที่เลือก
- Options editor — สำหรับ `select`, `radio`, `checkbox` จะมี editor ใน `PropertiesPanel` ให้เพิ่ม/แก้ไข/ลบ/เรียงลำดับตัวเลือก
- Conditional Logic — สามารถสร้างเงื่อนไข (conditions) เพื่อแสดง/ซ่อน field ตามค่าของ field อื่นๆ (UI อยู่ใน `PropertiesPanel`)
- Pages — รองรับหลายหน้า (เพิ่ม/ลบหน้าได้) และ element ถูกผูกกับ `pageId`
- Draft / Autosave — เก็บ schema (metadata + elements + pages) ใน `localStorage` อัตโนมัติเมื่อเปิด `autosave` (debounced) และมีปุ่ม Save/Load/Clear
- Import / Export — สามารถ export เป็น JSON และ import schema (ไฟล์ `.json`)
- Undo / Redo — เก็บ snapshot ของสถานะหลัก (elements/pages/meta/selectedId) เป็น stack เพื่อ undo/redo (มีปุ่มใน header และคีย์ลัด Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)

---

**การตั้งค่าและรันโปรเจค (Development)**
1. ติดตั้ง dependencies
```
npm install
```

2. ตรวจสอบ TypeScript (non-emitting type check)
```
npx tsc --noEmit
```

3. รัน dev server (Vite)
```
npm run dev
```

หมายเหตุ: หากพอร์ตเริ่มต้นที่ Vite พยายามใช้ (เช่น 3000) ถูกใช้งานอยู่ Vite จะพยายามพอร์ตอื่น หากต้องการบังคับพอร์ต ให้ตั้งค่า environment หรือ `vite.config.ts` ตามต้องการ

---

**โครงสร้างการพัฒนา (Developer Notes)**
- State หลักจัดเก็บใน `App.tsx`:
   - `elements` — array ของ `FormElement`
   - `pages` — array ของ `{id,label}`
   - `currentPageId` — id ของหน้าที่กำลังแก้ไข
   - `selectedId` — id ของ element ที่เลือก
   - `formMeta` — metadata ของฟอร์ม
   - `historyPast` / `historyFuture` — stacks สำหรับ undo/redo

- Snapshot strategy: บันทึก snapshot เมื่อ core state มีการเปลี่ยนแปลง (debounced เล็กน้อย) เพื่อป้องกัน snapshot ซ้ำๆ

- Id rename flow: `PropertiesPanel` จะร้องขอการเปลี่ยน `label` ผ่าน `onRequestLabelChange` ไปที่ `App.tsx` ซึ่งจะสร้าง slug ที่ปลอดภัยและไม่ซ้ำ และอัพเดต `id` ของ element พร้อมปรับ `parentId` และเงื่อนไขที่อ้างถึง id นั้น

---

**การทดสอบและการดีบัก**
- ใช้ `npx tsc --noEmit` เพื่อตรวจหา error ของ TypeScript ก่อนรัน
- ใช้ `npm run dev` เพื่อดู HMR และทดสอบการลาก/วาง, การเพิ่ม/ลบหน้า, การบันทึก/โหลด draft
- ถ้า dev server แจ้งว่า "Port X is in use" ให้ตรวจสอบ process ที่ใช้พอร์ตนั้นหรือปล่อยให้ Vite เลือกพอร์ตใหม่

**ข้อสังเกตเกี่ยวกับ accessibility (A11y)**
- พยายามเพิ่ม `aria-label` สำหรับ input ที่ซ่อนหรือปุ่มสำคัญ เช่น hidden file input และ undo/redo buttons
- ยังมีงานที่แนะนำให้ปรับปรุง: ตรวจสอบให้แน่ใจว่า input แต่ละตัวมี label ที่เชื่อถือได้ (ป้ายข้อความหรือ `aria-labelledby`) โดยเฉพาะใน `Preview` และ `PropertiesPanel`

---

**รายการปัญหาที่รู้จักและสิ่งที่จะทำต่อ**
- Undo/Redo: ทำงานบน snapshot แต่ต้องทดสอบกรณี edge เช่น move/reparent ข้ามหน้า หรือลบ section ที่มีลูกหลานที่ซับซ้อน
- Accessibility: ยังมีคำเตือนจาก linter เกี่ยวกับ input ที่ไม่มี label ในบางส่วนของโค้ด — ควรปรับปรุงให้ครบถ้วน
- Preview/Publish: โหมด preview ใช้งานได้ แต่การแชร์/publish schema ยังไม่ได้รวมเข้ากับ backend (ถ้าต้องการฟีเจอร์นี้จะต้องเพิ่ม API)

---

**แนวทางต่อยอด (Suggestions)**
- เพิ่มการยืนยันการกระทำสำคัญ (delete page / delete section) ด้วย modal
- เพิ่มการลาก-วางข้ามหน้า (drag an element to another page) หรือ view สำหรับ reorder pages
- เก็บ history ในรูปแบบที่เล็กลง (เช่น diffs แทน snapshot ทั้งหมด) เพื่อลดการใช้งานหน่วยความจำ
- เพิ่มชุด unit/integration tests (Jest + React Testing Library) สำหรับ critical flows: add/delete/reparent/options/logic

---

**การมีส่วนร่วม (Contributing)**
- ถ้าต้องการส่ง PR ให้ทำงานบน branch ใหม่ และเปิด PR ไปยัง `main` พร้อมคำอธิบายการเปลี่ยนแปลง
- รัน `npx tsc --noEmit` ก่อนเปิด PR เพื่อให้แน่ใจว่าไม่มี TypeScript errors

---

**ลิขสิทธิ์ & สัญญาอนุญาต**
- ไม่มีไฟล์ LICENSE ใน repository นี้โดยอัตโนมัติ — โปรดเพิ่มไฟล์ `LICENSE` หากต้องการกำหนดเงื่อนไขการใช้/เผยแพร่
