import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentBoard } from '../../database/entities/content-board.entity';
import { ContentPack } from '../../database/entities/content-pack.entity';
import { ContentSyllabusChapter } from '../../database/entities/content-syllabus-chapter.entity';
import { ContentSyllabusNote } from '../../database/entities/content-syllabus-note.entity';
import { ContentQuestion } from '../../database/entities/content-question.entity';
import { ContentTestTemplate } from '../../database/entities/content-test-template.entity';
import { InstitutionContentAccess } from '../../database/entities/institution-content-access.entity';
import { ContentPacksService } from './content-packs.service';
import { ContentPacksAdminController } from './content-packs-admin.controller';
import { ContentPacksSchoolController } from './content-packs-school.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContentBoard,
      ContentPack,
      ContentSyllabusChapter,
      ContentSyllabusNote,
      ContentQuestion,
      ContentTestTemplate,
      InstitutionContentAccess,
    ]),
  ],
  controllers: [ContentPacksAdminController, ContentPacksSchoolController],
  providers: [ContentPacksService],
  exports: [ContentPacksService],
})
export class ContentPacksModule {}
