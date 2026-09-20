import { toast } from "sonner";

/** Placeholder for actions whose screens are not built yet. */
export function toastNotImplemented(action: string) {
  toast(`${action} isn’t ready yet.`);
}

export function toastSomethingWentWrong() {
  toast("Something went wrong.");
}
