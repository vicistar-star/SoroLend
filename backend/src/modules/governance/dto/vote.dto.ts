import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum VoteType {
  For = 'For',
  Against = 'Against',
  Abstain = 'Abstain',
}

export class VoteDto {
  @IsString()
  @IsNotEmpty()
  proposalId: string;

  @IsString()
  @IsNotEmpty()
  voter: string;

  @IsEnum(VoteType)
  vote: VoteType;

  @IsOptional()
  @IsString()
  reason?: string;
}
