"use client";

import { cn } from "../../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Toggle = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <button
    className={cn(toggleVariants({ variant, size, className }))}
    ref={ref}
    {...props}
  />
));
Toggle.displayName = "Toggle";

export { Toggle, toggleVariants };

// Simple Tabs component using React state directly
const TabsComponent = ({
  defaultValue = "axes",
  children,
  className,
}: {
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  return (
    <div className={className}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            activeTab,
            onTabChange: setActiveTab,
          });
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({
  children,
  activeTab,
  onTabChange,
  className,
}: {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (value: string) => void;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isActive: child.props.value === activeTab,
            onClick: () => onTabChange?.(child.props.value),
          });
        }
        return child;
      })}
    </div>
  );
};

const TabsTrigger = ({
  value,
  children,
  isActive,
  onClick,
  className,
}: {
  value: string;
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "hover:bg-muted/50",
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const TabsContent = ({
  value,
  children,
  activeTab,
  className,
}: {
  value: string;
  children: React.ReactNode;
  activeTab?: string;
  className?: string;
}) => {
  if (activeTab !== value) return null;

  return <div className={className}>{children}</div>;
};

export {
  TabsComponent as Tabs,
  TabsComponent,
  TabsContent,
  TabsList,
  TabsTrigger,
};
