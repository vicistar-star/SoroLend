import { Injectable, Logger } from '@nestjs/common';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendEmail(payload: EmailPayload): Promise<boolean> {
    this.logger.debug(
      `[STUB:SendGrid] Sending email to=${payload.to}, subject=${payload.subject}`,
    );
    return true;
  }

  async sendHealthAlert(
    email: string,
    publicKey: string,
    healthFactor: number,
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `SoroLend - Health Factor Alert (${healthFactor.toFixed(2)})`,
      body: `Your position (${publicKey}) has a health factor of ${healthFactor.toFixed(4)}. ` +
        `Please take action to avoid liquidation.`,
    });
  }

  async sendLiquidationWarning(
    email: string,
    publicKey: string,
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'SoroLend - Liquidation Warning',
      body: `Your position (${publicKey}) has been partially liquidated. ` +
        `Please review your portfolio and add collateral or repay debt.`,
    });
  }
}
