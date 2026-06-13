import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class RepayDto {
  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @IsString()
  @IsNotEmpty()
  assetCode: string;

  @IsNumberString()
  @IsNotEmpty()
  amount: string;
}
