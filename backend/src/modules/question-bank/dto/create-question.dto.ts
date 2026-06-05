import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DifficultyLevel, QuestionType } from '../../../database/entities/question.entity';

export class CreateQuestionDto {
  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsNotEmpty()
  @IsString()
  question_text: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsNotEmpty()
  @IsString()
  correct_answer: string;

  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
