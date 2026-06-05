import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { Question } from '../../database/entities/question.entity';
import { Test, TestStatus } from '../../database/entities/test.entity';
import { User } from '../../database/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionBankService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Test)
    private readonly testRepo: Repository<Test>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  // ── Questions ─────────────────────────────────────────────────────────────

  async findAllQuestions(
    institutionId: string,
    filters: { subject?: string; difficulty?: string; type?: string; tags?: string },
  ): Promise<Question[]> {
    const qb = this.questionRepo
      .createQueryBuilder('q')
      .where('q.institution_id = :institutionId', { institutionId })
      .andWhere('q.is_active = true')
      .orderBy('q.created_at', 'DESC');

    if (filters.subject) qb.andWhere('q.subject = :subject', { subject: filters.subject });
    if (filters.difficulty) qb.andWhere('q.difficulty = :difficulty', { difficulty: filters.difficulty });
    if (filters.type) qb.andWhere('q.type = :type', { type: filters.type });
    if (filters.tags) qb.andWhere(':tag = ANY(q.tags)', { tag: filters.tags });

    return qb.getMany();
  }

  async findOneQuestion(institutionId: string, questionId: string): Promise<Question> {
    const q = await this.questionRepo.findOne({ where: { id: questionId, institution_id: institutionId } });
    if (!q) throw new NotFoundException('Question not found');
    return q;
  }

  async createQuestion(institutionId: string, createdById: string, dto: CreateQuestionDto): Promise<Question> {
    const question = this.questionRepo.create({
      institution_id: institutionId,
      created_by: createdById,
      ...dto,
    });
    return this.questionRepo.save(question);
  }

  async updateQuestion(institutionId: string, questionId: string, dto: UpdateQuestionDto): Promise<Question> {
    const question = await this.findOneQuestion(institutionId, questionId);
    Object.assign(question, dto);
    return this.questionRepo.save(question);
  }

  async removeQuestion(institutionId: string, questionId: string): Promise<void> {
    const question = await this.findOneQuestion(institutionId, questionId);
    await this.questionRepo.remove(question);
  }

  // ── Tests ─────────────────────────────────────────────────────────────────

  async findAllTests(institutionId: string): Promise<Test[]> {
    return this.testRepo.find({
      where: { institution_id: institutionId },
      order: { created_at: 'DESC' },
    });
  }

  async findTestsForStudent(institutionId: string, studentId: string): Promise<Test[]> {
    const student = await this.userRepo.findOne({ where: { id: studentId, institution_id: institutionId } });
    const classId = student?.class_id;
    const qb = this.testRepo
      .createQueryBuilder('t')
      .where('t.institution_id = :institutionId', { institutionId })
      .andWhere('t.status = :status', { status: TestStatus.PUBLISHED });

    if (classId) {
      qb.andWhere('(t.class_id = :classId OR t.class_id IS NULL)', { classId });
    } else {
      qb.andWhere('t.class_id IS NULL');
    }

    return qb.orderBy('t.created_at', 'DESC').getMany();
  }

  async findOneTest(institutionId: string, testId: string): Promise<Test> {
    const test = await this.testRepo.findOne({ where: { id: testId, institution_id: institutionId } });
    if (!test) throw new NotFoundException('Test not found');
    return test;
  }

  async createTest(institutionId: string, createdById: string, dto: CreateTestDto): Promise<Test> {
    // Validate all question IDs belong to this institution
    const questions = await this.questionRepo
      .createQueryBuilder('q')
      .where('q.institution_id = :institutionId', { institutionId })
      .andWhere('q.id IN (:...ids)', { ids: dto.question_ids })
      .getMany();

    if (questions.length !== dto.question_ids.length) {
      throw new BadRequestException('One or more question IDs are invalid or belong to another institution');
    }

    const test = this.testRepo.create({
      institution_id: institutionId,
      created_by: createdById,
      ...dto,
    });
    return this.testRepo.save(test);
  }

  async updateTestStatus(institutionId: string, testId: string, status: TestStatus): Promise<Test> {
    const test = await this.findOneTest(institutionId, testId);
    test.status = status;
    const saved = await this.testRepo.save(test);

    if (status === TestStatus.PUBLISHED) {
      // Notify all students in the institution
      const students = await this.userRepo.find({
        where: { institution_id: institutionId, role: Role.STUDENT, is_active: true },
        select: { email: true },
      });
      const emails = students.map((s) => s.email).filter((e): e is string => !!e);
      if (emails.length) this.mailService.sendTestPublished(test.title, test.subject ?? 'General', emails);
    }

    return saved;
  }

  async removeTest(institutionId: string, testId: string): Promise<void> {
    const test = await this.findOneTest(institutionId, testId);
    if (test.status === TestStatus.PUBLISHED) {
      throw new BadRequestException('Cannot delete a published test. Close it first.');
    }
    await this.testRepo.remove(test);
  }

  async getTestWithQuestions(institutionId: string, testId: string): Promise<{ test: Test; questions: Question[] }> {
    const test = await this.findOneTest(institutionId, testId);
    if (!test.question_ids.length) return { test, questions: [] };

    const questions = await this.questionRepo
      .createQueryBuilder('q')
      .where('q.id IN (:...ids)', { ids: test.question_ids })
      .getMany();

    return { test, questions };
  }
}
