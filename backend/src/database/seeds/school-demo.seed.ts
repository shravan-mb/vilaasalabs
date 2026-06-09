/**
 * Demo seed: "Shri Vidya Public School"
 * Structure: 10 standards × 4 sections (A/B/C/D) = 40 classes
 *            ~36 students per section = 1,440 students
 *            40 teachers, 3 staff, 1 admin
 *
 * Usage (run from backend/):
 *   npm run db:seed:demo            — seed (skips if already exists)
 *   npm run db:seed:demo -- --reset — wipe and re-seed
 *
 * All accounts password: Demo@1234
 * Admin login    : admin@shrivdyaschool.edu
 * Teacher login  : phone number (see console output)
 * Student login  : admission number (SVPS2024001 … SVPS20241440)
 */

import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';

import { Role } from '../../common/enums/role.enum';
import { InstitutionType } from '../../common/enums/institution-type.enum';
import { SubscriptionPlan, SubscriptionStatus } from '../../common/enums/subscription-plan.enum';

import { Institution } from '../entities/institution.entity';
import { User } from '../entities/user.entity';
import { Class } from '../entities/class.entity';
import { Subject } from '../entities/subject.entity';
import { AcademicYear } from '../entities/academic-year.entity';
import { Announcement } from '../entities/announcement.entity';
import { StudentParent } from '../entities/student-parent.entity';
import { Attendance, AttendanceStatus } from '../entities/attendance.entity';
import { FeeCategory, FeeFrequency } from '../entities/fee-category.entity';
import { ClassFeeStructure } from '../entities/class-fee-structure.entity';
import { TimetableSlot } from '../entities/timetable-slot.entity';

const SUBDOMAIN = 'shrivdya';
const PASSWORD  = 'Demo@1234';
const RESET     = process.argv.includes('--reset');

const SECTIONS  = ['A', 'B', 'C', 'D'];
const STANDARDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const STUDENTS_PER_SECTION = 36;

// Subjects per standard group
function subjectsFor(std: number): { name: string; code: string }[] {
  const core = [
    { name: 'Kannada',     code: 'KAN' },
    { name: 'English',     code: 'ENG' },
    { name: 'Mathematics', code: 'MATH' },
    { name: 'EVS / Science', code: 'SCI' },
  ];
  const upper = [
    { name: 'Kannada',        code: 'KAN'  },
    { name: 'English',        code: 'ENG'  },
    { name: 'Mathematics',    code: 'MATH' },
    { name: 'Science',        code: 'SCI'  },
    { name: 'Social Studies', code: 'SOC'  },
    { name: 'Hindi',          code: 'HIN'  },
  ];
  const high = [
    { name: 'Kannada',           code: 'KAN'  },
    { name: 'English',           code: 'ENG'  },
    { name: 'Mathematics',       code: 'MATH' },
    { name: 'Science',           code: 'SCI'  },
    { name: 'Social Science',    code: 'SOC'  },
    { name: 'Hindi',             code: 'HIN'  },
    { name: 'Computer Science',  code: 'CS'   },
  ];
  if (std <= 4)  return core;
  if (std <= 7)  return upper;
  return high;
}

// Realistic Indian names
const FIRST_NAMES_M = ['Arjun','Rohan','Aditya','Kiran','Suresh','Rahul','Vikram','Ankit','Manish','Deepak','Sanjay','Rajesh','Nikhil','Amit','Varun','Shubham','Akash','Harsh','Kunal','Ravi','Ganesh','Naveen','Praveen','Santosh','Mahesh'];
const FIRST_NAMES_F = ['Priya','Kavya','Pooja','Ananya','Divya','Sneha','Lakshmi','Meena','Rekha','Suma','Rashmi','Anjali','Shalini','Deepa','Nandini','Vijaya','Usha','Radha','Geeta','Kamala','Bhavana','Sindhu','Pallavi','Sowmya','Smitha'];
const LAST_NAMES    = ['Sharma','Kumar','Patel','Reddy','Nair','Rao','Shetty','Gowda','Naik','Pillai','Joshi','Desai','Verma','Gupta','Hegde','Patil','Kulkarni','Bhat','Iyer','Menon'];

