import { midiHandler } from "./midiHandler";

/**
 * Helper class for handling toggle button MIDI operations
 * Helps prevent toggle state desync issues
 */
class ToggleHandler {
  private lastSentValues: Map<string, number> = new Map();
  private lastSentTimes: Map<string, number> = new Map();
  private debounceTime = 100;  // ms

  /**
   * Send a toggle state change to MIDI device
   * @param channel MIDI channel (1-16)
   * @param cc MIDI CC number
   * @param value Value to send (typically 0 or 127)
   * @param previousValue Previous value that was sent
   * @returns Promise that resolves to true if successful, false otherwise
   */
  async sendToggleState(
    channel: number,
    cc: number,
    value: number,
    previousValue?: number
  ): Promise<boolean> {
    // Create a key for this control
    const key = `${channel}-${cc}`;
    const now = Date.now();
    
    // Check if we're sending too frequently
    const lastSent = this.lastSentTimes.get(key) || 0;
    if (now - lastSent < this.debounceTime) {
      console.log(`Debouncing MIDI message for ${key}`);
      return false;
    }
    
    // Store this send attempt
    this.lastSentTimes.set(key, now);
    this.lastSentValues.set(key, value);
    
    try {
      // Send the MIDI message
      const success = midiHandler.sendCC(channel, cc, value);
      
      // For debugging
      console.log(`Sent toggle state: ch=${channel}, cc=${cc}, val=${value}, success=${success}`);
      
      return success;
    } catch (error) {
      console.error(`Error sending toggle state: ${error}`);
      return false;
    }
  }
  
  /**
   * Check if a value is consistent with what we expect
   * @param channel MIDI channel
   * @param cc MIDI CC number
   * @param value Value to check
   * @returns True if the value matches what we expect
   */
  isConsistent(channel: number, cc: number, value: number): boolean {
    const key = `${channel}-${cc}`;
    const lastValue = this.lastSentValues.get(key);
    
    return lastValue === undefined || lastValue === value;
  }
  
  /**
   * Reset the state tracking for a specific control or all controls
   * @param channel Optional channel to reset
   * @param cc Optional CC number to reset
   */
  reset(channel?: number, cc?: number): void {
    if (channel !== undefined && cc !== undefined) {
      const key = `${channel}-${cc}`;
      this.lastSentValues.delete(key);
      this.lastSentTimes.delete(key);
    } else {
      this.lastSentValues.clear();
      this.lastSentTimes.clear();
    }
  }
}

// Export a singleton instance
export const toggleHandler = new ToggleHandler();
