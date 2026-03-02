# NGO Task Tracker

ระบบติดตามงานแบบบูรณาการสำหรับองค์กรไม่แสวงหากำไร (Non-Governmental Organizations)

## 🎯 หลักการสำคัญ

**Task ทุกตัวต้องอยู่ภายใต้ Strategy และ Tactic และต้องผูก KPI อย่างน้อย 1 ตัว**

ระบบนี้ออกแบบมาเพื่อให้มั่นใจว่างานทุกชิ้นมีความเชื่อมโยงกับเป้าหมายเชิงกลยุทธ์ขององค์กร:

```
Strategy (ยุทธศาสตร์)
└── Tactic (แผนกลยุทธ์)
    └── KPI (ตัวชี้วัด)
        └── Task (งาน) ← ต้องผูกกับ KPI อย่างน้อย 1 ตัว
```

## ✨ คุณสมบัติหลัก

- **Strategic Alignment**: งานทุกชิ้นต้องเชื่อมโยงกับ Strategy > Tactic > KPI
- **4-Step Task Creation**: Wizard การสร้างงานที่บังคับให้เลือก KPI ก่อนสร้างงาน
- **List & Board View**: ดูงานแบบ List หรือ Kanban Board พร้อม Drag & Drop
- **Progress Tracking**: ติดตามความคืบหน้าพร้อมบันทึก Timeline
- **RBAC**: ระบบสิทธิ์ 4 ระดับ (Superadmin, Admin, Zone Admin, User)
- **Thai Localization**: รองรับภาษาไทยทั้งระบบ

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: TailwindCSS
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT (httpOnly cookies)
- **Validation**: Zod

## 📦 การติดตั้ง

### 1. Clone และติดตั้ง Dependencies

```bash
cd ngo-task-tracker
npm install
```

### 2. ตั้งค่า Environment

สร้างไฟล์ `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ngo_task_tracker"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

### 3. สร้าง Database

```bash
# สร้าง database และ tables
npx prisma db push

# เพิ่มข้อมูลตัวอย่าง
npx prisma db seed
```

### 4. รัน Development Server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## 👥 บัญชีทดสอบ

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@ngo.org | password123 |
| Admin | admin@ngo.org | password123 |
| Zone Admin | zone.admin@ngo.org | password123 |
| User | user@ngo.org | password123 |

## 📁 โครงสร้างโปรเจค

```
src/
├── app/
│   ├── api/              # API Routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── strategies/   # Strategy & Tactic endpoints
│   │   ├── tactics/      # Tactic-specific endpoints
│   │   ├── tasks/        # Task CRUD & relations
│   │   └── users/        # User management
│   ├── (app)/            # Authenticated routes
│   │   ├── dashboard/    # Main dashboard
│   │   ├── tasks/        # All tasks view
│   │   └── tactics/      # Tactic-specific task view
│   └── login/            # Public login page
├── components/
│   ├── layout/           # Sidebar, Header
│   ├── tasks/            # Task-related components
│   └── ui/               # Reusable UI components
├── lib/
│   ├── auth.ts           # Auth utilities & RBAC
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Helper functions
└── types/
    └── index.ts          # TypeScript definitions
```

## 📊 Data Model

### หลักการสำคัญ

1. **Strategy** เป็นระดับสูงสุด (เช่น "ยุทธศาสตร์ที่ 1: พัฒนาศักยภาพชุมชน")
2. **Tactic** อยู่ภายใต้ Strategy (เช่น "แผนกลยุทธ์ 1.1: ฝึกอบรมผู้นำชุมชน")  
3. **KPI** อยู่ภายใต้ Tactic (เช่น "จำนวนผู้นำชุมชนที่ผ่านการอบรม")
4. **Task** ต้องอยู่ภายใต้ Tactic และผูกกับ KPI อย่างน้อย 1 ตัว

### Validation Rules

```typescript
// เมื่อสร้าง Task ระบบจะตรวจสอบ:
1. Tactic ต้องอยู่ภายใต้ Strategy ที่เลือก
2. KPI ทุกตัวต้องอยู่ภายใต้ Tactic ที่เลือก
3. ต้องเลือก KPI อย่างน้อย 1 ตัว
4. ไม่สามารถลบ KPI ตัวสุดท้ายออกจาก Task ได้
```

## 🔐 สิทธิ์การใช้งาน (RBAC)

| Role | สร้างงาน | แก้ไขงาน | ดูงานทั้งหมด | จัดการ User |
|------|---------|---------|--------------|------------|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ (Org ตัวเอง) | ✅ (Org ตัวเอง) | ❌ |
| Zone Admin | ✅ | ✅ (Zone ตัวเอง) | ✅ (Zone ตัวเอง) | ❌ |
| User | ✅ | ✅ (งานตัวเอง) | ✅ (งานตัวเอง) | ❌ |

## 🚀 Production Deployment

### Environment Variables

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="strong-random-secret-32-chars-min"
NODE_ENV="production"
```

### Build

```bash
npm run build
npm start
```

## 📝 API Reference

### Authentication

```
POST /api/auth/login     - เข้าสู่ระบบ
POST /api/auth/logout    - ออกจากระบบ
GET  /api/auth/me        - ข้อมูลผู้ใช้ปัจจุบัน
```

### Tasks

```
GET    /api/tasks              - รายการงาน (paginated)
POST   /api/tasks              - สร้างงานใหม่ (ต้องมี kpiLinks)
GET    /api/tasks/:id          - รายละเอียดงาน
PATCH  /api/tasks/:id          - แก้ไขงาน
DELETE /api/tasks/:id          - ลบงาน
POST   /api/tasks/:id/kpis     - เพิ่ม KPI
DELETE /api/tasks/:id/kpis/:kpiId - ลบ KPI (ถ้ามากกว่า 1)
POST   /api/tasks/:id/updates  - บันทึกความคืบหน้า
POST   /api/tasks/:id/comments - เพิ่มความคิดเห็น
```

### Strategies & Tactics

```
GET /api/strategies              - รายการยุทธศาสตร์ทั้งหมด (รวม Tactics & KPIs)
GET /api/strategies/:id/tactics  - Tactics ของ Strategy
GET /api/tactics/:id/kpis        - KPIs ของ Tactic
GET /api/tactics/:id/tasks       - Tasks ของ Tactic
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - ดู [LICENSE](LICENSE) สำหรับรายละเอียด
