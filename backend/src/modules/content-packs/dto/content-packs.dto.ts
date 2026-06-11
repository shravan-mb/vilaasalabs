import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateBoardDto {
  @IsString() name: string;
  @IsString() code: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
}

export class CreatePackDto {
  @IsString() board_id: string;
  @IsInt() @Min(1) @Max(12) standard: number;
  @IsString() subject: string;
  @IsOptional() @IsBoolean() is_published?: boolean;
}

export class CreateChapterDto {
  @IsInt() chapter_number: number;
  @IsString() chapter_name: string;
  @IsOptional() @IsArray() topics?: string[];
  @IsOptional() @IsArray() learning_outcomes?: string[];
}

export class CreateNoteDto {
  @IsString() title: string;
  @IsString() content: string;
  @IsOptional() @IsInt() order_index?: number;
}

export class CreateQuestionDto {
  @IsString() question_text: string;
  @IsOptional() @IsString() question_type?: string;
  @IsOptional() @IsArray() options?: string[];
  @IsString() correct_answer: string;
  @IsOptional() @IsString() explanation?: string;
  @IsOptional() @IsString() difficulty?: string;
  @IsOptional() @IsInt() marks?: number;
  @IsOptional() @IsString() chapter?: string;
}

export class CreateTestTemplateDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() total_questions?: number;
  @IsOptional() @IsInt() total_marks?: number;
  @IsOptional() @IsInt() duration_minutes?: number;
  @IsOptional() @IsArray() question_ids?: string[];
}

export class SetInstitutionAccessDto {
  @IsString() board_id: string;
  @IsBoolean() is_enabled: boolean;
}
