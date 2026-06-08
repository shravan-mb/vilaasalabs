/**
 * Comprehensive test-data seed for EduVilaasa.
 * Creates one fully-populated school ("Greenfield High School") with all roles,
 * classes, subjects, attendance, tests, fees, timetable and announcements.
 *
 * Usage (run from backend/):
 *   npm run db:seed:test            — seed (skips if already exists)
 *   npm run db:seed:test -- --reset — wipe greenfield data and re-seed
 */

import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';

// Shared enums
import { Role } from '../../common/enums/role.enum';
import { InstitutionType } from '../../common/enums/institution-type.enum';
import { SubscriptionPlan, SubscriptionStatus } from '../../common/enums/subscription-plan.enum';

// Entities
import { Institution } from '../entities/institution.entity';
import { User } from '../entities/user.entity';
import { Class } from '../entities/class.entity';
import { Subject } from '../entities/subject.entity';
import { AcademicYear } from '../entities/academic-year.entity';
import { Announcement } from '../entities/announcement.entity';
import { StudentParent } from '../entities/student-parent.entity';
import { Attendance, AttendanceStatus } from '../entities/attendance.entity';
import { Question, QuestionType, DifficultyLevel } from '../entities/question.entity';
import { Test as TestEntity, TestStatus } from '../entities/test.entity';
import { TestResult } from '../entities/test-result.entity';
import { FeeCategory, FeeFrequency } from '../entities/fee-category.entity';
import { ClassFeeStructure } from '../entities/class-fee-structure.entity';
import { FeePayment } from '../entities/fee-payment.entity';
import { TimetableSlot } from '../entities/timetable-slot.entity';
import { ProctorNote } from '../entities/proctor-note.entity';
import { MeetingRequest, MeetingRequestStatus } from '../entities/meeting-request.entity';

const SUBDOMAIN = 'greenfield';
const PASSWORD  = 'Test@1234';
const RESET     = process.argv.includes('--reset');

