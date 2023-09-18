export enum ErrorResponseCode {
  OPENAI_RATE_LIMIT_REACHED = "openAIRateLimitReached",
  OPENAI_SERVICE_OVERLOADED = "openAIServiceOverloaded",
  ERROR_DEFAULT = "errorDefault"
}
export interface ApiErrorBody {
  error: {
    code: ErrorResponseCode;
    message?: string;
  } | string;
}

export abstract class ApiError extends Error {
  abstract getApiError(): ApiErrorBody;
}
