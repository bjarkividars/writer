"use client";

import { forwardRef } from "react";
import { Menu as BaseMenu } from "@base-ui/react";

const menuPopupBaseClasses =
  "origin-[var(--transform-origin)] rounded-md border border-border bg-background p-1 text-foreground shadow-sm transition-[transform,scale,opacity] duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0";

const mergeClasses = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(" ");

type MenuPopupProps = Omit<
  React.ComponentPropsWithoutRef<typeof BaseMenu.Popup>,
  "className"
> & {
  className?: string;
};

const MenuPopup = forwardRef<
  React.ComponentRef<typeof BaseMenu.Popup>,
  MenuPopupProps
>(({ className, ...props }, ref) => (
  <BaseMenu.Popup
    ref={ref}
    className={mergeClasses(menuPopupBaseClasses, className)}
    {...props}
  />
));

MenuPopup.displayName = "MenuPopup";

export const Menu = {
  Root: BaseMenu.Root,
  Trigger: BaseMenu.Trigger,
  Portal: BaseMenu.Portal,
  Positioner: BaseMenu.Positioner,
  Popup: MenuPopup,
  Item: BaseMenu.Item,
  Separator: BaseMenu.Separator,
  RadioGroup: BaseMenu.RadioGroup,
  RadioItem: BaseMenu.RadioItem,
};