function lastWeekdays(n: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date();
  while (days.length < n) {
    cursor.setDate(cursor.getDate() - 1);
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) days.push(new Date(cursor));
  }
  return days;
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const ds  = app.get(DataSource);
  await ds.synchronize();

  const instRepo   = ds.getRepository(Institution);
  const userRepo   = ds.getRepository(User);
  const classRepo  = ds.getRepository(Class);
  const subRepo    = ds.getRepository(Subject);
  const ayRepo     = ds.getRepository(AcademicYear);
  const annoRepo   = ds.getRepository(Announcement);
  const spRepo     = ds.getRepository(StudentParent);
  const attRepo    = ds.getRepository(Attendance);
  const qRepo      = ds.getRepository(Question);
  const testRepo   = ds.getRepository(TestEntity);
  const resultRepo = ds.getRepository(TestResult);
  const feeCatRepo = ds.getRepository(FeeCategory);
  const feeStrRepo = ds.getRepository(ClassFeeStructure);
  const feePayRepo = ds.getRepository(FeePayment);
  const ttRepo     = ds.getRepository(TimetableSlot);
  const noteRepo   = ds.getRepository(ProctorNote);
  const mrRepo     = ds.getRepository(MeetingRequest);

  // ── Reset ────────────────────────────────────────────────────────────────
  if (RESET) {
    const ex = await instRepo.findOne({ where: { subdomain: SUBDOMAIN } });
    if (ex) {
      console.log('🗑  --reset: deleting existing Greenfield data...');
      await instRepo.delete({ id: ex.id });
      console.log('   Done.\n');
    }
  }

  // ── Idempotency ──────────────────────────────────────────────────────────
  if (await instRepo.findOne({ where: { subdomain: SUBDOMAIN } })) {
    console.log('\n⚠️  Already seeded. Run with --reset to wipe and re-seed.\n');
    printCredentials();
    await app.close();
    return;
  }

  const pw = await bcrypt.hash(PASSWORD, 10);
  console.log('\n🌱 Seeding Greenfield High School test data...\n');

  // ── 1. Institution ───────────────────────────────────────────────────────
  process.stdout.write('  Institution...');
  const inst = await instRepo.save(instRepo.create({
    name:                    'Greenfield High School',
    registration_number:     'KA/SCH/2024/GHS001',
    type:                    InstitutionType.SCHOOL,
    subdomain:               SUBDOMAIN,
    email:                   'principal@greenfield.edu',
    phone:                   '9800000000',
    city:                    'Bangalore',
    state:                   'Karnataka',
    address:                 '14 Greenfield Road, Whitefield',
    principal_name:          'Dr. Anand Krishnamurthy',
    subscription_plan:       SubscriptionPlan.PRO,
    subscription_status:     SubscriptionStatus.ACTIVE,
    subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    is_active:               true,
    feature_flags:           { show_subscription_tab: true },
  }));
  console.log(' ✓');

  // ── 2. Academic Year ─────────────────────────────────────────────────────
  process.stdout.write('  Academic year...');
  const ay = await ayRepo.save(ayRepo.create({
    institution_id: inst.id,
    name:           '2024-25',
    start_date:     new Date('2024-06-01') as any,
    end_date:       new Date('2025-04-30') as any,
    is_current:     true,
  }));
  console.log(' ✓');

  // ── 3. Classes (6) ──────────────────────────────────────────────────────
  process.stdout.write('  Classes...');
  const classDefs = [
    { name: 'Class 9',  section: 'A' },
    { name: 'Class 9',  section: 'B' },
    { name: 'Class 10', section: 'A' },
    { name: 'Class 10', section: 'B' },
    { name: 'Class 11', section: 'A' },
    { name: 'Class 11', section: 'B' },
  ];
  const classes: Class[] = [];
  for (const cd of classDefs) {
    classes.push(await classRepo.save(classRepo.create({
      institution_id: inst.id,
      name:           cd.name,
      section:        cd.section,
      academic_year:  ay.name,
    })));
  }
  console.log(' ✓');

  // ── 4. Subjects (5 per class = 30) ──────────────────────────────────────
  process.stdout.write('  Subjects...');
  const SUBJECTS = [
    { name: 'Mathematics',      code: 'MATH' },
    { name: 'Science',          code: 'SCI'  },
    { name: 'English',          code: 'ENG'  },
    { name: 'Social Studies',   code: 'SOC'  },
    { name: 'Computer Science', code: 'CS'   },
  ];
  const subsByClass: Record<string, Subject[]> = {};
  for (const cls of classes) {
    subsByClass[cls.id] = [];
    for (const s of SUBJECTS) {
      subsByClass[cls.id].push(await subRepo.save(subRepo.create({
        institution_id: inst.id,
        class_id:       cls.id,
        name:           s.name,
        code:           `${s.code}-${cls.name.replace('Class ', '')}${cls.section}`,
      })));
    }
  }
  console.log(' ✓');

  // ── 5. Admin ─────────────────────────────────────────────────────────────
  process.stdout.write('  Admin...');
  const admin = await userRepo.save(userRepo.create({
    institution_id: inst.id,
    role:           Role.INSTITUTION_ADMIN,
    name:           'Dr. Anand Krishnamurthy',
    email:          'principal@greenfield.edu',
    phone:          '9800000000',
    password_hash:  pw,
  }));
  console.log(' ✓');

  // ── 6. Staff (2) ─────────────────────────────────────────────────────────
  process.stdout.write('  Staff...');
  const staff: User[] = [];
  for (const sd of [
    { name: 'Ravi Kumar',  phone: '9800000001' },
    { name: 'Sunita Devi', phone: '9800000002' },
  ]) {
    staff.push(await userRepo.save(userRepo.create({
      institution_id: inst.id,
      role:           Role.INSTITUTION_STAFF,
      name:           sd.name,
      phone:          sd.phone,
      password_hash:  pw,
    })));
  }
  console.log(' ✓');

  // ── 7. Teachers (6) ──────────────────────────────────────────────────────
  process.stdout.write('  Teachers...');
  const teacherDefs = [
    { name: 'Arjun Sharma',  phone: '9800000010', subIdx: 0 }, // Math       – all classes
    { name: 'Priya Nair',    phone: '9800000011', subIdx: 1 }, // Science    – all classes
    { name: 'Kiran Rao',     phone: '9800000012', subIdx: 2 }, // English    – all classes
    { name: 'Deepak Mehta',  phone: '9800000013', subIdx: 3 }, // Social     – all classes
    { name: 'Ananya Singh',  phone: '9800000014', subIdx: 4 }, // CS         – all classes
    { name: 'Rohan Verma',   phone: '9800000015', subIdx: 0 }, // Math extra – 9A/9B/10A only
  ];
  const teachers: User[] = [];
  for (let ti = 0; ti < teacherDefs.length; ti++) {
    const td           = teacherDefs[ti];
    const targetCls    = ti === 5 ? classes.slice(0, 3) : classes;
    const teachingSubs = targetCls.map(cls => ({
      class_id:     cls.id,
      class_name:   `${cls.name} ${cls.section}`,
      subject_id:   subsByClass[cls.id][td.subIdx].id,
      subject_name: SUBJECTS[td.subIdx].name,
    }));
    teachers.push(await userRepo.save(userRepo.create({
      institution_id:    inst.id,
      role:              Role.TEACHER,
      name:              td.name,
      phone:             td.phone,
      password_hash:     pw,
      teaching_subjects: teachingSubs,
    })));
  }
  console.log(' ✓');

  // ── 8. Students (5 per class = 30 total) ─────────────────────────────────
  process.stdout.write('  Students...');
  const STUDENT_NAMES = ['Aditya', 'Bhavna', 'Chirag', 'Divya', 'Eshan'];
  const students: User[] = [];
  let regNum = 1;
  for (const cls of classes) {
    for (let si = 0; si < STUDENT_NAMES.length; si++) {
      students.push(await userRepo.save(userRepo.create({
        institution_id:      inst.id,
        role:                Role.STUDENT,
        name:                STUDENT_NAMES[si],
        phone:               `9810${String(100000 + regNum).slice(-6)}`,
        registration_number: `GHS2024${String(regNum).padStart(3, '0')}`,
        class_id:            cls.id,
        proctor_id:          teachers[si % teachers.length].id,
        password_hash:       pw,
      })));
      regNum++;
    }
  }
  console.log(' ✓');

  // ── 9. Parents (5, linked to first 5 students) ────────────────────────────
  process.stdout.write('  Parents...');
  const PARENT_NAMES = ['Ramesh Patel', 'Sushma Sharma', 'Vijay Verma', 'Lalitha Nair', 'Suresh Mehta'];
  const parents: User[] = [];
  for (let pi = 0; pi < PARENT_NAMES.length; pi++) {
    const parent = await userRepo.save(userRepo.create({
      institution_id: inst.id,
      role:           Role.PARENT,
      name:           PARENT_NAMES[pi],
      phone:          `9820${String(100000 + pi).slice(-6)}`,
      password_hash:  pw,
    }));
    parents.push(parent);
    await spRepo.save(spRepo.create({
      institution_id: inst.id,
      student_id:     students[pi].id,
      parent_id:      parent.id,
      relationship:   'parent',
    }));
  }
  console.log(' ✓');

  // ── 10. Announcements (5) ────────────────────────────────────────────────
  process.stdout.write('  Announcements...');
  const annoDefs: { title: string; body: string; target_role?: string }[] = [
    {
      title:       'School Reopens on June 10',
      body:        'Dear all, school will reopen after summer break on June 10. All students must bring updated fee receipts and ID cards.',
    },
    {
      title:       'Term-End Exam Schedule Released',
      body:        'Students, the term-end examination schedule has been published. Please check your individual timetable and prepare accordingly.',
      target_role: 'student',
    },
    {
      title:       'Monthly Staff Meeting – Friday 3:30 PM',
      body:        'All teachers and staff are requested to attend the monthly meeting this Friday at 3:30 PM in the conference hall.',
      target_role: 'teacher',
    },
    {
      title:       'Parent-Teacher Meeting – July 5',
      body:        'Parents are cordially invited for the quarterly PTM on July 5. Slot bookings are open. Please arrive 10 minutes early.',
      target_role: 'parent',
    },
    {
      title:       'Annual Sports Day – Registrations Open',
      body:        'Register your wards for Sports Day events by June 20. Events: 100m, 400m, long jump, and cricket.',
      target_role: 'all',
    },
  ];
  for (const a of annoDefs) {
    await annoRepo.save(annoRepo.create({
      institution_id:  inst.id,
      title:           a.title,
      body:            a.body,
      target_role:     a.target_role,
      created_by:      admin.id,
      created_by_name: admin.name,
    } as any));
  }
  console.log(' ✓');

  // ── 11. Attendance (last 5 weekdays × 30 students = 150 records) ─────────
  process.stdout.write('  Attendance (150 records)...');
  const DAYS    = lastWeekdays(5);
  const STATUSES: AttendanceStatus[] = [
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.LATE,
    AttendanceStatus.ABSENT,
  ];
  for (const student of students) {
    const marker = teachers.find(t =>
      (t.teaching_subjects as any[]).some(ts => ts.class_id === student.class_id),
    ) ?? teachers[0];
    for (let di = 0; di < DAYS.length; di++) {
      await attRepo.save(attRepo.create({
        institution_id: inst.id,
        student_id:     student.id,
        marked_by:      marker.id,
        class_id:       student.class_id!,
        date:           DAYS[di] as any,
        status:         STATUSES[di],
      }));
    }
  }
  console.log(' ✓');

  // ── 12. Questions (10) ───────────────────────────────────────────────────
  process.stdout.write('  Questions & tests...');
  interface QDef { text: string; correct: string; opts: string[]; diff: DifficultyLevel }
  const mathQDefs: QDef[] = [
    { text: 'What is x in: 2x + 4 = 12?',                      correct: 'b', opts: ['3','4','5','6'],              diff: DifficultyLevel.EASY   },
    { text: 'Simplify: (3x²)(2x³)',                             correct: 'a', opts: ['6x⁵','5x⁵','6x⁶','5x⁶'],    diff: DifficultyLevel.MEDIUM },
    { text: 'HCF of 24 and 36?',                                correct: 'b', opts: ['6','12','8','4'],             diff: DifficultyLevel.EASY   },
    { text: 'Slope of y = 3x − 5?',                             correct: 'a', opts: ['3','−5','5','−3'],           diff: DifficultyLevel.MEDIUM },
    { text: 'Area of circle with radius 7 cm (π = 22/7)?',      correct: 'c', opts: ['44 cm²','22 cm²','154 cm²','77 cm²'], diff: DifficultyLevel.MEDIUM },
  ];
  const sciQDefs: QDef[] = [
    { text: 'Chemical formula of water?',                        correct: 'a', opts: ['H₂O','H₂O₂','HO','H₃O'],    diff: DifficultyLevel.EASY   },
    { text: 'Powerhouse of the cell?',                           correct: 'b', opts: ['Nucleus','Mitochondria','Ribosome','Vacuole'], diff: DifficultyLevel.EASY },
    { text: 'Newton\'s second law of motion:',                   correct: 'c', opts: ['F=mv','F=m/a','F=ma','F=v/t'], diff: DifficultyLevel.MEDIUM },
    { text: 'Plants make food by the process of?',               correct: 'a', opts: ['Photosynthesis','Respiration','Transpiration','Digestion'], diff: DifficultyLevel.EASY },
    { text: 'SI unit of electric current?',                      correct: 'd', opts: ['Volt','Watt','Ohm','Ampere'], diff: DifficultyLevel.EASY   },
  ];

  const saveQ = async (defs: QDef[], teacher: User, subject: string) => {
    const qs: Question[] = [];
    for (const q of defs) {
      qs.push(await qRepo.save(qRepo.create({
        institution_id: inst.id,
        created_by:     teacher.id,
        subject,
        topic:          subject === 'Mathematics' ? 'Algebra & Geometry' : 'General Science',
        question_text:  q.text,
        type:           QuestionType.MCQ,
        options:        q.opts,
        correct_answer: q.correct,
        difficulty:     q.diff,
        tags:           [subject.toLowerCase()],
      })));
    }
    return qs;
  };

  const mathQs = await saveQ(mathQDefs, teachers[0], 'Mathematics');
  const sciQs  = await saveQ(sciQDefs,  teachers[1], 'Science');

  // ── 13. Tests + Results ──────────────────────────────────────────────────
  const mathTest = await testRepo.save(testRepo.create({
    institution_id:    inst.id,
    created_by:        teachers[0].id,
    title:             'Mathematics Unit Test – Algebra',
    description:       'Linear equations, polynomials and basic geometry',
    subject:           'Mathematics',
    class_id:          classes[0].id,
    question_ids:      mathQs.map(q => q.id),
    total_marks:       20,
    duration_minutes:  30,
    status:            TestStatus.PUBLISHED,
    scheduled_at:      new Date(Date.now() - 2 * 86400_000),
  }));

  const sciTest = await testRepo.save(testRepo.create({
    institution_id:    inst.id,
    created_by:        teachers[1].id,
    title:             'Science Quiz – Chapter 1',
    description:       'Chemistry, biology and physics basics',
    subject:           'Science',
    class_id:          classes[1].id,
    question_ids:      sciQs.map(q => q.id),
    total_marks:       20,
    duration_minutes:  20,
    status:            TestStatus.PUBLISHED,
    scheduled_at:      new Date(Date.now() - 86400_000),
  }));

  await testRepo.save(testRepo.create({
    institution_id:   inst.id,
    created_by:       teachers[2].id,
    title:            'English Grammar Test (Draft)',
    subject:          'English',
    class_id:         classes[2].id,
    question_ids:     [],
    total_marks:      0,
    status:           TestStatus.DRAFT,
  }));

  const class9AStudents = students.filter(s => s.class_id === classes[0].id);
  const class9BStudents = students.filter(s => s.class_id === classes[1].id);
  const mathScores = [18, 16, 14, 20, 12];
  const sciScores  = [20, 17, 15, 19, 14];
  for (let i = 0; i < class9AStudents.length; i++) {
    await resultRepo.save(resultRepo.create({
      institution_id: inst.id,
      test_id:        mathTest.id,
      student_id:     class9AStudents[i].id,
      score:          mathScores[i],
    } as any));
  }
  for (let i = 0; i < class9BStudents.length; i++) {
    await resultRepo.save(resultRepo.create({
      institution_id: inst.id,
      test_id:        sciTest.id,
      student_id:     class9BStudents[i].id,
      score:          sciScores[i],
    } as any));
  }
  console.log(' ✓');

  // ── 14. Fee Categories + Structures + Payments ───────────────────────────
  process.stdout.write('  Fees...');
  const feeCats = await Promise.all([
    feeCatRepo.save(feeCatRepo.create({ institution_id: inst.id, name: 'Tuition Fee', description: 'Annual tuition', frequency: FeeFrequency.ANNUAL,   is_active: true })),
    feeCatRepo.save(feeCatRepo.create({ institution_id: inst.id, name: 'Sports Fee',  description: 'Annual sports',  frequency: FeeFrequency.ANNUAL,   is_active: true })),
    feeCatRepo.save(feeCatRepo.create({ institution_id: inst.id, name: 'Library Fee', description: 'Library deposit', frequency: FeeFrequency.ONE_TIME, is_active: true })),
  ]);
  for (const cls of classes) {
    await Promise.all([
      feeStrRepo.save(feeStrRepo.create({ institution_id: inst.id, class_id: cls.id, fee_category_id: feeCats[0].id, academic_year_id: ay.id, amount: 30000, due_date: '2024-07-31' } as any)),
      feeStrRepo.save(feeStrRepo.create({ institution_id: inst.id, class_id: cls.id, fee_category_id: feeCats[1].id, academic_year_id: ay.id, amount: 2000,  due_date: '2024-08-15' } as any)),
      feeStrRepo.save(feeStrRepo.create({ institution_id: inst.id, class_id: cls.id, fee_category_id: feeCats[2].id, academic_year_id: ay.id, amount: 500,   due_date: '2024-07-31' } as any)),
    ]);
  }
  for (let i = 0; i < 3; i++) {
    await feePayRepo.save(feePayRepo.create({
      institution_id:  inst.id,
      student_id:      students[i].id,
      fee_category_id: feeCats[0].id,
      academic_year_id: ay.id,
      amount_paid:     30000,
      payment_date:    new Date('2024-07-05') as any,
      payment_mode:    'online',
      receipt_number:  `GHS-RCP-${1001 + i}`,
      collected_by:    staff[0].id,
      remarks:         'Full tuition fee – 2024-25',
    } as any));
  }
  console.log(' ✓');

  // ── 15. Timetable (Class 9A, Mon–Fri, 20 slots) ──────────────────────────
  process.stdout.write('  Timetable...');
  const TTSlots: { day: number; start: string; end: string; si: number }[] = [
    { day: 1, start: '08:00', end: '08:45', si: 0 },
    { day: 1, start: '08:45', end: '09:30', si: 1 },
    { day: 1, start: '10:00', end: '10:45', si: 2 },
    { day: 1, start: '10:45', end: '11:30', si: 3 },
    { day: 2, start: '08:00', end: '08:45', si: 4 },
    { day: 2, start: '08:45', end: '09:30', si: 0 },
    { day: 2, start: '10:00', end: '10:45', si: 1 },
    { day: 2, start: '10:45', end: '11:30', si: 2 },
    { day: 3, start: '08:00', end: '08:45', si: 3 },
    { day: 3, start: '08:45', end: '09:30', si: 4 },
    { day: 3, start: '10:00', end: '10:45', si: 0 },
    { day: 3, start: '10:45', end: '11:30', si: 1 },
    { day: 4, start: '08:00', end: '08:45', si: 2 },
    { day: 4, start: '08:45', end: '09:30', si: 3 },
    { day: 4, start: '10:00', end: '10:45', si: 4 },
    { day: 4, start: '10:45', end: '11:30', si: 0 },
    { day: 5, start: '08:00', end: '08:45', si: 1 },
    { day: 5, start: '08:45', end: '09:30', si: 2 },
    { day: 5, start: '10:00', end: '10:45', si: 3 },
    { day: 5, start: '10:45', end: '11:30', si: 4 },
  ];
  for (const s of TTSlots) {
    await ttRepo.save(ttRepo.create({
      institution_id: inst.id,
      class_id:       classes[0].id,
      subject_name:   SUBJECTS[s.si].name,
      teacher_id:     teachers[s.si].id,
      teacher_name:   teachers[s.si].name,
      day_of_week:    s.day,
      start_time:     s.start,
      end_time:       s.end,
    } as any));
  }
  console.log(' ✓');

  // ── 16. Proctor Notes ────────────────────────────────────────────────────
  process.stdout.write('  Proctor notes...');
  await noteRepo.save(noteRepo.create({
    institution_id: inst.id,
    student_id:  students[0].id,
    proctor_id:  teachers[0].id,
    content:     'Excellent improvement in Mathematics. Recommend for district-level olympiad.',
  } as any));
  await noteRepo.save(noteRepo.create({
    institution_id: inst.id,
    student_id:  students[1].id,
    proctor_id:  teachers[1].id,
    content:     'Missed 3 consecutive classes last week. Parent informed. Needs close monitoring.',
  } as any));
  console.log(' ✓');

  // ── 17. Meeting Request ──────────────────────────────────────────────────
  process.stdout.write('  Meeting request...');
  await mrRepo.save(mrRepo.create({
    institution_id: inst.id,
    parent_id:      parents[0].id,
    student_id:     students[0].id,
    proctor_id:     students[0].proctor_id ?? teachers[0].id,
    message:        "I'd like to discuss Aditya's progress in Mathematics and the upcoming olympiad.",
    proposed_date:  '2026-06-20',
    status:         MeetingRequestStatus.PENDING,
  } as any));
  console.log(' ✓');

  console.log('\n');
  printCredentials();
  await app.close();
}

