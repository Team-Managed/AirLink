import type { AgentStream } from "@airlink/protocol";

/**
 * RingBuffer
 * In-memory true circular ring buffer for real-time agent stream events.
 * Bounded strictly to maxCapacity (default 500 items) to guarantee zero disk bloat.
 * Governed by monotonic integer sequence IDs (seqId: 1..N) to resolve mobile reconnection drops.
 * Employs O(1) circular head/tail indexing with zero array reallocation or shift overhead.
 */
export class RingBuffer {
  private readonly _capacity: number;
  private readonly _buffer: (AgentStream | undefined)[];
  private _head: number = 0; // Index of oldest element
  private _tail: number = 0; // Index for next insertion
  private _size: number = 0;
  private _currentSeq: number = 0;

  constructor(maxCapacity: number = 500) {
    if (!Number.isSafeInteger(maxCapacity) || maxCapacity <= 0) {
      throw new Error("RingBuffer capacity must be a positive integer");
    }
    this._capacity = maxCapacity;
    this._buffer = new Array<AgentStream | undefined>(maxCapacity);
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
    return this._size;
  }

  /**
   * Highest sequence ID emitted so far (0 if empty).
   */
  get latestSeq(): number {
    return this._currentSeq;
  }

  /**
   * Appends an event to the buffer in O(1) time, automatically assigning the next monotonic sequence ID.
   * If capacity is reached, the oldest element is overwritten and the head pointer advances in O(1).
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

    if (this._size === this._capacity) {
      // Overwrite oldest item at head and advance head
      this._buffer[this._head] = streamEvent;
      this._head = (this._head + 1) % this._capacity;
      this._tail = this._head;
    } else {
      this._buffer[this._tail] = streamEvent;
      this._tail = (this._tail + 1) % this._capacity;
      this._size += 1;
    }

    return streamEvent;
  }

  /**
   * Retrieves all events currently retained in the buffer where seqId > lastSeenSeq.
   * Used for fast catch-up bursts when reconnecting after network drops.
   */
  getEventsSince(lastSeenSeq: number): AgentStream[] {
    if (this._size === 0 || lastSeenSeq >= this._currentSeq) {
      return [];
    }

    return this.getAllEvents().filter((e) => e.seqId > lastSeenSeq);
  }

  /**
   * Returns an array of all events currently stored in memory in chronological order.
   */
  getAllEvents(): AgentStream[] {
    const result: AgentStream[] = new Array(this._size);
    for (let i = 0; i < this._size; i++) {
      const idx = (this._head + i) % this._capacity;
      result[i] = this._buffer[idx]!;
    }
    return result;
  }

  /**
   * Clears all buffered events while preserving the session's monotonic sequence counter.
   */
  clear(): void {
    this._buffer.fill(undefined);
    this._head = 0;
    this._tail = 0;
    this._size = 0;
  }

  /**
   * Resets the entire buffer including the sequence counter (for new session lifecycle).
   */
  reset(): void {
    this.clear();
    this._currentSeq = 0;
  }
}

export { RingBuffer as EventRingBuffer };
