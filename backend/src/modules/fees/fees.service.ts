import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassFeeStructure } from '../../database/entities/class-fee-structure.entity';
import { FeeCategory } from '../../database/entities/fee-category.entity';
import { FeePayment } from '../../database/entities/fee-payment.entity';
import { StudentFeeDiscount } from '../../database/entities/student-fee-discount.entity';
import {
  CreateDiscountDto,
  CreateFeeCategoryDto,
  RecordPaymentDto,
  UpdateFeeCategoryDto,
  UpsertClassFeeStructureDto,
} from './dto/fees.dto';

@Injectable()
export class FeesService {
  constructor(
    @InjectRepository(FeeCategory)       private readonly catRepo:      Repository<FeeCategory>,
    @InjectRepository(ClassFeeStructure) private readonly structRepo:   Repository<ClassFeeStructure>,
    @InjectRepository(StudentFeeDiscount) private readonly discountRepo: Repository<StudentFeeDiscount>,
    @InjectRepository(FeePayment)        private readonly paymentRepo:  Repository<FeePayment>,
  ) {}

  // ── Categories ────────────────────────────────────────────────────────────────

  getCategories(institutionId: string) {
    return this.catRepo.find({ where: { institution_id: institutionId }, order: { name: 'ASC' } });
  }

  async createCategory(institutionId: string, dto: CreateFeeCategoryDto) {
    const cat = this.catRepo.create({ ...dto, institution_id: institutionId });
    return this.catRepo.save(cat);
  }

  async updateCategory(institutionId: string, id: string, dto: UpdateFeeCategoryDto) {
    const cat = await this.catRepo.findOne({ where: { id, institution_id: institutionId } });
    if (!cat) throw new NotFoundException('Fee category not found');
    Object.assign(cat, dto);
    return this.catRepo.save(cat);
  }

  async deleteCategory(institutionId: string, id: string) {
    const cat = await this.catRepo.findOne({ where: { id, institution_id: institutionId } });
    if (!cat) throw new NotFoundException('Fee category not found');
    await this.catRepo.remove(cat);
  }

  // ── Class Fee Structures ──────────────────────────────────────────────────────

  getStructures(institutionId: string, classId?: string) {
    const where: any = { institution_id: institutionId };
    if (classId) where.class_id = classId;
    return this.structRepo.find({
      where,
      relations: { fee_category: true, class: true },
      order: { created_at: 'ASC' },
    });
  }

  async upsertStructure(institutionId: string, dto: UpsertClassFeeStructureDto) {
    const existing = await this.structRepo.findOne({
      where: { institution_id: institutionId, class_id: dto.class_id, fee_category_id: dto.fee_category_id, academic_year_id: dto.academic_year_id ?? undefined },
    });
    if (existing) {
      existing.amount = dto.amount;
      existing.due_date = dto.due_date ?? null;
      return this.structRepo.save(existing);
    }
    const s = this.structRepo.create({ ...dto, institution_id: institutionId });
    return this.structRepo.save(s);
  }

  async deleteStructure(institutionId: string, id: string) {
    const s = await this.structRepo.findOne({ where: { id, institution_id: institutionId } });
    if (!s) throw new NotFoundException('Fee structure not found');
    await this.structRepo.remove(s);
  }

  // ── Discounts ─────────────────────────────────────────────────────────────────

  getDiscounts(institutionId: string, studentId: string, academicYearId?: string) {
    const where: any = { institution_id: institutionId, student_id: studentId };
    if (academicYearId) where.academic_year_id = academicYearId;
    return this.discountRepo.find({ where, relations: { fee_category: true }, order: { created_at: 'DESC' } });
  }

  async createDiscount(institutionId: string, approvedBy: string, dto: CreateDiscountDto) {
    const existing = await this.discountRepo.findOne({
      where: { institution_id: institutionId, student_id: dto.student_id, fee_category_id: dto.fee_category_id, academic_year_id: dto.academic_year_id ?? undefined },
    });
    if (existing) {
      existing.discount_amount = dto.discount_amount;
      existing.reason = dto.reason ?? null;
      existing.approved_by = approvedBy;
      return this.discountRepo.save(existing);
    }
    const d = this.discountRepo.create({ ...dto, institution_id: institutionId, approved_by: approvedBy });
    return this.discountRepo.save(d);
  }

  async deleteDiscount(institutionId: string, id: string) {
    const d = await this.discountRepo.findOne({ where: { id, institution_id: institutionId } });
    if (!d) throw new NotFoundException('Discount not found');
    await this.discountRepo.remove(d);
  }

  // ── Payments ──────────────────────────────────────────────────────────────────

  getPayments(institutionId: string, studentId: string, academicYearId?: string) {
    const where: any = { institution_id: institutionId, student_id: studentId };
    if (academicYearId) where.academic_year_id = academicYearId;
    return this.paymentRepo.find({ where, relations: { fee_category: true }, order: { payment_date: 'DESC' } });
  }

  async recordPayment(institutionId: string, collectedBy: string, dto: RecordPaymentDto) {
    const receipt_number = await this.generateReceiptNumber(institutionId);
    const p = this.paymentRepo.create({
      ...dto,
      institution_id: institutionId,
      collected_by: collectedBy,
      payment_mode: 'cash',
      receipt_number,
    });
    return this.paymentRepo.save(p);
  }

  async deletePayment(institutionId: string, id: string) {
    const p = await this.paymentRepo.findOne({ where: { id, institution_id: institutionId } });
    if (!p) throw new NotFoundException('Payment not found');
    await this.paymentRepo.remove(p);
  }

  // ── Student Fee Summary ───────────────────────────────────────────────────────

