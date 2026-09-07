import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AppErrorBoundary } from "@/app/error/AppErrorBoundary";
import { AppRoutes } from "@/app/router";
import { initPostHog } from "@/infrastructure/posthog/client";
import { queryClient } from "@/infrastructure/query-client";

// Sync init so the first route (and error reports) can capture immediately.
initPostHog();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppErrorBoundary>
          <AppRoutes />
        </AppErrorBoundary>
        <Toaster
          position="top-center"
          closeButton
          toastOptions={{
            className: "cw-toast",
            duration: 3500,
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
