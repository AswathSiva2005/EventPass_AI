import axios from "axios";

interface ApiErrorBody {
  error?: {
    message?: string;
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
    return error.response.data?.error?.message ?? error.response.data?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
};
