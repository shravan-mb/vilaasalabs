import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ContentBoard } from '../../database/entities/content-board.entity';
import { ContentPack } from '../../database/entities/content-pack.entity';
import { ContentSyllabusChapter } from '../../database/entities/content-syllabus-chapter.entity';
import { ContentSyllabusNote } from '../../database/entities/content-syllabus-note.entity';
import { ContentQuestion } from '../../database/entities/content-question.entity';
import { ContentTestTemplate } from '../../database/entities/content-test-template.entity';
import { InstitutionContentAccess } from '../../database/entities/institution-content-access.entity';
import {
  CreateBoardDto, CreateChapterDto, CreateNoteDto,
  CreatePackDto, CreateQuestionDto, CreateTestTemplateDto,
} from './dto/content-packs.dto';

@Injectable()
export class ContentPacksService {
  constructor(
    @InjectRepository(ContentBoard)       private boardRepo: Repository<ContentBoard>,
    @InjectRepository(ContentPack)        private packRepo: Repository<ContentPack>,
    @InjectRepository(ContentSyllabusChapter) private chapterRepo: Repository<ContentSyllabusChapter>,
    @InjectRepository(ContentSyllabusNote)    private noteRepo: Repository<ContentSyllabusNote>,
    @InjectRepository(ContentQuestion)    private questionRepo: Repository<ContentQuestion>,
    @InjectRepository(ContentTestTemplate) private testRepo: Repository<ContentTestTemplate>,
    @InjectRepository(InstitutionContentAccess) private accessRepo: Repository<InstitutionContentAccess>,
  ) {}

  // ── Boards ──────────────────────────────────────────────────────────────────

  listBoards(activeOnly = false) {
    return this.boardRepo.find({
      where: activeOnly ? { is_active: true } : undefined,
      order: { name: 'ASC' },
    });
  }

  createBoard(dto: CreateBoardDto) {
    return this.boardRepo.save(this.boardRepo.create(dto));
  }

  async updateBoard(id: string, dto: Partial<CreateBoardDto>) {
    await this.boardRepo.update(id, dto);
    return this.boardRepo.findOne({ where: { id } });
  }

  // ── Packs ───────────────────────────────────────────────────────────────────

  listPacks(boardId?: string, standard?: number) {
    return this.packRepo.find({
      where: {
        ...(boardId   ? { board_id: boardId }   : {}),
        ...(standard  ? { standard }             : {}),
      },
      relations: { board: true },
      order: { standard: 'ASC', subject: 'ASC' },
    });
  }

  createPack(dto: CreatePackDto) {
    return this.packRepo.save(this.packRepo.create(dto));
  }

  getPack(id: string) {
    return this.packRepo.findOne({ where: { id }, relations: { board: true } });
  }

  async updatePack(id: string, dto: Partial<CreatePackDto>) {
    await this.packRepo.update(id, dto);
    return this.packRepo.findOne({ where: { id } });
  }

  async deletePack(id: string) { await this.packRepo.delete(id); }

  // ── Syllabus Chapters ────────────────────────────────────────────────────────

  getChapters(packId: string) {
    return this.chapterRepo.find({
      where: { pack_id: packId },
      relations: { notes: true },
      order: { chapter_number: 'ASC' },
    });
  }

  createChapter(packId: string, dto: CreateChapterDto) {
    return this.chapterRepo.save(this.chapterRepo.create({ ...dto, pack_id: packId }));
  }

  async updateChapter(id: string, dto: Partial<CreateChapterDto>) {
    await this.chapterRepo.update(id, dto);
    return this.chapterRepo.findOne({ where: { id } });
  }

  async deleteChapter(id: string) { await this.chapterRepo.delete(id); }

  // ── Syllabus Notes ───────────────────────────────────────────────────────────

  createNote(chapterId: string, dto: CreateNoteDto) {
    return this.noteRepo.save(this.noteRepo.create({ ...dto, chapter_id: chapterId }));
  }

  async updateNote(id: string, dto: Partial<CreateNoteDto>) {
    await this.noteRepo.update(id, dto);
    return this.noteRepo.findOne({ where: { id } });
  }

  async deleteNote(id: string) { await this.noteRepo.delete(id); }

  // ── Questions ────────────────────────────────────────────────────────────────

  getQuestions(packId: string) {
    return this.questionRepo.find({ where: { pack_id: packId }, order: { created_at: 'ASC' } });
  }

  createQuestion(packId: string, dto: CreateQuestionDto) {
    return this.questionRepo.save(this.questionRepo.create({ ...dto, pack_id: packId }));
  }

  async updateQuestion(id: string, dto: Partial<CreateQuestionDto>) {
    await this.questionRepo.update(id, dto);
    return this.questionRepo.findOne({ where: { id } });
  }

  async deleteQuestion(id: string) { await this.questionRepo.delete(id); }

  // ── Test Templates ───────────────────────────────────────────────────────────

  getTests(packId: string) {
    return this.testRepo.find({ where: { pack_id: packId }, order: { created_at: 'ASC' } });
  }

  createTest(packId: string, dto: CreateTestTemplateDto) {
    return this.testRepo.save(this.testRepo.create({ ...dto, pack_id: packId }));
  }

  async updateTest(id: string, dto: Partial<CreateTestTemplateDto>) {
    await this.testRepo.update(id, dto);
    return this.testRepo.findOne({ where: { id } });
  }

  async deleteTest(id: string) { await this.testRepo.delete(id); }

  // ── Institution Access (super admin) ─────────────────────────────────────────

  async getInstitutionAccess(institutionId: string) {
    const allBoards = await this.boardRepo.find({ where: { is_active: true }, order: { name: 'ASC' } });
    const access = await this.accessRepo.find({
      where: { institution_id: institutionId },
      relations: { board: true },
    });
    return allBoards.map((board) => {
      const record = access.find((a) => a.board_id === board.id);
      return { board, is_enabled: record?.is_enabled ?? false, access_id: record?.id ?? null };
    });
  }

  async setInstitutionAccess(institutionId: string, boardId: string, isEnabled: boolean, enabledBy: string) {
    let record = await this.accessRepo.findOne({ where: { institution_id: institutionId, board_id: boardId } });
    if (record) {
      record.is_enabled = isEnabled;
      record.enabled_by = enabledBy;
    } else {
      record = this.accessRepo.create({ institution_id: institutionId, board_id: boardId, is_enabled: isEnabled, enabled_by: enabledBy });
    }
    return this.accessRepo.save(record);
  }

  // ── School portal: enabled boards + content ──────────────────────────────────

  async getEnabledBoards(institutionId: string) {
    const access = await this.accessRepo.find({
      where: { institution_id: institutionId, is_enabled: true },
      relations: { board: true },
    });
    return access.filter((a) => a.board?.is_active).map((a) => a.board);
  }

  async getPacksForInstitution(institutionId: string, boardId?: string, standard?: number, subject?: string) {
    const enabled = await this.getEnabledBoards(institutionId);
    if (!enabled.length) return [];
    const enabledIds = enabled.map((b) => b.id);
    const targetIds = boardId ? (enabledIds.includes(boardId) ? [boardId] : []) : enabledIds;
    if (!targetIds.length) return [];
    return this.packRepo.find({
      where: {
        board_id: In(targetIds),
        is_published: true,
        ...(standard ? { standard } : {}),
        ...(subject  ? { subject }  : {}),
      },
      relations: { board: true },
      order: { standard: 'ASC', subject: 'ASC' },
    });
  }
}
