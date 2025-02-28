/**
 * Utility for synchronizing MIDI values across components
 * This helps keep multiple controls in sync when they share the same MIDI CC
 */

type Listener = (value: number) => void;
type ChannelCC = `${number}-${number}`;  // Format: "channel-cc"

class MidiSync {
  private listeners: Map<ChannelCC, Set<Listener>> = new Map();

  /**
   * Subscribe to changes for a specific MIDI channel and CC
   * @param channel MIDI channel (1-16)
   * @param cc MIDI CC number (0-127)
   * @param callback Function to call when a value changes
   * @returns Unsubscribe function
   */
  subscribe(channel: number, cc: number, callback: Listener): () => void {
    const key: ChannelCC = `${channel}-${cc}`;
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Notify all listeners about a value change
   * @param channel MIDI channel (1-16)
   * @param cc MIDI CC number (0-127)
   * @param value New value (0-127)
   */
  notify(channel: number, cc: number, value: number): void {
    const key: ChannelCC = `${channel}-${cc}`;
    const listeners = this.listeners.get(key);
    
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error('Error in MIDI sync callback:', error);
        }
      });
    }
  }
}

// Create a singleton instance
export const midiSync = new MidiSync();
