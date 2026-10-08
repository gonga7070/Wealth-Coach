import * as Icons from "lucide-react";

export function Icon({ name, ...props }) {
  const Cmp = Icons[name] || Icons.Circle;
  return <Cmp {...props} />;
}
