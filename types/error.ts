export enum ErrorResponseCode {
  LLM_RATE_LIMIT_REACHED = "llmRateLimitReached",
  LLM_SERVICE_OVERLOADED = "llmServiceOverloaded",
  USER_USAGE_LIMIT_REACHED = "userUsageLimitReached",
  MODEL_USAGE_LIMIT_REACHED = "modelUsageLimitReached",
  ERROR_DEFAULT = "errorDefault"
}

export interface ApiErrorBody {
  error: {
    code?: ErrorResponseCode;
    message?: string;
  } | string;
}

export class ApiError extends Error {
  code?: ErrorResponseCode

  constructor({ message, code }: { message?: string, code?: ErrorResponseCode | undefined }) {
    super(message);
    this.code = code;
  }

  getApiError(): ApiErrorBody {
    return { error: { code: this.code, message: this.message } };
  }
}
