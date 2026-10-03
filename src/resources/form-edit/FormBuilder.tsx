import { FormBuilderView } from "./components/FormBuilderView";
import { useFormBuilder } from "./hooks/useFormBuilder";

export function FormBuilder({ itemId }: { itemId: number }) {
  const builder = useFormBuilder(itemId);
  return <FormBuilderView builder={builder} />;
}
