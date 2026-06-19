"use client";

import { useTheme } from "next-themes";
import { ToastContainer } from "react-toastify";

export function ToastifyWrapper() {
  const { theme } = useTheme();

  return (
    <ToastContainer
      position="top-center"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme === "dark" ? "dark" : "light"}
      className="!mt-14 sm:!mt-16 !p-4 sm:!p-0"
      toastClassName="!rounded-2xl !font-sans !shadow-xl !mb-3 !min-h-16 !bg-card !text-card-foreground !overflow-hidden"
    />
  );
}
