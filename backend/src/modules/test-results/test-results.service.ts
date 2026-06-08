import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestResult } from '../../database/entities/test-result.entity';
import { Test } from '../../database/entities/test.entity';
import { User } from '../../database/entities/user.entity';
import { UpsertResultsDto } from './dto/upsert-result.dto';

@Injectable()
export class TestResultsService {
  constructor(
    @InjectRepository(TestResult) private readonly resultRepo: Repository<TestResult>,
    @InjectRepository(Test) private readonly testRepo: Repository<Test>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async upsertResults(institutionId: string, dto: UpsertResultsDto): Promise<TestResult[]> {
    const test = await this.testRepo.findOne({ where: { id: dto.test_id, institution_id: institutionId } });
    if (!test) throw new NotFoundException('Test not found');

    const saved: TestResult[] = [];
    for (const entry of dto.results) {
      const existing = await this.resultRepo.findOne({
        where: { test_id: dto.test_id, student_id: entry.student_id },
      });
      if (existing) {
        existing.score = entry.score;
        existing.remarks = entry.remarks ?? existing.remarks;
        saved.push(await this.resultRepo.save(existing));
      } else {
        const result = this.resultRepo.create({
          institution_id: institutionId,
          test_id: dto.test_id,
          student_id: entry.student_id,
          score: entry.score,
          remarks: entry.remarks,
        });
        saved.push(await this.resultRepo.save(result));
      }
    }
    return saved;
  }

  async getByTest(institutionId: string, testId: string) {
    const test = await this.testRepo.findOne({ where: { id: testId, institution_id: institutionId } });
    if (!test) throw new NotFoundException('Test not found');

    const results = await this.resultRepo.find({ where: { test_id: testId }, order: { created_at: 'ASC' } });

    // Enrich with student names
    const studentIds = [...new Set(results.map((r) => r.student_id))];
    const students = studentIds.length
      ? await this.userRepo.findBy(studentIds.map((id) => ({ id })))
      : [];

    const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

    return {
      test,
      results: results.map((r) => ({
        ...r,
        student_name: studentMap[r.student_id]?.name ?? 'Unknown',
        student_email: studentMap[r.student_id]?.email ?? '',
      })),
    };
  }

  async getByStudent(institutionId: string, studentId: string) {
    const results = await this.resultRepo.find({
      where: { institution_id: institutionId, student_id: studentId },
      order: { created_at: 'DESC' },
    });

    if (!results.length) return { student_id: studentId, results: [] };

    const testIds = [...new Set(results.map((r) => r.test_id))];
    const tests = testIds.length ? await this.testRepo.findBy(testIds.map((id) => ({ id }))) : [];
    const testMap = Object.fromEntries(tests.map((t) => [t.id, t]));

    return {
      student_id: studentId,
      results: results.map((r) => ({
        ...r,
        test_title: testMap[r.test_id]?.title ?? 'Unknown',
        test_total_marks: testMap[r.test_id]?.total_marks ?? 0,
        subject: testMap[r.test_id]?.subject ?? '',
      })),
    };
  }

  async getClassReport(institutionId: string, classId: string) {
    const tests = await this.testRepo.find({
      where: { institution_id: institutionId, class_id: classId },
      order: { created_at: 'DESC' },
    });
    if (!tests.length) return [];

    const rows: { test_id: string; test_title: string; subject: string; total_marks: number; avg_score: number; highest: number; lowest: number; submissions: number }[] = [];
    for (const test of tests) {
      const results = await this.resultRepo.find({ where: { test_id: test.id } });
      if (!results.length) continue;
      const scores = results.map((r) => Number(r.score)).filter((s) => !isNaN(s));
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      rows.push({
        test_id:     test.id,
        test_title:  test.title,
        subject:     test.subject ?? '',
        total_marks: test.total_marks,
        avg_score:   Math.round(avg * 10) / 10,
        highest:     scores.length ? Math.max(...scores) : 0,
        lowest:      scores.length ? Math.min(...scores) : 0,
        submissions: results.length,
      });
    }
    return rows;
  }

  async deleteResult(institutionId: string, resultId: string): Promise<void> {
    const result = await this.resultRepo.findOne({ where: { id: resultId, institution_id: institutionId } });
    if (!result) throw new NotFoundException('Result not found');
    await this.resultRepo.remove(result);
  }
}