  async getStudentFeeSummary(institutionId: string, studentId: string, classId: string, academicYearId?: string) {
    const [structures, discounts, payments] = await Promise.all([
      this.structRepo.find({
        where: { institution_id: institutionId, class_id: classId, ...(academicYearId ? { academic_year_id: academicYearId } : {}) },
        relations: { fee_category: true },
      }),
      this.discountRepo.find({
        where: { institution_id: institutionId, student_id: studentId, ...(academicYearId ? { academic_year_id: academicYearId } : {}) },
      }),
      this.paymentRepo.find({
        where: { institution_id: institutionId, student_id: studentId, ...(academicYearId ? { academic_year_id: academicYearId } : {}) },
      }),
    ]);

    const discountMap = new Map(discounts.map((d) => [d.fee_category_id, Number(d.discount_amount)]));
    const paidMap = new Map<string, number>();
    for (const p of payments) {
      paidMap.set(p.fee_category_id, (paidMap.get(p.fee_category_id) ?? 0) + Number(p.amount_paid));
    }

    let totalDue = 0, totalDiscount = 0, totalPaid = 0;

    const rows = structures.map((s) => {
      const standardAmount = Number(s.amount);
      const discount       = discountMap.get(s.fee_category_id) ?? 0;
      const netDue         = Math.max(0, standardAmount - discount);
      const paid           = paidMap.get(s.fee_category_id) ?? 0;
      const balance        = Math.max(0, netDue - paid);

      totalDue      += standardAmount;
      totalDiscount += discount;
      totalPaid     += paid;

      return {
        fee_category_id:   s.fee_category_id,
        category_name:     s.fee_category.name,
        frequency:         s.fee_category.frequency,
        due_date:          s.due_date,
        standard_amount:   standardAmount,
        discount_amount:   discount,
        net_due:           netDue,
        paid:              paid,
        balance:           balance,
        is_paid:           balance === 0,
      };
    });

    return {
      rows,
      totals: {
        total_due:      totalDue,
        total_discount: totalDiscount,
        net_payable:    totalDue - totalDiscount,
        total_paid:     totalPaid,
        total_balance:  Math.max(0, totalDue - totalDiscount - totalPaid),
      },
    };
  }

  // ── Class-wide Fee Overview (for admin) ───────────────────────────────────────

  async getClassFeeOverview(institutionId: string, classId: string, academicYearId?: string) {
    // Returns per-student summary rows for all students in the class
    const structures = await this.structRepo.find({
      where: { institution_id: institutionId, class_id: classId, ...(academicYearId ? { academic_year_id: academicYearId } : {}) },
      relations: { fee_category: true },
    });

    const totalStructureAmount = structures.reduce((s, r) => s + Number(r.amount), 0);

    const payments = await this.paymentRepo
      .createQueryBuilder('p')
      .innerJoin('users', 'u', 'u.id = p.student_id AND u.class_id = :classId', { classId })
      .where('p.institution_id = :institutionId', { institutionId })
      .select(['p.student_id', 'p.fee_category_id', 'SUM(p.amount_paid) AS paid'])
      .groupBy('p.student_id, p.fee_category_id')
      .getRawMany();

    const discounts = await this.discountRepo
      .createQueryBuilder('d')
      .innerJoin('users', 'u', 'u.id = d.student_id AND u.class_id = :classId', { classId })
      .where('d.institution_id = :institutionId', { institutionId })
      .select(['d.student_id', 'd.fee_category_id', 'd.discount_amount'])
      .getRawMany();

    // Build per-student maps
    const paidByStudent    = new Map<string, number>();
    const discountByStudent = new Map<string, number>();

    for (const p of payments) {
      const k = p['p_student_id'];
      paidByStudent.set(k, (paidByStudent.get(k) ?? 0) + Number(p['paid']));
    }
    for (const d of discounts) {
      const k = d['d_student_id'];
      discountByStudent.set(k, (discountByStudent.get(k) ?? 0) + Number(d['d_discount_amount']));
    }

    return { structures, totalStructureAmount, paidByStudent: Object.fromEntries(paidByStudent), discountByStudent: Object.fromEntries(discountByStudent) };
  }

  // ── Copy Structure ────────────────────────────────────────────────────────────

  async copyStructures(institutionId: string, sourceClassId: string, targetClassIds: string[], overwrite: boolean) {
    const sources = await this.structRepo.find({
      where: { institution_id: institutionId, class_id: sourceClassId },
    });
    if (!sources.length) return { copied: 0, skipped: 0 };

    let copied = 0, skipped = 0;

    for (const targetClassId of targetClassIds) {
      for (const src of sources) {
        const existing = await this.structRepo.findOne({
          where: { institution_id: institutionId, class_id: targetClassId, fee_category_id: src.fee_category_id },
        });
        if (existing) {
          if (overwrite) {
            existing.amount   = src.amount;
            existing.due_date = src.due_date;
            await this.structRepo.save(existing);
            copied++;
          } else {
            skipped++;
          }
        } else {
          const s = this.structRepo.create({
            institution_id:  institutionId,
            class_id:        targetClassId,
            fee_category_id: src.fee_category_id,
            amount:          src.amount,
            due_date:        src.due_date,
          });
          await this.structRepo.save(s);
          copied++;
        }
      }
    }

    return { copied, skipped };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private async generateReceiptNumber(institutionId: string): Promise<string> {
    const count = await this.paymentRepo.count({ where: { institution_id: institutionId } });
    const seq   = String(count + 1).padStart(4, '0');
    const year  = new Date().getFullYear();
    return `RCP-${year}-${seq}`;
  }
}
