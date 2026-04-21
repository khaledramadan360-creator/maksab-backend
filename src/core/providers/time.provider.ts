/**
 * TimeProvider is responsible for supplying the current time.
 * This abstraction allows easy time-travel testing and ensures consistency.
 */
export interface TimeProvider {
  /**
   * Returns the current date and time in UTC.
   */
  now(): Date;

  /**
   * Returns a new Date shifted by the given offset in milliseconds.
   */
  nowPlusMilliseconds(ms: number): Date;

  /**
   * Returns a new Date shifted by the given offset in days.
   */
  nowPlusDays(days: number): Date;
}

export class SystemTimeProvider implements TimeProvider {
  now(): Date {
    return new Date();
  }

  nowPlusMilliseconds(ms: number): Date {
    return new Date(Date.now() + ms);
  }

  nowPlusDays(days: number): Date {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
}
