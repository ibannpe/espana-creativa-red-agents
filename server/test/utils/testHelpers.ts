// ABOUTME: Common test helper functions and utilities
// ABOUTME: Provides UUID generation, date manipulation, and test data helpers

import { randomUUID } from 'crypto'

/**
 * Generates a valid UUID v4 for testing
 */
export function generateTestId(): string {
  return randomUUID()
}

/**
 * Creates a valid test UUID with optional prefix for readability
 */
export function createTestUUID(prefix?: string): string {
  const uuid = generateTestId()
  return prefix ? `${prefix}-${uuid}` : uuid
}

/**
 * Creates a date offset from now by specified milliseconds
 */
export function dateFromNow(offsetMs: number): Date {
  return new Date(Date.now() + offsetMs)
}

/**
 * Creates a date in the past
 */
export function dateBefore(ms: number): Date {
  return dateFromNow(-ms)
}

/**
 * Creates a date in the future
 */
export function dateAfter(ms: number): Date {
  return dateFromNow(ms)
}

/**
 * Sleeps for specified milliseconds (use sparingly in tests)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Waits for a condition to be true with timeout
 */
export async function waitFor(
  condition: () => boolean,
  timeoutMs: number = 1000,
  intervalMs: number = 50
): Promise<void> {
  const startTime = Date.now()

  while (!condition()) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error('waitFor timeout exceeded')
    }
    await sleep(intervalMs)
  }
}

/**
 * Creates a deterministic test email based on index
 */
export function createTestEmail(index: number = 1): string {
  return `test${index}@example.com`
}

/**
 * Creates a deterministic test name
 */
export function createTestName(index: number = 1): string {
  return `Test User ${index}`
}

/**
 * Asserts that an error was thrown with expected message
 */
export function assertThrows(fn: () => void, expectedMessage: string): void {
  try {
    fn()
    throw new Error('Expected function to throw but it did not')
  } catch (error: any) {
    if (error.message === 'Expected function to throw but it did not') {
      throw error
    }
    if (!error.message.includes(expectedMessage)) {
      throw new Error(
        `Expected error message to include "${expectedMessage}" but got "${error.message}"`
      )
    }
  }
}

/**
 * Asserts that an async function throws with expected message
 */
export async function assertAsyncThrows(
  fn: () => Promise<void>,
  expectedMessage: string
): Promise<void> {
  try {
    await fn()
    throw new Error('Expected function to throw but it did not')
  } catch (error: any) {
    if (error.message === 'Expected function to throw but it did not') {
      throw error
    }
    if (!error.message.includes(expectedMessage)) {
      throw new Error(
        `Expected error message to include "${expectedMessage}" but got "${error.message}"`
      )
    }
  }
}
