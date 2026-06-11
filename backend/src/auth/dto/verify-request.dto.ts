import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyRequestDto {
  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @IsString()
  @IsNotEmpty()
  signature: string;
}
