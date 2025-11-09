export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

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

export const generateUniqueId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const formatDateRange = (startDate: Date, endDate: Date): string =>
  `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

export const safeJsonParse = (text: string): any => {
  try {
    const cleanedResponse = text
      .trim()
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
      .replace(/,\s*([\]}])/g, "$1")
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');

    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("JSON Parse Error:", error);
    throw error;
  }
};

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

export const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;
