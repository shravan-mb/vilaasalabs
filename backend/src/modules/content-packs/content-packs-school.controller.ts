import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ContentPacksService } from './content-packs.service';

@ApiTags('Content Packs — School')
@Controller('content')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  Role.INSTITUTION_ADMIN, Role.INSTITUTION_STAFF,
  Role.TEACHER, Role.STUDENT, Role.PARENT,
)
@ApiBearerAuth()
export class ContentPacksSchoolController {
  constructor(private readonly svc: ContentPacksService) {}

  @Get('boards')
  @ApiOperation({ summary: 'Get boards enabled for the current institution' })
  getBoards(@Request() req: any) {
    return this.svc.getEnabledBoards(req.user.institution_id);
  }

  @Get('packs')
  @ApiOperation({ summary: 'Get published packs for institution (filter: boardId, standard, subject)' })
  getPacks(
    @Request() req: any,
    @Query('boardId') boardId?: string,
    @Query('standard') standard?: string,
    @Query('subject') subject?: string,
  ) {
    return this.svc.getPacksForInstitution(req.user.institution_id, boardId, standard ? +standard : undefined, subject);
  }

  @Get('packs/:id/chapters')
  @ApiOperation({ summary: 'Get chapters with notes for a pack' })
  getChapters(@Param('id') packId: string) { return this.svc.getChapters(packId); }

  @Get('packs/:id/questions')
  @ApiOperation({ summary: 'Get questions for a pack' })
  getQuestions(@Param('id') packId: string) { return this.svc.getQuestions(packId); }

  @Get('packs/:id/tests')
  @ApiOperation({ summary: 'Get test templates for a pack' })
  getTests(@Param('id') packId: string) { return this.svc.getTests(packId); }
}
