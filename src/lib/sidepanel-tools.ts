import {
  Gamepad2,
  Calculator,
  Link as LinkIcon,
  Cpu,
  Tag,
  LucideIcon,
} from "lucide-react";

export type SidepanelToolId =
  | "controller-testing"
  | "top-offers"
  | "quick-links"
  | "pc-cost-breakdown"
  | "ebay-sold-tool";

export interface SidepanelToolMetadata {
  id: SidepanelToolId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const SIDEPANEL_TOOLS: SidepanelToolMetadata[] = [
  {
    id: "controller-testing",
    label: "Controller",
    description: "Open controller testing in the sidepanel",
    icon: Gamepad2,
  },
  {
    id: "top-offers",
    label: "Top Offers",
    description: "Open top offers in the sidepanel",
    icon: Calculator,
  },
  {
    id: "quick-links",
    label: "Quick Links",
    description: "Open quick links in the sidepanel",
    icon: LinkIcon,
  },
  {
    id: "pc-cost-breakdown",
    label: "Cost Breakdown",
    description: "Open cost breakdown in the sidepanel",
    icon: Cpu,
  },
  {
    id: "ebay-sold-tool",
    label: "eBay Sold",
    description: "Open eBay sold listings tool in the sidepanel",
    icon: Tag,
  },
];

export function getToolById(id: SidepanelToolId): SidepanelToolMetadata | undefined {
  return SIDEPANEL_TOOLS.find((tool) => tool.id === id);
}

export function getToolLabel(id: SidepanelToolId): string {
  return getToolById(id)?.label || id;
}

