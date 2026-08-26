import type { AgentStream } from "@agent-remote/protocol";

/**
 * RingBuffer
 * In-memory circular buffer for real-time agent stream events.
 * Bounded strictly to maxCapacity (default 500 items) to guarantee zero disk bloat.
 * Governed by monotonic integer sequence IDs (seqId: 1..N) to resolve mobile reconnection drops.
 */
export class RingBuffer {
  private readonly _capacity: number;
  private _events: AgentStream[] = [];
  private _currentSeq: number = 0;

  constructor(maxCapacity: number = 500) {
    if (maxCapacity <= 0) {
      throw new Error("RingBuffer capacity must be a positive integer");
    }
    this._capacity = maxCapacity;
  }

  /**
   * Maximum capacity of the ring buffer.
   */
  get capacity(): number {
    return this._capacity;
  }

  /**
   * Number of items currently retained in memory.
   */
  get size(): number {
    return this._events.length;
  }

  /**
   * Highest sequence ID emitted so far (0 if empty).
   */
  get latestSeq(): number {
    return this._currentSeq;
  }

  /**
   * Appends an event to the buffer, automatically assigning the next monotonic sequence ID.
   * If capacity is exceeded, the oldest item is evicted in FIFO order.
   */
  push(event: Omit<AgentStream, "seqId"> | AgentStream): AgentStream {
    this._currentSeq += 1;
    const seqId = this._currentSeq;

    const streamEvent: AgentStream = {
      sessionId: event.sessionId,
      turnId: event.turnId,
      type: event.type,
      content: event.content,
      seqId,
      timestamp: event.timestamp !== undefined ? event.timestamp : Date.now(),
      ...(event.metadata !== undefined ? { metadata: event.metadata } : {}),
    };

    this._events.push(streamEvent);

    if (this._events.length > this._capacity) {
      this._events.shift();
    }

    return streamEvent;
  }

  /**
   * Retrieves all events currently retained in the buffer where seqId > lastSeenSeq.
   * Used for fast catch-up bursts when reconnecting after network drops.
   */
  getEventsSince(lastSeenSeq: number): AgentStream[] {
    if (this._events.length === 0 || lastSeenSeq >= this._currentSeq) {
      return [];
    }

    return this._events.filter((e) => e.seqId > lastSeenSeq);
  }

  /**
   * Returns a shallow copy of all events currently stored in memory.
   */
  getAllEvents(): AgentStream[] {
    return [...this._events];
  }

  /**
   * Clears all buffered events and resets sequence counters.
   */
  clear(): void {
    this._events = [];
    this._currentSeq = 0;
  }
}
