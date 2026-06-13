import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class WithdrawDto {
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
