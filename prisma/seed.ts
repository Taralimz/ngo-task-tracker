import { PrismaClient, UserRole, KPIFrequency, TaskStatus, TaskPriority, ContributionType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting RSAT seed...')

  // Clean up
  await prisma.activityLog.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.taskUpdate.deleteMany()
  await prisma.taskTeamAssignee.deleteMany()
  await prisma.taskAssignee.deleteMany()
  await prisma.taskKPI.deleteMany()
  await prisma.task.deleteMany()
  await prisma.list.deleteMany()
  await prisma.folder.deleteMany()
  await prisma.kPIValue.deleteMany()
  await prisma.kPI.deleteMany()
  await prisma.tactic.deleteMany()
  await prisma.strategy.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.userPermissionGroup.deleteMany()
  await prisma.permissionGroup.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.user.deleteMany()
  await prisma.org.deleteMany()

  // Create Organizations (5 สำนัก)
  const orgs = await Promise.all([
    prisma.org.create({
      data: { name: 'สำนักอำนวยการ', zone: null, province: 'กรุงเทพมหานคร' },
    }),
    prisma.org.create({
      data: { name: 'สำนักระบบบริการสุขภาพ', zone: null, province: 'กรุงเทพมหานคร' },
    }),
    prisma.org.create({
      data: { name: 'สำนักระบบบริการชุมชน', zone: null, province: 'กรุงเทพมหานคร' },
    }),
    prisma.org.create({
      data: { name: 'สำนักสิทธิมนุษยชนและความยั่งยืน', zone: null, province: 'กรุงเทพมหานคร' },
    }),
    prisma.org.create({
      data: { name: 'ฝ่ายนโยบายและข้อมูลเชิงยุทธศาสตร์', zone: null, province: 'กรุงเทพมหานคร' },
    }),
  ])

  console.log('✅ Created organizations')

  // Create Users
  const passwordHash = await bcrypt.hash('password123', 10)
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'superadmin@rsat.org',
        passwordHash,
        fullName: 'ผู้ดูแลระบบหลัก',
        role: UserRole.superadmin,
        orgId: orgs[0].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin.amnuay@rsat.org',
        passwordHash,
        fullName: 'หัวหน้าสำนักอำนวยการ',
        role: UserRole.admin,
        orgId: orgs[0].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin.health@rsat.org',
        passwordHash,
        fullName: 'หัวหน้าสำนักระบบบริการสุขภาพ',
        role: UserRole.admin_zone,
        orgId: orgs[1].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin.community@rsat.org',
        passwordHash,
        fullName: 'หัวหน้าสำนักระบบบริการชุมชน',
        role: UserRole.admin_zone,
        orgId: orgs[2].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin.humanrights@rsat.org',
        passwordHash,
        fullName: 'หัวหน้าสำนักสิทธิมนุษยชนและความยั่งยืน',
        role: UserRole.admin_zone,
        orgId: orgs[3].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin.policy@rsat.org',
        passwordHash,
        fullName: 'หัวหน้าฝ่ายนโยบายและข้อมูลเชิงยุทธศาสตร์',
        role: UserRole.admin_zone,
        orgId: orgs[4].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'user@rsat.org',
        passwordHash,
        fullName: 'เจ้าหน้าที่โครงการ',
        role: UserRole.user_org,
        orgId: orgs[0].id,
      },
    }),
  ])

  console.log('✅ Created users')

  // =============================================
  // TEAMS (กลุ่มงาน)
  // =============================================
  const teams = await Promise.all([
    prisma.team.create({
      data: {
        name: 'ทีมสื่อสารองค์กร',
        description: 'รับผิดชอบงานสื่อสาร การตลาด และประชาสัมพันธ์',
        color: '#3B82F6',
        isDefault: false,
        members: {
          create: [
            { userId: users[0].id, role: 'leader' },
            { userId: users[1].id, role: 'member' },
            { userId: users[6].id, role: 'member' },
          ],
        },
      },
    }),
    prisma.team.create({
      data: {
        name: 'ทีมวิจัยและพัฒนา',
        description: 'รับผิดชอบงานวิจัย การพัฒนาองค์ความรู้ และการจัดการข้อมูล',
        color: '#10B981',
        isDefault: false,
        members: {
          create: [
            { userId: users[5].id, role: 'leader' },
            { userId: users[0].id, role: 'member' },
          ],
        },
      },
    }),
    prisma.team.create({
      data: {
        name: 'ทีมบริการสุขภาพ',
        description: 'รับผิดชอบการให้บริการด้านสุขภาพและคลินิก',
        color: '#F59E0B',
        isDefault: false,
        members: {
          create: [
            { userId: users[2].id, role: 'leader' },
            { userId: users[6].id, role: 'member' },
          ],
        },
      },
    }),
    prisma.team.create({
      data: {
        name: 'ทีมชุมชนสัมพันธ์',
        description: 'รับผิดชอบงานชุมชน อาสาสมัคร และกิจกรรมสังคม',
        color: '#8B5CF6',
        isDefault: false,
        members: {
          create: [
            { userId: users[3].id, role: 'leader' },
            { userId: users[4].id, role: 'member' },
          ],
        },
      },
    }),
    prisma.team.create({
      data: {
        name: 'ทีมทั่วไป',
        description: 'ทีมเริ่มต้นสำหรับพนักงานใหม่',
        color: '#6B7280',
        isDefault: true,
      },
    }),
  ])

  console.log('✅ Created teams')

  // =============================================
  // PERMISSION GROUPS (กลุ่มสิทธิ์)
  // =============================================
  const permissionGroups = await Promise.all([
    prisma.permissionGroup.create({
      data: {
        name: 'ผู้ดูแลระบบเต็มรูปแบบ',
        description: 'มีสิทธิ์เข้าถึงทุกฟังก์ชันของระบบ',
        permissions: [
          'task.view', 'task.create', 'task.edit', 'task.delete', 'task.assign',
          'kpi.view', 'kpi.create', 'kpi.edit', 'kpi.delete', 'kpi.value_entry',
          'strategy.view', 'strategy.manage',
          'user.view', 'user.manage',
          'team.view', 'team.manage',
          'report.view', 'report.export',
          'system.settings', 'system.audit_log',
        ],
        isSystem: true,
        users: {
          create: [
            { userId: users[0].id },
          ],
        },
      },
    }),
    prisma.permissionGroup.create({
      data: {
        name: 'ผู้จัดการโครงการ',
        description: 'จัดการงาน KPI และรายงาน',
        permissions: [
          'task.view', 'task.create', 'task.edit', 'task.assign',
          'kpi.view', 'kpi.value_entry',
          'strategy.view',
          'user.view',
          'team.view',
          'report.view', 'report.export',
        ],
        isSystem: false,
        users: {
          create: [
            { userId: users[1].id },
            { userId: users[2].id },
            { userId: users[3].id },
            { userId: users[4].id },
            { userId: users[5].id },
          ],
        },
      },
    }),
    prisma.permissionGroup.create({
      data: {
        name: 'เจ้าหน้าที่ปฏิบัติการ',
        description: 'ดูและอัปเดตงานที่ได้รับมอบหมาย',
        permissions: [
          'task.view_own', 'task.edit',
          'kpi.view', 'kpi.value_entry',
          'strategy.view',
          'report.view',
        ],
        isSystem: false,
        users: {
          create: [
            { userId: users[6].id },
          ],
        },
      },
    }),
    prisma.permissionGroup.create({
      data: {
        name: 'ผู้ชมรายงาน',
        description: 'ดูรายงานและข้อมูลสถิติเท่านั้น',
        permissions: [
          'task.view',
          'kpi.view',
          'strategy.view',
          'report.view',
        ],
        isSystem: false,
      },
    }),
  ])

  console.log('✅ Created permission groups')

  // =============================================
  // STRATEGIES (6 ยุทธศาสตร์)
  // =============================================
  const strategies = await Promise.all([
    prisma.strategy.create({
      data: {
        code: 'STR-01',
        name: 'ยุทธศาสตร์ด้านสิทธิมนุษยชน',
        description: 'ส่งเสริมและปกป้องสิทธิมนุษยชนของกลุ่ม LGBTIQN+ ผ่านการสร้างความตระหนัก การรณรงค์เชิงนโยบาย และการให้ความช่วยเหลือ',
        sortOrder: 1,
      },
    }),
    prisma.strategy.create({
      data: {
        code: 'STR-02',
        name: 'ยุทธศาสตร์ด้านความยั่งยืนและการระดมทรัพยากร',
        description: 'สร้างความยั่งยืนทางการเงินผ่านวิสาหกิจเพื่อสังคม การตลาดเพื่อสังคม และการระดมทุน',
        sortOrder: 2,
      },
    }),
    prisma.strategy.create({
      data: {
        code: 'STR-03',
        name: 'ยุทธศาสตร์ด้านการพัฒนาระบบสุขภาพ',
        description: 'พัฒนาบริการสุขภาพที่ครอบคลุมและเป็นมิตรกับกลุ่ม LGBTIQN+ รวมถึงการพัฒนาศักยภาพบุคลากร',
        sortOrder: 3,
      },
    }),
    prisma.strategy.create({
      data: {
        code: 'STR-04',
        name: 'ยุทธศาสตร์ด้านการวิจัยและพัฒนาสู่ความเป็นสากล',
        description: 'เป็นผู้นำด้านวิชาการและวิจัยในงาน LGBTIQN+ ระดับประเทศและภูมิภาค',
        sortOrder: 4,
      },
    }),
    prisma.strategy.create({
      data: {
        code: 'STR-05',
        name: 'ยุทธศาสตร์ด้านการพัฒนาศักยภาพของชุมชนความหลากหลายทางเพศและกลุ่มผู้มีอัตลักษณ์ทับซ้อน',
        description: 'พัฒนาระบบอาสาสมัคร กิจกรรมชุมชน และการสร้างแรงจูงใจให้กับชุมชน LGBTIQN+',
        sortOrder: 5,
      },
    }),
    prisma.strategy.create({
      data: {
        code: 'STR-06',
        name: 'ยุทธศาสตร์ด้านการสร้างเสริมขีดความสามารถในการบริหารจัดการเพื่อความยั่งยืนของสมาคมฯ',
        description: 'พัฒนาระบบบริหารจัดการ Digital Platform การสื่อสารองค์กร และการบริหารการเงิน',
        sortOrder: 6,
      },
    }),
  ])

  console.log('✅ Created strategies')

  // =============================================
  // TACTICS (กลยุทธ์)
  // =============================================
  
  // Strategy 1: สิทธิมนุษยชน - 4 tactics
  const tacticsS1 = await Promise.all([
    prisma.tactic.create({
      data: {
        strategyId: strategies[0].id,
        code: 'TAC-1.1',
        name: 'สร้างความตระหนักและความเข้าใจในสังคม',
        description: 'พัฒนาแคมเปญสื่อสาร ผลิตสื่อการเรียนรู้ จัดกิจกรรมสร้างความเข้าใจในชุมชนและสถานที่ทำงาน',
        sortOrder: 1,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[0].id,
        code: 'TAC-1.2',
        name: 'ขับเคลื่อนรณรงค์เชิงนโยบายและกฎหมายที่เกี่ยวข้อง',
        description: 'ศึกษาวิเคราะห์กฎหมาย พัฒนาข้อเสนอเชิงนโยบาย สร้างเครือข่ายพันธมิตรเพื่อผลักดันการเปลี่ยนแปลง',
        sortOrder: 2,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[0].id,
        code: 'TAC-1.3',
        name: 'จัดประชุมอบรมพัฒนาศักยภาพด้านสิทธิมนุษยชน ให้กับหน่วยงาน ชุมชน และสังคม',
        description: 'พัฒนาหลักสูตรฝึกอบรม จัดอบรมเชิงปฏิบัติการ สร้างเครือข่ายวิทยากร',
        sortOrder: 3,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[0].id,
        code: 'TAC-1.4',
        name: 'ช่วยเหลือสนับสนุนเยียวยา ประสานงาน บริการ รับเรื่องร้องเรียนด้านสิทธิมนุษยชนที่เกี่ยวข้อง',
        description: 'จัดตั้งศูนย์ช่วยเหลือ พัฒนาระบบรับเรื่องร้องเรียน สร้างเครือข่ายทนายความอาสา',
        sortOrder: 4,
      },
    }),
  ])

  // Strategy 2: ความยั่งยืนและการระดมทรัพยากร - 6 tactics
  const tacticsS2 = await Promise.all([
    prisma.tactic.create({
      data: {
        strategyId: strategies[1].id,
        code: 'TAC-2.1',
        name: 'จัดตั้งวิสาหกิจเพื่อสังคม (Social Enterprise)',
        description: 'ศึกษาความเป็นไปได้ ระดมทุนเริ่มต้น พัฒนาผลิตภัณฑ์/บริการ สร้างเครือข่ายพันธมิตรทางธุรกิจ',
        sortOrder: 1,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[1].id,
        code: 'TAC-2.2',
        name: 'จัดกิจกรรมทางตลาดเพื่อสังคม (Social Marketing)',
        description: 'พัฒนาแบรนด์และภาพลักษณ์องค์กร สร้างแคมเปญการตลาด พัฒนา Content สร้างความร่วมมือกับ Influencers',
        sortOrder: 2,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[1].id,
        code: 'TAC-2.3',
        name: 'รับบริจาค (Donation)',
        description: 'พัฒนาระบบการรับบริจาคออนไลน์ สร้างโปรแกรมบริจาครายเดือน จัดกิจกรรมระดมทุน พัฒนาระบบ CRM',
        sortOrder: 3,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[1].id,
        code: 'TAC-2.4',
        name: 'ระดมทุนเพื่อกิจกรรมตามวาระเทศกาล (Social welfare)',
        description: 'จัดกิจกรรมระดมทุนในวาระพิเศษต่างๆ เช่น Pride Month, วันเอดส์โลก',
        sortOrder: 4,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[1].id,
        code: 'TAC-2.5',
        name: 'พัฒนากลไกเพื่อส่งเสริมการแสวงหาโครงการด้วยการสร้าง "สภานักเขียนโครงการ"',
        description: 'จัดตั้งสภานักเขียน พัฒนาฐานข้อมูลแหล่งทุน จัดอบรมเขียนโครงการ สร้างระบบ Peer Review',
        sortOrder: 5,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[1].id,
        code: 'TAC-2.6',
        name: 'บริการสุขภาพเพื่อสังคม',
        description: 'จัดตั้งคลินิกสุขภาพที่เป็นมิตร พัฒนาทีมบุคลากรทางการแพทย์ สร้างเครือข่ายส่งต่อ',
        sortOrder: 6,
      },
    }),
  ])

  // Strategy 3: พัฒนาระบบสุขภาพ - 4 tactics
  const tacticsS3 = await Promise.all([
    prisma.tactic.create({
      data: {
        strategyId: strategies[2].id,
        code: 'TAC-3.1',
        name: 'เพิ่มบริการให้ครอบคลุมบริการด้านสุขภาพ',
        description: 'จัดตั้งคณะกรรมการ พัฒนาบุคลากร พัฒนาระบบบริการผ่าน R2R เฝ้าระวังโรคอุบัติใหม่',
        sortOrder: 1,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[2].id,
        code: 'TAC-3.2',
        name: 'เพิ่มขีดความสามารถแก่บุคลากรในการจัดบริการสุขภาพ',
        description: 'In House Training, โครงการสะสมองค์ความรู้, ให้ทุนการศึกษา, สร้างทีม TOT วิทยากร',
        sortOrder: 2,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[2].id,
        code: 'TAC-3.3',
        name: 'พัฒนานวัตกรรมบริการด้านสุขภาพเพื่อสอดคล้องกับสถานการณ์โรคอุบัติใหม่',
        description: 'จัดทำแผนรองรับวิกฤต ส่งเสริมการเรียนรู้โรคอุบัติใหม่ สร้างความร่วมมือภาคี',
        sortOrder: 3,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[2].id,
        code: 'TAC-3.4',
        name: 'พัฒนาระบบฐานข้อมูล และจัดเก็บข้อมูลอย่างเป็นระบบ',
        description: 'จัดตั้งคณะกรรมการพัฒนาระบบฐานข้อมูล พัฒนาระบบ วางแผนการบริหารข้อมูล ระบบติดตามประเมินผล',
        sortOrder: 4,
      },
    }),
  ])

  // Strategy 4: วิจัยและพัฒนา - 5 tactics
  const tacticsS4 = await Promise.all([
    prisma.tactic.create({
      data: {
        strategyId: strategies[3].id,
        code: 'TAC-4.1',
        name: 'มีส่วนร่วมในการพัฒนากลไก/กรอบความร่วมมือเพื่อกระชับความร่วมมือระหว่างผู้มีส่วนได้ส่วนเสีย',
        description: 'เป็นคณะกรรมการเครือข่าย สร้างความร่วมมือกับภาครัฐและสถานทูต จัดตั้ง LGBTIQN+ Alliance',
        sortOrder: 1,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[3].id,
        code: 'TAC-4.2',
        name: 'เป็นผู้นำด้านวิชาการในงาน LGBTIQNA+ ในระดับประเทศ',
        description: 'จัดตั้งทีม TA พัฒนาทักษะภาษา SPSS การวิจัย จัดเวทีแลกเปลี่ยน จัด RSAT Open House',
        sortOrder: 2,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[3].id,
        code: 'TAC-4.3',
        name: 'วิจัยและพัฒนา (Research and Development)',
        description: 'กำหนด Data framework ทบทวนวรรณกรรม ขอรับทุนวิจัย ดำเนินการวิจัย นำเสนอผลงาน',
        sortOrder: 3,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[3].id,
        code: 'TAC-4.4',
        name: 'ขยายความร่วมมือกับองค์กรที่เกี่ยวข้อง',
        description: 'พัฒนาโครงการร่วมกับ NGOs มูลนิธิ สถาบันวิจัย มหาวิทยาลัย จัดเวที Conference',
        sortOrder: 4,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[3].id,
        code: 'TAC-4.5',
        name: 'ขยายความร่วมมือระดับภูมิภาค',
        description: 'พัฒนาโครงการ TA Regional จัดเตรียมหลักสูตร จัด Conference/Seminar ระดับภูมิภาค',
        sortOrder: 5,
      },
    }),
  ])

  // Strategy 5: พัฒนาศักยภาพชุมชน - 3 tactics
  const tacticsS5 = await Promise.all([
    prisma.tactic.create({
      data: {
        strategyId: strategies[4].id,
        code: 'TAC-5.1',
        name: 'พัฒนาระบบอาสาสมัครและการบริการชุมชน',
        description: 'สำรวจความต้องการชุมชน วางแผนจัดกิจกรรม บริหารอาสาสมัครอย่างมีระบบ',
        sortOrder: 1,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[4].id,
        code: 'TAC-5.2',
        name: 'พัฒนากิจกรรมที่ตอบสนองต่อชุมชน',
        description: 'จัดตั้งคณะกรรมการชุมชน สร้างระบบการทำงาน ส่งเสริมการมีส่วนร่วมอย่างยั่งยืน',
        sortOrder: 2,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[4].id,
        code: 'TAC-5.3',
        name: 'พัฒนาระบบสร้างแรงจูงใจอาสาสมัคร',
        description: 'สร้างความภาคภูมิใจในการทำงาน ยกระดับความสามารถ มีรีวอร์ดและการยกย่อง',
        sortOrder: 3,
      },
    }),
  ])

  // Strategy 6: บริหารจัดการ - 5 tactics
  const tacticsS6 = await Promise.all([
    prisma.tactic.create({
      data: {
        strategyId: strategies[5].id,
        code: 'TAC-6.1',
        name: 'ดำเนินงานในรูปแบบ Digital Platform',
        description: 'จัดตั้งคณะกรรมการฐานข้อมูล ศึกษารูปแบบเอกสาร โอนถ่ายข้อมูลเข้าสู่ระบบ',
        sortOrder: 1,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[5].id,
        code: 'TAC-6.2',
        name: 'ปรับปรุงแนวทางการสื่อสารองค์กร',
        description: 'สร้างภาพลักษณ์องค์กร พัฒนาระบบการสื่อสารภายใน จัดทำข้อมูลเครือข่าย',
        sortOrder: 2,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[5].id,
        code: 'TAC-6.3',
        name: 'พัฒนาศักยภาพและเพิ่มขีดความสามารถของบุคลากร',
        description: 'ส่งเสริมองค์กรแห่งการเรียนรู้ จัดทำ Training Road Map พัฒนาระบบ HR',
        sortOrder: 3,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[5].id,
        code: 'TAC-6.4',
        name: 'เสริมสร้างระบบข้อมูลเชิงยุทธศาสตร์',
        description: 'ประชุมเสนอประเด็นสำคัญ ทบทวนแผนให้สอดคล้องนโยบาย แสวงหาโอกาสเชิงนโยบาย',
        sortOrder: 4,
      },
    }),
    prisma.tactic.create({
      data: {
        strategyId: strategies[5].id,
        code: 'TAC-6.5',
        name: 'เสริมสร้างระบบบริหารจัดการด้านบัญชีการเงิน',
        description: 'จัดตั้งคณะกรรมการการเงิน วางแผนการทำงานร่วมกัน มีระบบตรวจสอบที่ดี',
        sortOrder: 5,
      },
    }),
  ])

  const allTactics = [...tacticsS1, ...tacticsS2, ...tacticsS3, ...tacticsS4, ...tacticsS5, ...tacticsS6]
  console.log('✅ Created tactics')

  // =============================================
  // KPIs
  // =============================================
  const kpis = await Promise.all([
    // TAC-1.1 KPIs
    prisma.kPI.create({
      data: {
        tacticId: tacticsS1[0].id,
        code: 'KPI-1.1.1',
        name: 'จำนวนแคมเปญสื่อสารสาธารณะที่จัด',
        unit: 'แคมเปญ',
        frequency: KPIFrequency.yearly,
        definition: 'จำนวนแคมเปญ "เข้าใจ เคารพ ยอมรับ" ที่ดำเนินการ',
        targetRuleJson: { yearly: 4 },
        sortOrder: 1,
      },
    }),
    prisma.kPI.create({
      data: {
        tacticId: tacticsS1[0].id,
        code: 'KPI-1.1.2',
        name: 'จำนวนสื่อการเรียนรู้ที่ผลิต',
        unit: 'ชิ้น',
        frequency: KPIFrequency.quarterly,
        definition: 'จำนวนสื่อการเรียนรู้ออนไลน์และออฟไลน์ที่ผลิต',
        targetRuleJson: { quarterly: 5, yearly: 20 },
        sortOrder: 2,
      },
    }),
    prisma.kPI.create({
      data: {
        tacticId: tacticsS1[0].id,
        code: 'KPI-1.1.3',
        name: 'จำนวนกิจกรรมสร้างความเข้าใจ',
        unit: 'ครั้ง',
        frequency: KPIFrequency.monthly,
        definition: 'จำนวนกิจกรรมสร้างความเข้าใจในชุมชน สถานศึกษา และสถานที่ทำงาน',
        targetRuleJson: { monthly: 2, yearly: 24 },
        sortOrder: 3,
      },
    }),

    // TAC-1.2 KPIs
    prisma.kPI.create({
      data: {
        tacticId: tacticsS1[1].id,
        code: 'KPI-1.2.1',
        name: 'จำนวนข้อเสนอเชิงนโยบายที่พัฒนา',
        unit: 'ฉบับ',
        frequency: KPIFrequency.yearly,
        definition: 'จำนวนข้อเสนอเชิงนโยบายและร่างกฎหมายที่พัฒนา',
        targetRuleJson: { yearly: 3 },
        sortOrder: 1,
      },
    }),
    prisma.kPI.create({
      data: {
        tacticId: tacticsS1[1].id,
        code: 'KPI-1.2.2',
        name: 'จำนวนเวทีสาธารณะที่จัด',
        unit: 'ครั้ง',
        frequency: KPIFrequency.quarterly,
        definition: 'จำนวนเวทีสาธารณะและการประชุมเชิงนโยบาย',
        targetRuleJson: { quarterly: 1, yearly: 4 },
        sortOrder: 2,
      },
    }),

    // TAC-1.3 KPIs
    prisma.kPI.create({
      data: {
        tacticId: tacticsS1[2].id,
        code: 'KPI-1.3.1',
        name: 'จำนวนผู้เข้าร่วมอบรมด้านสิทธิมนุษยชน',
        unit: 'คน',
        frequency: KPIFrequency.quarterly,
        definition: 'จำนวนผู้เข้าร่วมการอบรมด้านสิทธิมนุษยชนและความหลากหลายทางเพศ',
        targetRuleJson: { quarterly: 100, yearly: 400 },
        sortOrder: 1,
      },
    }),
    prisma.kPI.create({
      data: {
        tacticId: tacticsS1[2].id,
        code: 'KPI-1.3.2',
        name: 'จำนวนวิทยากรในเครือข่าย',
        unit: 'คน',
        frequency: KPIFrequency.yearly,
        definition: 'จำนวนวิทยากรด้านสิทธิมนุษยชนในเครือข่าย',
        targetRuleJson: { yearly: 20 },
        sortOrder: 2,
      },
    }),

    // TAC-1.4 KPIs
    prisma.kPI.create({
      data: {
        tacticId: tacticsS1[3].id,
        code: 'KPI-1.4.1',
        name: 'จำนวนเรื่องร้องเรียนที่รับ',
        unit: 'เรื่อง',
        frequency: KPIFrequency.monthly,
        definition: 'จำนวนเรื่องร้องเรียนด้านสิทธิที่รับผ่านศูนย์ช่วยเหลือ',
        targetRuleJson: { monthly: 10 },
        sortOrder: 1,
      },
    }),
    prisma.kPI.create({
      data: {
        tacticId: tacticsS1[3].id,
        code: 'KPI-1.4.2',
        name: 'อัตราการแก้ไขปัญหาสำเร็จ',
        unit: '%',
        frequency: KPIFrequency.quarterly,
        definition: 'ร้อยละของเรื่องร้องเรียนที่ได้รับการแก้ไขสำเร็จ',
        targetRuleJson: { target: 80 },
        sortOrder: 2,
      },
    }),

    // TAC-2.1 KPIs
    prisma.kPI.create({
      data: {
        tacticId: tacticsS2[0].id,
        code: 'KPI-2.1.1',
        name: 'รายได้จากวิสาหกิจเพื่อสังคม',
        unit: 'บาท',
        frequency: KPIFrequency.quarterly,
        definition: 'รายได้ที่เกิดจากการดำเนินงานวิสาหกิจเพื่อสังคม',
        targetRuleJson: { quarterly: 500000, yearly: 2000000 },
        sortOrder: 1,
      },
    }),

    // TAC-2.2 KPIs
    prisma.kPI.create({
      data: {
        tacticId: tacticsS2[1].id,
        code: 'KPI-2.2.1',
        name: 'จำนวนผู้ติดตามสื่อสังคมออนไลน์',
        unit: 'คน',
        frequency: KPIFrequency.monthly,
        definition: 'จำนวนผู้ติดตามรวมทุกแพลตฟอร์ม',
        targetRuleJson: { target: 100000 },
        sortOrder: 1,
      },
    }),

    // TAC-2.3 KPIs
    prisma.kPI.create({
      data: {
        tacticId: tacticsS2[2].id,
        code: 'KPI-2.3.1',
        name: 'จำนวนผู้บริจาครายเดือน',
        unit: 'คน',
        frequency: KPIFrequency.monthly,
        definition: 'จำนวนผู้บริจาคที่เข้าร่วมโปรแกรมบริจาครายเดือน',
        targetRuleJson: { target: 500 },
        sortOrder: 1,
      },
    }),
    prisma.kPI.create({
      data: {
        tacticId: tacticsS2[2].id,
        code: 'KPI-2.3.2',
        name: 'ยอดเงินบริจาครวม',
        unit: 'บาท',
        frequency: KPIFrequency.monthly,
        definition: 'ยอดเงินบริจาครวมทุกช่องทาง',
        targetRuleJson: { monthly: 200000, yearly: 2400000 },
        sortOrder: 2,
      },
    }),

    // TAC-3.1 KPIs
    prisma.kPI.create({
      data: {
        tacticId: tacticsS3[0].id,
        code: 'KPI-3.1.1',
        name: 'จำนวนผู้รับบริการสุขภาพ',
        unit: 'คน',
        frequency: KPIFrequency.monthly,
        definition: 'จำนวนผู้มารับบริการด้านสุขภาพที่คลินิก',
        targetRuleJson: { monthly: 500, yearly: 6000 },
        sortOrder: 1,
      },
    }),
    prisma.kPI.create({
      data: {
        tacticId: tacticsS3[0].id,
        code: 'KPI-3.1.2',
        name: 'อัตราความพึงพอใจการบริการ',
        unit: '%',
        frequency: KPIFrequency.quarterly,
        definition: 'ร้อยละความพึงพอใจของผู้รับบริการ',
        targetRuleJson: { target: 90 },
        sortOrder: 2,
      },
    }),

    // TAC-3.2 KPIs
    prisma.kPI.create({
      data: {
        tacticId: tacticsS3[1].id,
        code: 'KPI-3.2.1',
        name: 'จำนวนบุคลากรที่ผ่านการอบรม',
        unit: 'คน',
        frequency: KPIFrequency.quarterly,
        definition: 'จำนวนบุคลากรที่ผ่านการอบรมพัฒนาศักยภาพ',
        targetRuleJson: { quarterly: 30, yearly: 120 },
        sortOrder: 1,
      },
    }),
    prisma.kPI.create({
      data: {
        tacticId: tacticsS3[1].id,
        code: 'KPI-3.2.2',
        name: 'จำนวนทุนการศึกษาที่มอบ',
        unit: 'ทุน',
        frequency: KPIFrequency.yearly,
        definition: 'จำนวนทุนการศึกษาด้านสุขภาพที่มอบให้เจ้าหน้าที่',
        targetRuleJson: { yearly: 5 },
        sortOrder: 2,
      },
    }),

    // TAC-4.2 KPIs
    prisma.kPI.create({
      data: {
        tacticId: tacticsS4[1].id,
        code: 'KPI-4.2.1',
        name: 'จำนวนผลงานวิชาการที่นำเสนอ',
        unit: 'ชิ้น',
        frequency: KPIFrequency.yearly,
        definition: 'จำนวนผลงานวิชาการที่นำเสนอในเวทีต่างๆ',
        targetRuleJson: { yearly: 10 },
        sortOrder: 1,
      },
    }),
    prisma.kPI.create({
      data: {
        tacticId: tacticsS4[1].id,
        code: 'KPI-4.2.2',
        name: 'จำนวน RSAT Talk ที่จัด',
        unit: 'ครั้ง',
        frequency: KPIFrequency.monthly,
        definition: 'จำนวน Case Study RSAT Talk ที่จัดผ่านออนไลน์',
        targetRuleJson: { monthly: 1, yearly: 12 },
        sortOrder: 2,
      },
    }),

    // TAC-4.3 KPIs
    prisma.kPI.create({
      data: {
        tacticId: tacticsS4[2].id,
        code: 'KPI-4.3.1',
        name: 'จำนวนงานวิจัยที่ดำเนินการ',
        unit: 'โครงการ',
        frequency: KPIFrequency.yearly,
        definition: 'จำนวนโครงการวิจัยที่ดำเนินการ',
        targetRuleJson: { yearly: 3 },
        sortOrder: 1,
      },
    }),
    prisma.kPI.create({
      data: {
        tacticId: tacticsS4[2].id,
        code: 'KPI-4.3.2',
        name: 'จำนวนบทความวิจัยที่ตีพิมพ์',
        unit: 'บทความ',
        frequency: KPIFrequency.yearly,
        definition: 'จำนวนบทความวิจัยที่ได้รับการตีพิมพ์ในวารสาร',
        targetRuleJson: { yearly: 2 },
        sortOrder: 2,
      },
    }),

    // TAC-5.1 KPIs
    prisma.kPI.create({
      data: {
        tacticId: tacticsS5[0].id,
        code: 'KPI-5.1.1',
        name: 'จำนวนอาสาสมัครที่ลงทะเบียน',
        unit: 'คน',
        frequency: KPIFrequency.quarterly,
        definition: 'จำนวนอาสาสมัครที่ลงทะเบียนในระบบ',
        targetRuleJson: { quarterly: 50, yearly: 200 },
        sortOrder: 1,
      },
    }),
    prisma.kPI.create({
      data: {
        tacticId: tacticsS5[0].id,
        code: 'KPI-5.1.2',
        name: 'จำนวนชั่วโมงอาสาสมัคร',
        unit: 'ชั่วโมง',
        frequency: KPIFrequency.monthly,
        definition: 'จำนวนชั่วโมงที่อาสาสมัครทำงานให้องค์กร',
        targetRuleJson: { monthly: 500, yearly: 6000 },
        sortOrder: 2,
      },
    }),

    // TAC-5.2 KPIs
    prisma.kPI.create({
      data: {
        tacticId: tacticsS5[1].id,
        code: 'KPI-5.2.1',
        name: 'จำนวนกิจกรรมชุมชนที่จัด',
        unit: 'ครั้ง',
        frequency: KPIFrequency.monthly,
        definition: 'จำนวนกิจกรรมที่ตอบสนองความต้องการของชุมชน LGBTQNIA+',
        targetRuleJson: { monthly: 2, yearly: 24 },
        sortOrder: 1,
      },
    }),

    // TAC-6.1 KPIs
    prisma.kPI.create({
      data: {
        tacticId: tacticsS6[0].id,
        code: 'KPI-6.1.1',
        name: 'ร้อยละเอกสารที่เป็นดิจิทัล',
        unit: '%',
        frequency: KPIFrequency.quarterly,
        definition: 'ร้อยละของเอกสารที่ถูกแปลงเป็นดิจิทัลในระบบ',
        targetRuleJson: { target: 100 },
        sortOrder: 1,
      },
    }),

    // TAC-6.3 KPIs
    prisma.kPI.create({
      data: {
        tacticId: tacticsS6[2].id,
        code: 'KPI-6.3.1',
        name: 'จำนวนการอบรมพัฒนาบุคลากร',
        unit: 'ครั้ง',
        frequency: KPIFrequency.quarterly,
        definition: 'จำนวนการอบรมพัฒนาศักยภาพบุคลากร',
        targetRuleJson: { quarterly: 4, yearly: 16 },
        sortOrder: 1,
      },
    }),

    // TAC-6.5 KPIs
    prisma.kPI.create({
      data: {
        tacticId: tacticsS6[4].id,
        code: 'KPI-6.5.1',
        name: 'ความถูกต้องของรายงานการเงิน',
        unit: '%',
        frequency: KPIFrequency.quarterly,
        definition: 'ร้อยละความถูกต้องของรายงานการเงินที่ตรวจสอบ',
        targetRuleJson: { target: 100 },
        sortOrder: 1,
      },
    }),
  ])

  console.log('✅ Created KPIs')

  // =============================================
  // FOLDERS & LISTS
  // =============================================
  const folders = await Promise.all([
    prisma.folder.create({ data: { name: 'ยุทธศาสตร์ 1: สิทธิมนุษยชน', sortOrder: 1 } }),
    prisma.folder.create({ data: { name: 'ยุทธศาสตร์ 2: ความยั่งยืน', sortOrder: 2 } }),
    prisma.folder.create({ data: { name: 'ยุทธศาสตร์ 3: ระบบสุขภาพ', sortOrder: 3 } }),
    prisma.folder.create({ data: { name: 'ยุทธศาสตร์ 4: วิจัยและพัฒนา', sortOrder: 4 } }),
    prisma.folder.create({ data: { name: 'ยุทธศาสตร์ 5: พัฒนาชุมชน', sortOrder: 5 } }),
    prisma.folder.create({ data: { name: 'ยุทธศาสตร์ 6: บริหารจัดการ', sortOrder: 6 } }),
  ])

  const lists = await Promise.all([
    prisma.list.create({ data: { folderId: folders[0].id, name: 'งานรณรงค์สิทธิ', sortOrder: 1 } }),
    prisma.list.create({ data: { folderId: folders[0].id, name: 'งานช่วยเหลือเยียวยา', sortOrder: 2 } }),
    prisma.list.create({ data: { folderId: folders[1].id, name: 'วิสาหกิจเพื่อสังคม', sortOrder: 1 } }),
    prisma.list.create({ data: { folderId: folders[1].id, name: 'ระดมทุน', sortOrder: 2 } }),
    prisma.list.create({ data: { folderId: folders[2].id, name: 'บริการคลินิก', sortOrder: 1 } }),
    prisma.list.create({ data: { folderId: folders[2].id, name: 'พัฒนาบุคลากร', sortOrder: 2 } }),
    prisma.list.create({ data: { folderId: folders[3].id, name: 'งานวิจัย', sortOrder: 1 } }),
    prisma.list.create({ data: { folderId: folders[3].id, name: 'ความร่วมมือระหว่างประเทศ', sortOrder: 2 } }),
    prisma.list.create({ data: { folderId: folders[4].id, name: 'อาสาสมัคร', sortOrder: 1 } }),
    prisma.list.create({ data: { folderId: folders[4].id, name: 'กิจกรรมชุมชน', sortOrder: 2 } }),
    prisma.list.create({ data: { folderId: folders[5].id, name: 'Digital Transformation', sortOrder: 1 } }),
    prisma.list.create({ data: { folderId: folders[5].id, name: 'การเงินและบัญชี', sortOrder: 2 } }),
  ])

  console.log('✅ Created folders and lists')

  // =============================================
  // SAMPLE TASKS
  // =============================================
  const tasks = await Promise.all([
    // Strategy 1 Tasks
    prisma.task.create({
      data: {
        listId: lists[0].id,
        strategyId: strategies[0].id,
        tacticId: tacticsS1[0].id,
        title: 'พัฒนาแคมเปญสื่อสารสาธารณะระยะยาว "เข้าใจ เคารพ ยอมรับ"',
        description: 'พัฒนาแคมเปญสื่อสารสาธารณะระยะยาวเพื่อสร้างความเข้าใจเกี่ยวกับความหลากหลายทางเพศและสิทธิมนุษยชน',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        startDate: new Date('2026-01-01'),
        dueDate: new Date('2026-06-30'),
        progressPercent: 35,
        createdById: users[0].id,
      },
    }),
    prisma.task.create({
      data: {
        listId: lists[0].id,
        strategyId: strategies[0].id,
        tacticId: tacticsS1[0].id,
        title: 'ผลิตสื่อการเรียนรู้ออนไลน์สำหรับเยาวชนและนักศึกษา',
        description: 'ผลิตสื่อการเรียนรู้ออนไลน์และออฟไลน์ที่เข้าถึงง่ายสำหรับกลุ่มเป้าหมาย',
        status: TaskStatus.TO_DO,
        priority: TaskPriority.NORMAL,
        startDate: new Date('2026-03-01'),
        dueDate: new Date('2026-05-31'),
        progressPercent: 0,
        createdById: users[0].id,
      },
    }),
    prisma.task.create({
      data: {
        listId: lists[0].id,
        strategyId: strategies[0].id,
        tacticId: tacticsS1[0].id,
        title: 'จัดกิจกรรมสร้างความเข้าใจในสถานศึกษา Q1/2026',
        description: 'จัดกิจกรรมสร้างความเข้าใจในสถานศึกษาระดับมัธยมศึกษาและมหาวิทยาลัย',
        status: TaskStatus.TO_DO,
        priority: TaskPriority.NORMAL,
        startDate: new Date('2026-03-15'),
        dueDate: new Date('2026-03-31'),
        progressPercent: 0,
        createdById: users[1].id,
      },
    }),
    prisma.task.create({
      data: {
        listId: lists[0].id,
        strategyId: strategies[0].id,
        tacticId: tacticsS1[1].id,
        title: 'จัดตั้งคณะทำงานวิชาการศึกษากฎหมาย LGBTIQN+',
        description: 'จัดตั้งคณะทำงานวิชาการเพื่อศึกษาและวิเคราะห์กฎหมายและนโยบายที่เกี่ยวข้อง',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        startDate: new Date('2026-01-01'),
        dueDate: new Date('2026-02-28'),
        progressPercent: 100,
        createdById: users[0].id,
      },
    }),
    prisma.task.create({
      data: {
        listId: lists[1].id,
        strategyId: strategies[0].id,
        tacticId: tacticsS1[3].id,
        title: 'พัฒนาระบบรับเรื่องร้องเรียนออนไลน์',
        description: 'พัฒนาระบบรับเรื่องร้องเรียนออนไลน์ที่ปลอดภัยและเข้าถึงง่าย รองรับทั้งเว็บไซต์และแอปมือถือ',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.URGENT,
        startDate: new Date('2026-02-01'),
        dueDate: new Date('2026-04-30'),
        progressPercent: 60,
        createdById: users[0].id,
      },
    }),

    // Strategy 2 Tasks
    prisma.task.create({
      data: {
        listId: lists[2].id,
        strategyId: strategies[1].id,
        tacticId: tacticsS2[0].id,
        title: 'จัดตั้งคณะทำงานศึกษาความเป็นไปได้วิสาหกิจเพื่อสังคม',
        description: 'ศึกษาความเป็นไปได้และพัฒนาแผนธุรกิจสำหรับวิสาหกิจเพื่อสังคม',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        startDate: new Date('2026-01-15'),
        dueDate: new Date('2026-03-31'),
        progressPercent: 45,
        createdById: users[1].id,
      },
    }),
    prisma.task.create({
      data: {
        listId: lists[3].id,
        strategyId: strategies[1].id,
        tacticId: tacticsS2[2].id,
        title: 'พัฒนาระบบรับบริจาคออนไลน์',
        description: 'พัฒนาระบบการรับบริจาคออนไลน์ที่สะดวก ปลอดภัย และรองรับหลากหลายช่องทางการชำระเงิน',
        status: TaskStatus.TO_DO,
        priority: TaskPriority.HIGH,
        startDate: new Date('2026-04-01'),
        dueDate: new Date('2026-06-30'),
        progressPercent: 0,
        createdById: users[0].id,
      },
    }),
    prisma.task.create({
      data: {
        listId: lists[3].id,
        strategyId: strategies[1].id,
        tacticId: tacticsS2[2].id,
        title: 'สร้างโปรแกรมบริจาครายเดือน (Monthly Giving)',
        description: 'สร้างโปรแกรมการบริจาครายเดือนเพื่อสร้างรายได้ที่สม่ำเสมอ',
        status: TaskStatus.TO_DO,
        priority: TaskPriority.NORMAL,
        startDate: new Date('2026-05-01'),
        dueDate: new Date('2026-07-31'),
        progressPercent: 0,
        createdById: users[1].id,
      },
    }),

    // Strategy 3 Tasks
    prisma.task.create({
      data: {
        listId: lists[4].id,
        strategyId: strategies[2].id,
        tacticId: tacticsS3[0].id,
        title: 'จัดตั้งคณะกรรมการพัฒนาระบบบริการสุขภาพ',
        description: 'จัดตั้งคณะกรรมการเป็นคณะทำงานอย่างเป็นรูปธรรมในการพัฒนาและปฏิบัติการใหม่',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        startDate: new Date('2026-01-01'),
        dueDate: new Date('2026-01-31'),
        progressPercent: 100,
        createdById: users[0].id,
      },
    }),
    prisma.task.create({
      data: {
        listId: lists[4].id,
        strategyId: strategies[2].id,
        tacticId: tacticsS3[0].id,
        title: 'สำรวจความพึงพอใจผู้รับบริการ Q1/2026',
        description: 'สำรวจความพึงพอใจการตรวจสอบมาตรฐานการบริการอย่างต่อเนื่อง',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.NORMAL,
        startDate: new Date('2026-03-01'),
        dueDate: new Date('2026-03-31'),
        progressPercent: 25,
        createdById: users[1].id,
      },
    }),
    prisma.task.create({
      data: {
        listId: lists[5].id,
        strategyId: strategies[2].id,
        tacticId: tacticsS3[1].id,
        title: 'จัดอบรม In House Training ด้านสุขภาพ รุ่น 1/2026',
        description: 'พัฒนาองค์ความรู้ ทักษะ ด้านสุขภาพ โดยจัดการอบรมแก่เจ้าหน้าที่ใหม่',
        status: TaskStatus.TO_DO,
        priority: TaskPriority.NORMAL,
        startDate: new Date('2026-03-15'),
        dueDate: new Date('2026-04-15'),
        progressPercent: 0,
        createdById: users[0].id,
      },
    }),

    // Strategy 4 Tasks
    prisma.task.create({
      data: {
        listId: lists[6].id,
        strategyId: strategies[3].id,
        tacticId: tacticsS4[1].id,
        title: 'จัดตั้งทีมคณะทำงานวิชาการ (Technical Assistant Team)',
        description: 'จัดตั้งทีม TA ภายในองค์กรเพื่อสนับสนุนงานวิชาการ',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        startDate: new Date('2026-01-01'),
        dueDate: new Date('2026-02-15'),
        progressPercent: 100,
        createdById: users[0].id,
      },
    }),
    prisma.task.create({
      data: {
        listId: lists[6].id,
        strategyId: strategies[3].id,
        tacticId: tacticsS4[1].id,
        title: 'จัด RSAT Talk มีนาคม 2026',
        description: 'Case Study RSAT Talk ผ่านออนไลน์ นำเสนอผลงานโดดเด่นของแต่ละพื้นที่',
        status: TaskStatus.TO_DO,
        priority: TaskPriority.NORMAL,
        startDate: new Date('2026-03-20'),
        dueDate: new Date('2026-03-25'),
        progressPercent: 0,
        createdById: users[1].id,
      },
    }),
    prisma.task.create({
      data: {
        listId: lists[6].id,
        strategyId: strategies[3].id,
        tacticId: tacticsS4[2].id,
        title: 'กำหนด Data Framework สำหรับ Chemsex Research',
        description: 'กำหนด Data framework สำหรับงานวิจัย Chemsex, Same day ART, Mental Health',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        startDate: new Date('2026-02-01'),
        dueDate: new Date('2026-04-30'),
        progressPercent: 30,
        createdById: users[0].id,
      },
    }),
    prisma.task.create({
      data: {
        listId: lists[7].id,
        strategyId: strategies[3].id,
        tacticId: tacticsS4[4].id,
        title: 'เตรียมหลักสูตร TA Regional ด้านสุขภาพ',
        description: 'จัดเตรียมหลักสูตรประกอบโครงการ TA Regional ด้านสุขภาพและสิทธิมนุษยชน',
        status: TaskStatus.TO_DO,
        priority: TaskPriority.NORMAL,
        startDate: new Date('2026-04-01'),
        dueDate: new Date('2026-06-30'),
        progressPercent: 0,
        createdById: users[0].id,
      },
    }),

    // Strategy 5 Tasks
    prisma.task.create({
      data: {
        listId: lists[8].id,
        strategyId: strategies[4].id,
        tacticId: tacticsS5[0].id,
        title: 'จัดทำแบบสำรวจความต้องการชุมชน LGBTQNIA+',
        description: 'จัดทำแบบสำรวจความต้องการชุมชนเพื่อนำมาวางแผนจัดกิจกรรม',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.NORMAL,
        startDate: new Date('2026-02-15'),
        dueDate: new Date('2026-03-15'),
        progressPercent: 70,
        createdById: users[1].id,
      },
    }),
    prisma.task.create({
      data: {
        listId: lists[8].id,
        strategyId: strategies[4].id,
        tacticId: tacticsS5[0].id,
        title: 'พัฒนาระบบบริหารอาสาสมัคร',
        description: 'การบริหารอาสาสมัครอย่างมีระบบ รวมถึงการจัดทำข้อมูลอาสาสมัคร',
        status: TaskStatus.TO_DO,
        priority: TaskPriority.HIGH,
        startDate: new Date('2026-04-01'),
        dueDate: new Date('2026-06-30'),
        progressPercent: 0,
        createdById: users[0].id,
      },
    }),
    prisma.task.create({
      data: {
        listId: lists[9].id,
        strategyId: strategies[4].id,
        tacticId: tacticsS5[1].id,
        title: 'จัดตั้งคณะกรรมการชุมชน LGBTQNIA+',
        description: 'จัดตั้งคณะกรรมการชุมชนเพื่อสร้างระบบการทำงานร่วมกัน',
        status: TaskStatus.TO_DO,
        priority: TaskPriority.NORMAL,
        startDate: new Date('2026-03-01'),
        dueDate: new Date('2026-04-30'),
        progressPercent: 0,
        createdById: users[0].id,
      },
    }),

    // Strategy 6 Tasks
    prisma.task.create({
      data: {
        listId: lists[10].id,
        strategyId: strategies[5].id,
        tacticId: tacticsS6[0].id,
        title: 'จัดตั้งคณะกรรมการฐานข้อมูล',
        description: 'จัดตั้งคณะกรรมการฐานข้อมูลที่มาจากทุกภาคส่วนของสมาคม',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        startDate: new Date('2026-01-01'),
        dueDate: new Date('2026-01-31'),
        progressPercent: 100,
        createdById: users[0].id,
      },
    }),
    prisma.task.create({
      data: {
        listId: lists[10].id,
        strategyId: strategies[5].id,
        tacticId: tacticsS6[0].id,
        title: 'ศึกษารูปแบบเอกสารทุกฝ่ายเพื่อโอนถ่ายสู่ Digital',
        description: 'ศึกษารูปแบบเอกสารต่างๆ ทุกฝ่ายทุกระบบของสมาคมเพื่อเตรียมโอนเข้าระบบ',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.NORMAL,
        startDate: new Date('2026-02-01'),
        dueDate: new Date('2026-04-30'),
        progressPercent: 40,
        createdById: users[1].id,
      },
    }),
    prisma.task.create({
      data: {
        listId: lists[11].id,
        strategyId: strategies[5].id,
        tacticId: tacticsS6[4].id,
        title: 'จัดตั้งคณะกรรมการพัฒนาระบบการเงินและบัญชี',
        description: 'จัดตั้งคณะกรรมการด้านการพัฒนาระบบการเงินและการบัญชี',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        startDate: new Date('2026-01-01'),
        dueDate: new Date('2026-02-15'),
        progressPercent: 100,
        createdById: users[0].id,
      },
    }),
    prisma.task.create({
      data: {
        listId: lists[11].id,
        strategyId: strategies[5].id,
        tacticId: tacticsS6[4].id,
        title: 'วางแผนการทำงานร่วมระหว่างฝ่ายบริหารและสำนักต่างๆ',
        description: 'วางแผนการทำงานร่วมกันระหว่างฝ่ายบริหารและสำนักต่างๆ อย่างต่อเนื่อง',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.NORMAL,
        startDate: new Date('2026-02-01'),
        dueDate: new Date('2026-03-31'),
        progressPercent: 55,
        createdById: users[1].id,
      },
    }),
  ])

  console.log('✅ Created tasks')

  // =============================================
  // TASK-KPI LINKS
  // =============================================
  await Promise.all([
    prisma.taskKPI.create({ data: { taskId: tasks[0].id, kpiId: kpis[0].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[1].id, kpiId: kpis[1].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[2].id, kpiId: kpis[2].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[3].id, kpiId: kpis[3].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[4].id, kpiId: kpis[7].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[5].id, kpiId: kpis[9].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[6].id, kpiId: kpis[11].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[7].id, kpiId: kpis[12].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[8].id, kpiId: kpis[13].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[9].id, kpiId: kpis[14].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[10].id, kpiId: kpis[15].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[11].id, kpiId: kpis[17].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[12].id, kpiId: kpis[18].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[13].id, kpiId: kpis[19].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[14].id, kpiId: kpis[20].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[15].id, kpiId: kpis[21].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[16].id, kpiId: kpis[22].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[17].id, kpiId: kpis[23].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[18].id, kpiId: kpis[24].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[19].id, kpiId: kpis[25].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[20].id, kpiId: kpis[24].id, contributionType: ContributionType.DIRECT } }),
    prisma.taskKPI.create({ data: { taskId: tasks[21].id, kpiId: kpis[26].id, contributionType: ContributionType.DIRECT } }),
  ])

  console.log('✅ Created task-KPI links')

  // =============================================
  // TASK ASSIGNEES
  // =============================================
  await Promise.all([
    prisma.taskAssignee.create({ data: { taskId: tasks[0].id, userId: users[0].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[0].id, userId: users[1].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[1].id, userId: users[1].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[2].id, userId: users[2].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[3].id, userId: users[0].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[4].id, userId: users[0].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[4].id, userId: users[5].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[5].id, userId: users[1].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[6].id, userId: users[0].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[7].id, userId: users[1].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[8].id, userId: users[0].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[9].id, userId: users[2].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[10].id, userId: users[3].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[11].id, userId: users[0].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[12].id, userId: users[1].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[13].id, userId: users[0].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[14].id, userId: users[0].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[15].id, userId: users[2].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[16].id, userId: users[3].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[17].id, userId: users[4].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[18].id, userId: users[0].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[19].id, userId: users[1].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[20].id, userId: users[0].id } }),
    prisma.taskAssignee.create({ data: { taskId: tasks[21].id, userId: users[1].id } }),
  ])

  console.log('✅ Created task assignees')

  // =============================================
  // SAMPLE COMMENTS
  // =============================================
  await Promise.all([
    prisma.comment.create({
      data: {
        taskId: tasks[0].id,
        userId: users[1].id,
        body: 'ได้ประสานงานกับทีมสื่อแล้ว เริ่มทำ Concept ในสัปดาห์หน้า',
      },
    }),
    prisma.comment.create({
      data: {
        taskId: tasks[4].id,
        userId: users[5].id,
        body: 'ระบบ Backend เสร็จแล้ว รอทำ Frontend',
      },
    }),
    prisma.comment.create({
      data: {
        taskId: tasks[4].id,
        userId: users[0].id,
        body: 'ดีมาก ขอให้เพิ่มฟีเจอร์ Anonymous Report ด้วยนะ',
      },
    }),
    prisma.comment.create({
      data: {
        taskId: tasks[13].id,
        userId: users[0].id,
        body: 'กำลังรวบรวมข้อมูลจากทุกพื้นที่ คาดว่าจะเสร็จภายในสิ้นเดือน',
      },
    }),
  ])

  console.log('✅ Created comments')

  // =============================================
  // SAMPLE KPI VALUES
  // =============================================
  await Promise.all([
    prisma.kPIValue.create({
      data: {
        kpiId: kpis[2].id, // กิจกรรมสร้างความเข้าใจ
        orgId: orgs[0].id,
        periodYYYYMM: '2026-01',
        value: 3,
        note: 'จัดที่ มธ. จุฬา และ ม.เกษตร',
        createdById: users[0].id,
      },
    }),
    prisma.kPIValue.create({
      data: {
        kpiId: kpis[2].id,
        orgId: orgs[0].id,
        periodYYYYMM: '2026-02',
        value: 2,
        note: 'จัดที่ ม.ธรรมศาสตร์ ศูนย์รังสิต และ ม.ศิลปากร',
        createdById: users[0].id,
      },
    }),
    prisma.kPIValue.create({
      data: {
        kpiId: kpis[13].id, // ผู้รับบริการสุขภาพ
        orgId: orgs[0].id,
        periodYYYYMM: '2026-01',
        value: 480,
        createdById: users[0].id,
      },
    }),
    prisma.kPIValue.create({
      data: {
        kpiId: kpis[13].id,
        orgId: orgs[0].id,
        periodYYYYMM: '2026-02',
        value: 520,
        note: 'มีผู้มาใช้บริการเพิ่มขึ้นหลังจากโปรโมทผ่าน Social Media',
        createdById: users[0].id,
      },
    }),
    prisma.kPIValue.create({
      data: {
        kpiId: kpis[21].id, // อาสาสมัครที่ลงทะเบียน
        orgId: orgs[0].id,
        periodYYYYMM: '2026-01',
        value: 45,
        createdById: users[1].id,
      },
    }),
  ])

  console.log('✅ Created KPI values')

  console.log('🎉 Seed completed successfully!')
  console.log('')
  console.log('📋 Test Accounts:')
  console.log('  superadmin@rsat.org / password123 (ผู้ดูแลระบบหลัก)')
  console.log('  admin.amnuay@rsat.org / password123 (สำนักอำนวยการ)')
  console.log('  admin.health@rsat.org / password123 (สำนักระบบบริการสุขภาพ)')
  console.log('  admin.community@rsat.org / password123 (สำนักระบบบริการชุมชน)')
  console.log('  admin.humanrights@rsat.org / password123 (สำนักสิทธิมนุษยชนและความยั่งยืน)')
  console.log('  admin.policy@rsat.org / password123 (ฝ่ายนโยบายและข้อมูลเชิงยุทธศาสตร์)')
  console.log('  user@rsat.org / password123 (เจ้าหน้าที่โครงการ)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
