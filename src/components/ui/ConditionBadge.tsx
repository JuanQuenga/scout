"use client";

import {
  extractCondition,
  getConditionColors,
  getConditionBadgeClasses,
} from "@/app/utils/conditionExtractor";

interface ConditionBadgeProps {
  descriptionHtml?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showCondition?: boolean;
  variant?: "default" | "outline" | "solid";
}

/**
 * ConditionBadge component that extracts and displays product condition
 * @param descriptionHtml - The HTML description string
 * @param size - The size variant for the badge
 * @param className - Additional CSS classes
 * @param showCondition - Whether to show the condition text (default: true)
 * @param variant - The visual variant of the badge
 * @returns JSX for the condition badge or null if no condition found
 */
export function ConditionBadge({
  descriptionHtml,
  size = "md",
  className = "",
  showCondition = true,
  variant = "default",
}: ConditionBadgeProps) {
  if (!descriptionHtml) return null;

  const condition = extractCondition(descriptionHtml);
  if (!condition) return null;

  const colors = getConditionColors(condition);
  const baseClasses = getConditionBadgeClasses(size);
  
  let variantClasses = "";
  switch (variant) {
    case "outline":
      variantClasses = `border-2 ${colors.border} ${colors.text}`;
      break;
    case "solid":
      variantClasses = `${colors.bg} ${colors.text} border ${colors.border}`;
      break;
    default:
      variantClasses = `${colors.bg} ${colors.text} border ${colors.border}`;
      break;
  }

  const allClasses = `${baseClasses} ${variantClasses} ${className}`.trim();

  return <span className={allClasses}>{condition}</span>;
}

export default ConditionBadge;
