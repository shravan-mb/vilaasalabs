import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ContentPacksService } from './content-packs.service';
import {
  CreateBoardDto, CreateChapterDto, CreateNoteDto,
  CreatePackDto, CreateQuestionDto, CreateTestTemplateDto,
  SetInstitutionAccessDto,
} from './dto/content-packs.dto';

@ApiTags('Content Packs — Admin')
@Controller('vilaasalabs-admin/content')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.VILAASALABS_SUPER_ADMIN, Role.VILAASALABS_DEV)
@ApiBearerAuth()
export class ContentPacksAdminController {
  constructor(private readonly svc: ContentPacksService) {}

  // ── Boards ──────────────────────────────────────────────────────────────────
  @Get('boards')
  @ApiOperation({ summary: 'List all boards' })
  listBoards() { return this.svc.listBoards(); }

  @Post('boards')
  @ApiOperation({ summary: 'Create a board' })
  createBoard(@Body() dto: CreateBoardDto) { return this.svc.createBoard(dto); }

  @Patch('boards/:id')
  @ApiOperation({ summary: 'Update a board' })
  updateBoard(@Param('id') id: string, @Body() dto: Partial<CreateBoardDto>) { return this.svc.updateBoard(id, dto); }

  // ── Packs ───────────────────────────────────────────────────────────────────
  @Get('packs')
  @ApiOperation({ summary: 'List content packs (filter by boardId, standard)' })
  listPacks(@Query('boardId') boardId?: string, @Query('standard') standard?: string) {
    return this.svc.listPacks(boardId, standard ? +standard : undefined);
  }

  @Post('packs')
  @ApiOperation({ summary: 'Create a content pack' })
  createPack(@Body() dto: CreatePackDto) { return this.svc.createPack(dto); }

  @Get('packs/:id')
  @ApiOperation({ summary: 'Get pack detail' })
  getPack(@Param('id') id: string) { return this.svc.getPack(id); }

  @Patch('packs/:id')
  @ApiOperation({ summary: 'Update a content pack' })
  updatePack(@Param('id') id: string, @Body() dto: Partial<CreatePackDto>) { return this.svc.updatePack(id, dto); }

  @Delete('packs/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a content pack' })
  async deletePack(@Param('id') id: string) { await this.svc.deletePack(id); return { ok: true }; }

  // ── Chapters ─────────────────────────────────────────────────────────────────
  @Get('packs/:id/chapters')
  @ApiOperation({ summary: 'Get chapters for a pack' })
  getChapters(@Param('id') packId: string) { return this.svc.getChapters(packId); }

  @Post('packs/:id/chapters')
  @ApiOperation({ summary: 'Add chapter to a pack' })
  createChapter(@Param('id') packId: string, @Body() dto: CreateChapterDto) { return this.svc.createChapter(packId, dto); }

  @Patch('chapters/:id')
  @ApiOperation({ summary: 'Update a chapter' })
  updateChapter(@Param('id') id: string, @Body() dto: Partial<CreateChapterDto>) { return this.svc.updateChapter(id, dto); }

  @Delete('chapters/:id')
  @HttpCode(200)
  async deleteChapter(@Param('id') id: string) { await this.svc.deleteChapter(id); return { ok: true }; }

  // ── Notes ────────────────────────────────────────────────────────────────────
  @Post('chapters/:id/notes')
  @ApiOperation({ summary: 'Add note to a chapter' })
  createNote(@Param('id') chapterId: string, @Body() dto: CreateNoteDto) { return this.svc.createNote(chapterId, dto); }

  @Patch('notes/:id')
  updateNote(@Param('id') id: string, @Body() dto: Partial<CreateNoteDto>) { return this.svc.updateNote(id, dto); }

  @Delete('notes/:id')
  @HttpCode(200)
  async deleteNote(@Param('id') id: string) { await this.svc.deleteNote(id); return { ok: true }; }

  // ── Questions ────────────────────────────────────────────────────────────────
  @Get('packs/:id/questions')
  @ApiOperation({ summary: 'Get questions for a pack' })
  getQuestions(@Param('id') packId: string) { return this.svc.getQuestions(packId); }

  @Post('packs/:id/questions')
  @ApiOperation({ summary: 'Add question to a pack' })
  createQuestion(@Param('id') packId: string, @Body() dto: CreateQuestionDto) { return this.svc.createQuestion(packId, dto); }

  @Patch('questions/:id')
  updateQuestion(@Param('id') id: string, @Body() dto: Partial<CreateQuestionDto>) { return this.svc.updateQuestion(id, dto); }

  @Delete('questions/:id')
  @HttpCode(200)
  async deleteQuestion(@Param('id') id: string) { await this.svc.deleteQuestion(id); return { ok: true }; }

  // ── Test Templates ───────────────────────────────────────────────────────────
  @Get('packs/:id/tests')
  @ApiOperation({ summary: 'Get test templates for a pack' })
  getTests(@Param('id') packId: string) { return this.svc.getTests(packId); }

  @Post('packs/:id/tests')
  @ApiOperation({ summary: 'Add test template to a pack' })
  createTest(@Param('id') packId: string, @Body() dto: CreateTestTemplateDto) { return this.svc.createTest(packId, dto); }

  @Patch('tests/:id')
  updateTest(@Param('id') id: string, @Body() dto: Partial<CreateTestTemplateDto>) { return this.svc.updateTest(id, dto); }

  @Delete('tests/:id')
  @HttpCode(200)
  async deleteTest(@Param('id') id: string) { await this.svc.deleteTest(id); return { ok: true }; }

  // ── Institution content access ───────────────────────────────────────────────
  @Get('institutions/:id/access')
  @ApiOperation({ summary: 'Get board access for an institution' })
  getAccess(@Param('id') institutionId: string) { return this.svc.getInstitutionAccess(institutionId); }

  @Post('institutions/:id/access')
  @ApiOperation({ summary: 'Enable or disable a board for an institution' })
  setAccess(
    @Param('id') institutionId: string,
    @Body() dto: SetInstitutionAccessDto,
    @Request() req: any,
  ) {
    return this.svc.setInstitutionAccess(institutionId, dto.board_id, dto.is_enabled, req.user.sub);
  }
}
