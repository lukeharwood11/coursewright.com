import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { queryClient } from "@/infrastructure/query-client";
import { initPostHog } from "@/infrastructure/posthog/client";
import { AppRoutes } from "@/app/router";

export function App() {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
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
