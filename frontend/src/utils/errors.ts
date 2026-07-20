import axios from "axios";

interface ApiErrorBody {
  error?: {
    message?: string;
    details?: Array<{
      field?: string;
      message?: string;
    }>;
  };
  message?: string;
}

export const getErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return "Unable to reach EventPass. Check your connection and try again.";
    }
    const apiError = error.response.data?.error;
    const detail = apiError?.details?.[0];
    if (detail?.message) {
      return detail.field ? `${detail.field}: ${detail.message}` : detail.message;
    }
    return apiError?.message ?? error.response.data?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
};