function printCredentials() {
  const S = '═'.repeat(64);
  console.log(S);
  console.log('✅  TEST DATA — Greenfield High School');
  console.log(S);
  console.log(`\n🔑  All accounts · Password: Test@1234\n`);

  console.log('👤 ADMIN  (login with email)');
  console.log('   principal@greenfield.edu\n');

  console.log('👤 STAFF  (login with phone)');
  console.log('   9800000001  Ravi Kumar');
  console.log('   9800000002  Sunita Devi\n');

  console.log('👨‍🏫 TEACHERS  (login with phone)');
  console.log('   9800000010  Arjun Sharma   → Mathematics      (all 6 classes)');
  console.log('   9800000011  Priya Nair     → Science          (all 6 classes)');
  console.log('   9800000012  Kiran Rao      → English          (all 6 classes)');
  console.log('   9800000013  Deepak Mehta   → Social Studies   (all 6 classes)');
  console.log('   9800000014  Ananya Singh   → Computer Science (all 6 classes)');
  console.log('   9800000015  Rohan Verma    → Mathematics      (9A / 9B / 10A)\n');

  console.log('🎓 STUDENTS  (login with admission number)');
  console.log('   GHS2024001–005   Class 9A   (5 students)');
  console.log('   GHS2024006–010   Class 9B   (5 students)');
  console.log('   GHS2024011–015   Class 10A  (5 students)');
  console.log('   GHS2024016–020   Class 10B  (5 students)');
  console.log('   GHS2024021–025   Class 11A  (5 students)');
  console.log('   GHS2024026–030   Class 11B  (5 students)\n');

  console.log('👨‍👩‍👧 PARENTS  (login with phone — each linked to one Class 9A student)');
  console.log('   9820100000  Ramesh Patel   → GHS2024001');
  console.log('   9820100001  Sushma Sharma  → GHS2024002');
  console.log('   9820100002  Vijay Verma    → GHS2024003');
  console.log('   9820100003  Lalitha Nair   → GHS2024004');
  console.log('   9820100004  Suresh Mehta   → GHS2024005\n');

  console.log('📦 SEEDED DATA');
  console.log('   6 classes · 30 subjects · 30 students · 6 teachers · 2 staff · 5 parents');
  console.log('   5 announcements (all / student / teacher / parent / all-roles)');
  console.log('   150 attendance records  (5 days × 30 students)');
  console.log('   10 MCQ questions · 2 published tests · 10 test results');
  console.log('   3 fee categories · 18 fee structures · 3 fee payments (3 receipts)');
  console.log('   20 timetable slots for Class 9A · 2 proctor notes · 1 meeting request');
  console.log('\n' + S + '\n');
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err.message ?? err);
  process.exit(1);
});
