import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';

export class ResultEntryDto {
  @IsUUID()
  student_id: string;

  @IsNumber()
  @Min(0)
  score: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpsertResultsDto {
  @IsUUID()
  test_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResultEntryDto)
  results: ResultEntryDto[];
}
