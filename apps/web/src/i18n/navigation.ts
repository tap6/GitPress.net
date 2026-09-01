import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

const navigation = createNavigation(routing);

export const { Link, usePathname, useRouter, getPathname } = navigation;

/** Function declaration so TypeScript treats this as `never` after the call. */
export function redirect(
  args: Parameters<typeof navigation.redirect>[0],
  type?: Parameters<typeof navigation.redirect>[1],
): never {
  return navigation.redirect(args, type);
}
