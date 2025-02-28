type SyncCallback = (value: number) => void;

interface SyncKey {
  channel: number;
  cc: number;
}

class MidiSync {
  private subscribers: Map<string, Set<SyncCallback>> = new Map();

  private getKey(channel: number, cc: number): string {
    return `${channel}-${cc}`;
  }

  subscribe(channel: number, cc: number, callback: SyncCallback): () => void {
    const key = this.getKey(channel, cc);
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)?.add(callback);
    
    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }

  notify(channel: number, cc: number, value: number, excludeCallback?: SyncCallback) {
    const key = this.getKey(channel, cc);
    this.subscribers.get(key)?.forEach(callback => {
      if (callback !== excludeCallback) {
        callback(value);
      }
    });
  }
}

export const midiSync = new MidiSync();
