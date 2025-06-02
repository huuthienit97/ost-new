import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";

// Add comprehensive error handling
window.addEventListener('unhandledrejection', (event) => {
  // Silently handle authentication errors
  if (event.reason && typeof event.reason === 'object' && 
      (event.reason.message?.includes('401') || event.reason.message?.includes('Unauthorized'))) {
    event.preventDefault();
    return;
  }
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
