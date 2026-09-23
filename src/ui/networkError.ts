/** True when a failure is (or looks like) a connectivity / fetch problem. */
export function isNetworkError(error: unknown): boolean {
  if (typeof error === "string") {
    return messageLooksLikeNetwork(error);
  }
  if (error instanceof Error) {
    if (error.name === "NetworkError") return true;
    if (error.name === "TypeError" && messageLooksLikeNetwork(error.message)) {
      return true;
    }
    return messageLooksLikeNetwork(error.message);
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string") return messageLooksLikeNetwork(message);
  }
  return false;
}

function messageLooksLikeNetwork(raw: string): boolean {
  const text = raw.trim().toLowerCase();
  if (!text) return false;
  return (
    text.includes("failed to fetch") ||
    text.includes("fetch failed") ||
    text.includes("network request failed") ||
    text.includes("networkerror") ||
    text.includes("network error") ||
    text.includes("load failed") ||
    text.includes("net::err_") ||
    text.includes("err_internet_disconnected") ||
    text.includes("err_connection_") ||
    text.includes("err_name_not_resolved") ||
    text.includes("err_timed_out") ||
    text.includes("the internet connection appears to be offline") ||
    text.includes("a network error occurred")
  );
}
