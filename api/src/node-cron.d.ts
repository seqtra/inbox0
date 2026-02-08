/**
 * Type declarations for node-cron (avoids requiring @types/node-cron in API build).
 */
declare module 'node-cron' {
  export interface ScheduledTask {
    start(): void;
    stop(): void;
    destroy(): void;
  }

  interface CronApi {
    schedule(
      expression: string,
      callback: () => void,
      options?: { scheduled?: boolean; timezone?: string }
    ): ScheduledTask;
  }

  const cron: CronApi;
  export default cron;
}
