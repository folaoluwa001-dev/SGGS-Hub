import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Roles
  const roles = [
    { name: 'SUPER_ADMIN', permissions: JSON.stringify(['all']) },
    { name: 'TEACHER', permissions: JSON.stringify(['read_students', 'sync_marks', 'view_classes']) },
    { name: 'BURSAR', permissions: JSON.stringify(['manage_payments', 'view_balances', 'print_receipts']) },
    { name: 'PARENT', permissions: JSON.stringify(['check_results', 'download_report']) },
  ];

  const dbRoles: Record<string, any> = {};
  for (const role of roles) {
    dbRoles[role.name] = await prisma.role.upsert({
      where: { name: role.name },
      update: { permissions: role.permissions },
      create: { name: role.name, permissions: role.permissions },
    });
  }
  console.log('Roles seeded.');

  // 2. Admin User
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: adminPasswordHash },
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      fullName: 'System Administrator',
      roleId: dbRoles['SUPER_ADMIN'].id,
    },
  });
  console.log('Admin user seeded (Username: admin, Password: admin123).');

  // 3. Teachers & Bursars demo
  const teacherPasswordHash = await bcrypt.hash('teacher123', 10);
  const teacherUser = await prisma.user.upsert({
    where: { username: 'teacher' },
    update: { passwordHash: teacherPasswordHash },
    create: {
      username: 'teacher',
      passwordHash: teacherPasswordHash,
      fullName: 'Mr. Ojuolape J.',
      roleId: dbRoles['TEACHER'].id,
    },
  });

  const bursarPasswordHash = await bcrypt.hash('bursar123', 10);
  const bursarUser = await prisma.user.upsert({
    where: { username: 'bursar' },
    update: { passwordHash: bursarPasswordHash },
    create: {
      username: 'bursar',
      passwordHash: bursarPasswordHash,
      fullName: 'Mrs. Ojuolape E.',
      roleId: dbRoles['BURSAR'].id,
    },
  });
  console.log('Demo teacher and bursar users seeded.');

  // 4. Sessions
  const session = await prisma.session.upsert({
    where: { name: '2025/2026' },
    update: { active: true },
    create: { name: '2025/2026', active: true },
  });
  console.log('Session seeded.');

  // 5. Terms
  const terms = [
    { name: 'First Term', active: true },
    { name: 'Second Term', active: false },
    { name: 'Third Term', active: false },
  ];

  const dbTerms: Record<string, any> = {};
  for (const term of terms) {
    dbTerms[term.name] = await prisma.term.upsert({
      where: { name: term.name },
      update: { active: term.active },
      create: { name: term.name, active: term.active },
    });
  }
  console.log('Terms seeded.');

  // 6. Classes
  const classes = [
    { name: 'JSS1', level: 'JUNIOR' },
    { name: 'JSS2', level: 'JUNIOR' },
    { name: 'JSS3', level: 'JUNIOR' },
    { name: 'SSS1', level: 'SENIOR' },
    { name: 'SSS2', level: 'SENIOR' },
    { name: 'SSS3', level: 'SENIOR' },
  ];

  const dbClasses: Record<string, any> = {};
  for (const cls of classes) {
    dbClasses[cls.name] = await prisma.class.upsert({
      where: { name: cls.name },
      update: { level: cls.level },
      create: { name: cls.name, level: cls.level },
    });
  }
  console.log('Classes seeded.');

  // 7. Subjects
  const subjects = [
    { name: 'English Language', description: 'Core communication and language course' },
    { name: 'Mathematics', description: 'Core algebra, geometry, and arithmetic course' },
    { name: 'Physics', description: 'Science of matter and energy' },
    { name: 'Chemistry', description: 'Science of substances, atomic compositions and reactions' },
    { name: 'Biology', description: 'Science of life and living organisms' },
    { name: 'Economics', description: 'Study of production, consumption and wealth' },
    { name: 'Government', description: 'Study of governance, citizens, and states' },
    { name: 'Agricultural Science', description: 'Science of farming, livestock and crops' },
    { name: 'Data Processing', description: 'Study of handling digital records and computing' },
    { name: 'Civic Education', description: 'Citizenship rights, responsibilities and values' },
  ];

  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { name: subject.name },
      update: { description: subject.description },
      create: { name: subject.name, description: subject.description },
    });
  }
  console.log('Subjects seeded.');

  // 8. Fee Categories per Class (default amounts mapped as in screenshot)
  const classFeeConfigs: Record<string, { name: string; amount: number }[]> = {
    JSS1: [
      { name: 'Tuition Lecture Fee', amount: 35000 },
      { name: 'Uniforms Levy', amount: 10000 },
      { name: 'Books & Materials', amount: 15000 },
      { name: 'Assessments & Exams', amount: 5000 },
      { name: 'Other Admin Charges', amount: 3000 },
    ],
    JSS2: [
      { name: 'Tuition Lecture Fee', amount: 35000 },
      { name: 'Uniforms Levy', amount: 0 },
      { name: 'Books & Materials', amount: 15000 },
      { name: 'Assessments & Exams', amount: 5000 },
      { name: 'Other Admin Charges', amount: 3000 },
    ],
    JSS3: [
      { name: 'Tuition Lecture Fee', amount: 35000 },
      { name: 'Uniforms Levy', amount: 0 },
      { name: 'Books & Materials', amount: 15000 },
      { name: 'Assessments & Exams', amount: 6000 },
      { name: 'Other Admin Charges', amount: 4000 },
    ],
    SSS1: [
      { name: 'Tuition Lecture Fee', amount: 45000 },
      { name: 'Uniforms Levy', amount: 12000 },
      { name: 'Books & Materials', amount: 18000 },
      { name: 'Assessments & Exams', amount: 7000 },
      { name: 'Other Admin Charges', amount: 4000 },
    ],
    SSS2: [
      { name: 'Tuition Lecture Fee', amount: 45000 },
      { name: 'Uniforms Levy', amount: 0 },
      { name: 'Books & Materials', amount: 18000 },
      { name: 'Assessments & Exams', amount: 7000 },
      { name: 'Other Admin Charges', amount: 4000 },
    ],
    SSS3: [
      { name: 'Tuition Lecture Fee', amount: 45000 },
      { name: 'Uniforms Levy', amount: 0 },
      { name: 'Books & Materials', amount: 18000 },
      { name: 'Assessments & Exams', amount: 9000 },
      { name: 'Other Admin Charges', amount: 7000 },
    ],
  };

  // First clear existing fee categories to avoid legacy categories
  await prisma.feeCategory.deleteMany();

  for (const clsName of Object.keys(dbClasses)) {
    const classId = dbClasses[clsName].id;
    const configs = classFeeConfigs[clsName] || [];
    for (const fee of configs) {
      await prisma.feeCategory.upsert({
        where: {
          name_classId: { name: fee.name, classId },
        },
        update: { defaultAmount: fee.amount },
        create: {
          name: fee.name,
          defaultAmount: fee.amount,
          classId,
        },
      });
    }
  }
  console.log('Fee Categories per Class seeded.');

  // 9. System Settings
  const settings = [
    { key: 'current_session_id', value: session.id },
    { key: 'current_term_id', value: dbTerms['First Term'].id },
    { key: 'next_term_begins', value: '2026-09-14' },
    { key: '2fa_globally_required', value: 'false' },
    { key: 'backup_frequency', value: 'weekly' },
  ];

  for (const setting of settings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    });
  }
  console.log('System settings seeded.');

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
