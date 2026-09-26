import type { ComponentType, SVGProps } from "react";
import {
  ChatBubbleBottomCenterTextIcon,
  DocumentTextIcon,
  H1Icon,
  H2Icon,
  H3Icon,
  ListBulletIcon,
  NumberedListIcon,
} from "@heroicons/react/24/outline";
import type { PageBlockType } from "@/materials/model/pageEditor";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export const BLOCK_LABELS: Record<PageBlockType, string> = {
  paragraph: "Text",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  quote: "Quote",
  ul: "Bulleted list",
  ol: "Numbered list",
};

export const BLOCK_ICONS: Record<PageBlockType, Icon> = {
  paragraph: DocumentTextIcon,
  h1: H1Icon,
  h2: H2Icon,
  h3: H3Icon,
  quote: ChatBubbleBottomCenterTextIcon,
  ul: ListBulletIcon,
  ol: NumberedListIcon,
};

export const BLOCK_TYPES: PageBlockType[] = [
  "paragraph",
  "h1",
  "h2",
  "h3",
  "quote",
  "ul",
  "ol",
];
