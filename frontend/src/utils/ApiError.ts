export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: any;
  public isNetworkError: boolean;

  constructor(
    message: string,
    status: number = 500,
    code: string = 'API_ERROR',
    details?: any,
    isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.isNetworkError = isNetworkError;

    // Maintain prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Format raw detail (string, array of validation errors, object) into a human-readable message.
 */
export function formatApiDetailMessage(detail: any, fallbackMessage: string = 'An unexpected error occurred'): string {
  if (!detail) return fallbackMessage;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    const errorLines = detail.map((err: any) => {
      if (typeof err === 'string') return err;
      if (err && typeof err === 'object') {
        const locArr = Array.isArray(err.loc) ? err.loc : [];
        const fieldLoc = locArr.filter((l: any) => l !== 'body' && l !== 'query' && l !== 'path').join('.');
        let msg = err.msg || 'Invalid value';
        if (msg.startsWith('Value error, ')) {
          msg = msg.replace('Value error, ', '');
        }
        return fieldLoc ? `${fieldLoc}: ${msg}` : msg;
      }
      return String(err);
    });
    return errorLines.join('\n');
  }

  if (typeof detail === 'object') {
    return detail.message || detail.msg || JSON.stringify(detail);
  }

  return String(detail);
}

/**
 * Parse any caught error (AxiosError, Fetch Response error, Error, or unknown) into a structured ApiError.
 */
export function parseApiError(error: any, fallbackMessage: string = 'API Request Failed'): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  // Axios or HTTP Response error object
  if (error?.response) {
    const status = error.response.status || 500;
    const data = error.response.data;
    const detail = data?.detail ?? data?.message ?? data;
    const message = formatApiDetailMessage(detail, fallbackMessage);
    const code = data?.code || `HTTP_${status}`;
    return new ApiError(message, status, code, detail, false);
  }

  // Network or Connection Error
  if (error?.request && !error?.response) {
    return new ApiError(
      'Network connection failed. Please check your connection and try again.',
      0,
      'NETWORK_ERROR',
      null,
      true
    );
  }

  // Generic Error instance
  if (error instanceof Error) {
    return new ApiError(error.message || fallbackMessage, 500, 'UNKNOWN_ERROR', error, false);
  }

  return new ApiError(fallbackMessage, 500, 'UNKNOWN_ERROR', error, false);
}
