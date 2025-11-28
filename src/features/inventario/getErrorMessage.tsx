import axios from "axios";

type ServerErr = { message?: string; error?: string };

export function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;

  if (axios.isAxiosError<ServerErr>(err)) {
    const data = err.response?.data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (typeof err.message === "string") return err.message;
  }

  if (err instanceof Error && typeof err.message === "string") return err.message;
  return "Ocurrió un error.";
}
