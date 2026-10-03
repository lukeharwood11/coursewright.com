import { FormFillView } from "./components/FormFillView";
import { useFormFill } from "./hooks/useFormFill";

export function FormFill(props: {
  organizationId: number;
  itemId: number;
  published: boolean;
  canEdit: boolean;
  userId: string;
}) {
  const fill = useFormFill(props);
  return <FormFillView fill={fill} />;
}
