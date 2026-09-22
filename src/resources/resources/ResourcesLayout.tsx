import { Outlet, useOutletContext } from "react-router-dom";
import type { AuthedOutletContext } from "@/auth/hooks/useAuthedUser";
import { ResourceUploadPanel } from "./components/ResourceUploadPanel";
import { useResourceUploadProcessor } from "./hooks/useResourceUploadProcessor";

export function ResourcesLayout() {
  const auth = useOutletContext<AuthedOutletContext>();
  useResourceUploadProcessor();
  return (
    <>
      <Outlet context={auth} />
      <ResourceUploadPanel />
    </>
  );
}
