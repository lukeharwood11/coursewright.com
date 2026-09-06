import { useOutletContext } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

export type AuthedOutletContext = {
  user: User;
};

export function useAuthedUser() {
  return useOutletContext<AuthedOutletContext>().user;
}
