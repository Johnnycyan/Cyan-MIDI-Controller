import { midiHandler } from './midiHandler';

export class ToggleHandler {
  private lastSentValue: number | null = null;
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5; // ms

  async sendToggleState(
    channel: number,
    cc: number,
    value: number,
    previousValue?: number
  ): Promise<boolean> {
    this.retryCount = 0;
    return this.sendWithRetry(channel, cc, value, previousValue);
  }

  private async sendWithRetry(
    channel: number,
    cc: number,
    value: number,
    previousValue?: number
  ): Promise<boolean> {
    try {
      // Don't send if the value hasn't changed
      if (this.lastSentValue === value) {
        console.debug('Toggle: Skipping send - value unchanged');
        return true;
      }

      // Log the attempt
      console.debug(`Toggle: Sending CC ${cc} on channel ${channel} with value ${value}`);

      // Send the MIDI message
      const success = midiHandler.sendCC(channel, cc, value);

      if (success) {
        this.lastSentValue = value;
        this.retryCount = 0;
        return true;
      }

      // If failed, try to retry
      if (this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        console.debug(`Toggle: Retry attempt ${this.retryCount}`);
        
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.sendWithRetry(channel, cc, value, previousValue);
      }

      // If all retries failed, try to revert to previous state
      if (previousValue !== undefined) {
        console.warn('Toggle: All retries failed, reverting to previous state');
        this.lastSentValue = previousValue;
        return false;
      }

      return false;
    } catch (error) {
      console.error('Toggle: Error sending MIDI:', error);
      return false;
    }
  }

  reset(): void {
    this.lastSentValue = null;
    this.retryCount = 0;
  }
}

// Create singleton instance
export const toggleHandler = new ToggleHandler();
