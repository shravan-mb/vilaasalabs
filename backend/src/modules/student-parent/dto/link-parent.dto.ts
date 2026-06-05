import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum Relationship {
  FATHER = 'father',
  MOTHER = 'mother',
  GUARDIAN = 'guardian',
  OTHER = 'other',
}

export class LinkParentDto {
  @IsUUID()
  parent_id: string;

  @IsOptional()
  @IsEnum(Relationship)
  relationship?: Relationship;
}
