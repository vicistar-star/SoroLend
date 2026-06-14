import { IsArray, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  proposer: string;

  @IsNumberString()
  @IsNotEmpty()
  quorum: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targets?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  values?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  signatures?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  calldatas?: string[];
}
