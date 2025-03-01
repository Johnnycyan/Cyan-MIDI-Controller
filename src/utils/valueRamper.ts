type RampCallback = (value: number) => void;

class ValueRamper {
  private currentRamp: number | null = null;
  private currentValue: number = 0;
  private targetValue: number = 0;
  private rampTimeMs: number = 0;
  private onUpdate: RampCallback | null = null;
  private lastUpdateTime: number = 0;

  startRamp(fromValue: number, toValue: number, msPerStep: number, callback: RampCallback) {
    // Clear any existing ramp
    this.stopRamp();

    this.currentValue = fromValue;
    this.targetValue = toValue;
    this.rampTimeMs = msPerStep;
    this.onUpdate = callback;
    this.lastUpdateTime = performance.now();

    // Start the ramp
    this.currentRamp = requestAnimationFrame(this.updateRamp);
  }

  stopRamp() {
    if (this.currentRamp !== null) {
      cancelAnimationFrame(this.currentRamp);
      this.currentRamp = null;
    }
  }

  private updateRamp = () => {
    const now = performance.now();
    const elapsed = now - this.lastUpdateTime;

    if (elapsed >= this.rampTimeMs) {
      // Time to update the value
      const step = this.currentValue < this.targetValue ? 1 : -1;
      this.currentValue += step;
      this.onUpdate?.(this.currentValue);
      this.lastUpdateTime = now;

      // Check if we've reached the target
      if (this.currentValue === this.targetValue) {
        this.stopRamp();
        return;
      }
    }

    // Continue the ramp
    this.currentRamp = requestAnimationFrame(this.updateRamp);
  };
}

export const valueRamper = new ValueRamper();