function randName(i: number): string {
  const isMale = i % 2 === 0;
  const first  = isMale ? FIRST_NAMES_M[i % FIRST_NAMES_M.length] : FIRST_NAMES_F[i % FIRST_NAMES_F.length];
  const last   = LAST_NAMES[i % LAST_NAMES.length];
  return `${first} ${last}`;
}

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
  const feeCatRepo = ds.getRepository(FeeCategory);
  const feeStrRepo = ds.getRepository(ClassFeeStructure);
  const ttRepo     = ds.getRepository(TimetableSlot);

  // ── Reset ──────────────────────────────────────────────────────────────────
  if (RESET) {
    const ex = await instRepo.findOne({ where: { subdomain: SUBDOMAIN } });
    if (ex) {
      console.log('🗑  --reset: deleting existing data...');
      await instRepo.delete({ id: ex.id });
      console.log('   Done.\n');
    }
  }

  if (await instRepo.findOne({ where: { subdomain: SUBDOMAIN } })) {
    console.log('\n⚠️  Already seeded. Run with --reset to wipe and re-seed.\n');
    await app.close();
    return;
  }

  const pw = await bcrypt.hash(PASSWORD, 10);
  console.log('\n🌱 Seeding Shri Vidya Public School...\n');

  // ── 1. Institution ─────────────────────────────────────────────────────────
  process.stdout.write('  [1/10] Institution...');
  const inst = await instRepo.save(instRepo.create({
    name:                    'Shri Vidya Public School',
    registration_number:     'KA/SCH/2024/SVPS001',
    type:                    InstitutionType.SCHOOL,
    subdomain:               SUBDOMAIN,
    email:                   'admin@shrivdyaschool.edu',
    phone:                   '9900000000',
    city:                    'Bangalore',
    state:                   'Karnataka',
    address:                 '12 Vidya Nagar, Rajajinagar, Bangalore - 560010',
    principal_name:          'Mr. B.S. Nagaraj',
    subscription_plan:       SubscriptionPlan.PRO,
    subscription_status:     SubscriptionStatus.ACTIVE,
    subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    is_active:               true,
    feature_flags:           { show_subscription_tab: true },
  }));
  console.log(' ✓');

  // ── 2. Academic Year ───────────────────────────────────────────────────────
  process.stdout.write('  [2/10] Academic year...');
  const ay = await ayRepo.save(ayRepo.create({
    institution_id: inst.id,
    name:           '2025-26',
    start_date:     new Date('2025-06-01') as any,
    end_date:       new Date('2026-04-30') as any,
    is_current:     true,
  }));
  console.log(' ✓');

  // ── 3. Admin ───────────────────────────────────────────────────────────────
  process.stdout.write('  [3/10] Admin + Staff...');
  await userRepo.save(userRepo.create({
    institution_id:      inst.id,
    role:                Role.INSTITUTION_ADMIN,
    name:                'B.S. Nagaraj',
    email:               'admin@shrivdyaschool.edu',
    phone:               '9900000000',
    password_hash:       pw,
    registration_number: null,
  }));

  // 3 staff
  for (let i = 0; i < 3; i++) {
    await userRepo.save(userRepo.create({
      institution_id:      inst.id,
      role:                Role.INSTITUTION_STAFF,
      name:                randName(200 + i),
      phone:               `990000000${i + 1}`,
      password_hash:       pw,
      registration_number: null,
    }));
  }
  console.log(' ✓');

  // ── 4. Classes — 10 standards × 4 sections = 40 classes ───────────────────
  process.stdout.write('  [4/10] 40 Classes...');
  const classMap: Record<string, Class> = {};   // key: "1-A"
  for (const std of STANDARDS) {
    for (const sec of SECTIONS) {
      const cls = await classRepo.save(classRepo.create({
        institution_id: inst.id,
        name:           `Class ${std}`,
        section:        sec,
        academic_year:  ay.name,
      }));
      classMap[`${std}-${sec}`] = cls;
    }
  }
  console.log(' ✓');

  // ── 5. Subjects ────────────────────────────────────────────────────────────
  process.stdout.write('  [5/10] Subjects...');
  // We keep one Subject record per (standard, subject) — shared across sections for same standard
  const subjectMap: Record<string, Subject> = {};   // key: "1-MATH"
  for (const std of STANDARDS) {
    const defs = subjectsFor(std);
    for (const sec of SECTIONS) {
      const cls = classMap[`${std}-${sec}`];
      for (const def of defs) {
        const key = `${std}-${def.code}-${sec}`;
        subjectMap[key] = await subRepo.save(subRepo.create({
          institution_id: inst.id,
          class_id:       cls.id,
          name:           def.name,
          code:           `${def.code}-${std}${sec}`,
        }));
      }
    }
  }
  console.log(' ✓');

  // ── 6. Teachers — 1 per section per upper class, shared for lower ──────────
  //   40 class-teacher assignments; we'll create 40 teachers total
  process.stdout.write('  [6/10] 40 Teachers...');
  const teachers: User[] = [];
  for (let i = 0; i < 40; i++) {
    teachers.push(await userRepo.save(userRepo.create({
      institution_id:      inst.id,
      role:                Role.TEACHER,
      name:                randName(100 + i),
      phone:               `9911${String(i).padStart(6, '0')}`,
      password_hash:       pw,
      registration_number: null,
    })));
  }
  // Assign class teachers (one teacher per class)
  for (let idx = 0; idx < 40; idx++) {
    const std = STANDARDS[Math.floor(idx / 4)];
    const sec = SECTIONS[idx % 4];
    const cls = classMap[`${std}-${sec}`];
    await classRepo.update(cls.id, { class_teacher_id: teachers[idx].id } as any);
  }
  console.log(' ✓');

  // ── 7. Students — 36 per section = 1,440 total ────────────────────────────
  process.stdout.write('  [7/10] 1,440 Students + Parents...');
  let admissionCounter = 1;
  const allStudents: User[] = [];

  for (const std of STANDARDS) {
    for (const sec of SECTIONS) {
      const cls = classMap[`${std}-${sec}`];
      for (let s = 0; s < STUDENTS_PER_SECTION; s++) {
        const admNo = `SVPS2025${String(admissionCounter).padStart(4, '0')}`;
        const student = await userRepo.save(userRepo.create({
          institution_id:      inst.id,
          role:                Role.STUDENT,
          name:                randName(admissionCounter),
          class_id:            cls.id,
          password_hash:       pw,
          registration_number: admNo,
        }));
        allStudents.push(student);

        // Parent for every 3rd student (realistic — some parents have multiple kids)
        if (admissionCounter % 3 === 0) {
          const parent = await userRepo.save(userRepo.create({
            institution_id:      inst.id,
            role:                Role.PARENT,
            name:                `Parent of ${student.name}`,
            phone:               `9922${String(admissionCounter).padStart(6, '0')}`,
            password_hash:       pw,
            registration_number: null,
          }));
          await spRepo.save(spRepo.create({
            institution_id: inst.id,
            student_id:     student.id,
            parent_id:      parent.id,
          } as any));
        }

        admissionCounter++;
      }
    }
  }
  console.log(' ✓');

  // ── 8. Attendance — last 5 weekdays for first 4 classes (sample) ──────────
  process.stdout.write('  [8/10] Attendance records (sample)...');
  const days = lastWeekdays(5);
  const sampleClasses = Object.values(classMap).slice(0, 4);
  for (const cls of sampleClasses) {
    const clsStudents = allStudents.filter(s => s.class_id === cls.id);
    for (const day of days) {
      for (const student of clsStudents) {
        const roll = Math.random();
        const status = roll > 0.1 ? AttendanceStatus.PRESENT
                     : roll > 0.05 ? AttendanceStatus.ABSENT
                     : AttendanceStatus.LATE;
        await attRepo.save(attRepo.create({
          institution_id: inst.id,
          student_id:     student.id,
          class_id:       cls.id,
          date:           day as any,
          status,
          marked_by_id:   teachers[0].id,
        } as any));
      }
    }
  }
  console.log(' ✓');

  // ── 9. Fee Categories + Structure ─────────────────────────────────────────
  process.stdout.write('  [9/10] Fee structure...');
  const tuition = await feeCatRepo.save(feeCatRepo.create({
    institution_id: inst.id,
    name:           'Tuition Fee',
    frequency:      FeeFrequency.MONTHLY,
    amount:         1500,
    description:    'Monthly tuition fee',
  } as any));
  const exam = await feeCatRepo.save(feeCatRepo.create({
    institution_id: inst.id,
    name:           'Exam Fee',
    frequency:      FeeFrequency.ANNUAL,
    amount:         2000,
    description:    'Annual examination fee',
  } as any));

  // Apply to first 8 classes as sample
  for (const cls of Object.values(classMap).slice(0, 8)) {
    for (const cat of [tuition, exam] as any[]) {
      await feeStrRepo.save(feeStrRepo.create({
        institution_id:  inst.id,
        class_id:        cls.id,
        fee_category_id: cat.id,
        amount:          cat.amount,
      } as any));
    }
  }
  console.log(' ✓');

  // ── 10. Timetable (sample — Class 1A, Mon-Fri) ────────────────────────────
  process.stdout.write('  [10/10] Timetable (Class 1 sample)...');
  const cls1A = classMap['1-A'];
  const days5 = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [
    { start: '09:00', end: '09:45' },
    { start: '09:45', end: '10:30' },
    { start: '10:45', end: '11:30' },
    { start: '11:30', end: '12:15' },
  ];
  const cls1Subs = Object.entries(subjectMap)
    .filter(([k]) => k.startsWith('1-') && k.endsWith('-A'))
    .map(([, v]) => v);

  for (const day of days5) {
    for (let p = 0; p < Math.min(periods.length, cls1Subs.length); p++) {
      await ttRepo.save(ttRepo.create({
        institution_id: inst.id,
        class_id:       cls1A.id,
        subject_id:     cls1Subs[p % cls1Subs.length].id,
        teacher_id:     teachers[0].id,
        day_of_week:    day,
        start_time:     periods[p].start,
        end_time:       periods[p].end,
      } as any));
    }
  }
  console.log(' ✓');

  // ── Announcements ─────────────────────────────────────────────────────────
  await annoRepo.save(annoRepo.create({
    institution_id: inst.id,
    title:          'Welcome to Academic Year 2025-26',
    content:        'Dear students and parents, welcome to the new academic year. Classes begin on June 2nd, 2025.',
    created_by_id:  allStudents[0].id,
    target_role:    null,
  } as any));

  // ── Print credentials ──────────────────────────────────────────────────────
  console.log('\n✅ Shri Vidya Public School seeded successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SCHOOL      : Shri Vidya Public School');
  console.log('  SUBDOMAIN   : shrivdya.eduvilaasa.com');
  console.log('  PASSWORD    : Demo@1234 (all accounts)');
  console.log('  PLAN        : PRO (active, 1 year)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ADMIN       : admin@shrivdyaschool.edu');
  console.log('  TEACHER     : phone 9911000000 → 9911000039 (40 teachers)');
  console.log('  STUDENT     : admission no SVPS20250001 → SVPS20251440');
  console.log('  PARENT      : phone 9922000003, 9922000006 … (every 3rd)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CLASSES     : 40 (Class 1–10, Sections A/B/C/D)');
  console.log('  STUDENTS    : 1,440');
  console.log('  TEACHERS    : 40');
  console.log('  PARENTS     : ~480');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await app.close();
}

seed().catch(e => { console.error(e); process.exit(1); });
