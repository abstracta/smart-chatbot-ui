import { ApiError, ApiErrorBody, } from "@/types/error";

export function getErrorResponseBody(error: any): ApiErrorBody {
    if (error instanceof ApiError) {
        return (error as ApiError).getApiError();
    } else {
        return { error: error instanceof Error ? error.message : 'Error' };
    }
}
