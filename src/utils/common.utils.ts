/**
 * Returns a promise that resolves after the specified time
 * @param ms Time to wait in milliseconds
 */
export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Gets the appropriate greeting based on the time of day
 * @param name Name to include in the greeting
 */
export const getGreeting = (name: string): string => {
  const currentHour = new Date().getHours();
  const firstName = name?.split(" ")[0] || "there";

  if (currentHour < 12) {
    return `Morning, ${firstName} ☀️`;
  } else if (currentHour < 18) {
    return `Afternoon, ${firstName} 🌤️`;
  } else {
    return `Evening, ${firstName} 🌙`;
  }
};

/**
 * Generates a unique ID with a timestamp and random string
 */
export const generateUniqueId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Formats a date range into a readable string
 * @param startDate Start date of the range
 * @param endDate End date of the range
 */
export const formatDateRange = (startDate: Date, endDate: Date): string =>
  `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

/**
 * Safely parses JSON with improved error handling
 * @param text Text to parse as JSON
 */
export const safeJsonParse = (text: string): any => {
  try {
    const cleanedResponse = text
      .trim()
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
      .replace(/,\s*([\]}])/g, "$1") // Remove trailing commas
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); // Ensure all keys are quoted

    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("JSON Parse Error:", error);
    throw error;
  }
};

/**
 * Retries a function with exponential backoff
 * @param fn Function to retry
 * @param maxAttempts Maximum number of attempts
 * @param baseDelay Base delay in milliseconds
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 2000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxAttempts) break;

      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await wait(delay);
    }
  }

  throw lastError!;
};

/**
 * Checks if a value is not null or undefined
 * @param value Value to check
 */
export const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;
