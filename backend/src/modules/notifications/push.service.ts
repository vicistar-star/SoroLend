import { Injectable, Logger } from '@nestjs/common';

export interface PushSubscription {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  private subscriptions: Map<string, PushSubscription[]> = new Map();

  registerSubscription(publicKey: string, subscription: PushSubscription): void {
    const existing = this.subscriptions.get(publicKey) || [];
    existing.push(subscription);
    this.subscriptions.set(publicKey, existing);
    this.logger.debug(`Push subscription registered for ${publicKey}`);
  }

  unregisterSubscription(publicKey: string, endpoint: string): void {
    const existing = this.subscriptions.get(publicKey) || [];
    this.subscriptions.set(
      publicKey,
      existing.filter((s) => s.endpoint !== endpoint),
    );
  }

  async sendPushNotification(
    publicKey: string,
    title: string,
    body: string,
  ): Promise<boolean> {
    const subs = this.subscriptions.get(publicKey);
    if (!subs || subs.length === 0) {
      this.logger.debug(`No push subscriptions for ${publicKey}`);
      return false;
    }

    this.logger.debug(
      `[STUB:WebPush] Sending push to ${publicKey}: ${title} - ${body}`,
    );
    return true;
  }

  async sendHealthAlert(
    publicKey: string,
    healthFactor: number,
  ): Promise<boolean> {
    return this.sendPushNotification(
      publicKey,
      'Health Factor Alert',
      `Your health factor is ${healthFactor.toFixed(2)}. Please take action.`,
    );
  }
}
