import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { ChallengeRequestDto } from './dto/challenge-request.dto';
import { VerifyRequestDto } from './dto/verify-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('challenge')
  async challenge(@Body() dto: ChallengeRequestDto) {
    return this.authService.generateChallenge(dto.publicKey);
  }

  @Post('verify')
  async verify(@Body() dto: VerifyRequestDto) {
    return this.authService.verifySignature(dto.publicKey, dto.signature);
  }
}
