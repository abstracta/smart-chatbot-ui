import { ApiError, ApiErrorBody, ErrorResponseCode } from '@/types/error';

export class OpenAiError extends ApiError {
  type?: string;
  param?: string;
  statusCode?: string;

  constructor(message: string, code?: string, type?: string, param?: string) {
    super(message);
    this.name = 'LlmApiError';
    this.type = type;
    this.param = param;
    this.statusCode = code;
  }

  getApiError(): ApiErrorBody {
    let errorCode: ErrorResponseCode;
    switch (this.statusCode) {
      case "429":
        errorCode = ErrorResponseCode.LLM_RATE_LIMIT_REACHED;
        break;
      case "503":
        errorCode = ErrorResponseCode.LLM_SERVICE_OVERLOADED;
        break;
      default:
        errorCode = ErrorResponseCode.ERROR_DEFAULT;
        break;
    }
    return { error: { code: errorCode, message: this.message } };
  }
}
