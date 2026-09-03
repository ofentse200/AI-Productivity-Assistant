import {
  Bot,
  CalendarClock,
  LayoutDashboard,
  Mail,
  NotebookPen,
  Search,
  Settings,
} from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: typeof Mail;
  blurb: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
    blurb: "Your workspace overview",
  },
  {
    label: "Smart Email Generator",
    to: "/email",
    icon: Mail,
    blurb: "Draft professional email from your key points",
  },
  {
    label: "Meeting Notes Summarizer",
    to: "/meetings",
    icon: NotebookPen,
    blurb: "Turn raw notes into decisions and action items",
  },
  {
    label: "AI Task Planner",
    to: "/planner",
    icon: CalendarClock,
    blurb: "Prioritise tasks into a realistic schedule",
  },
  {
    label: "AI Research Assistant",
    to: "/research",
    icon: Search,
    blurb: "Structured briefings with verification prompts",
  },
  {
    label: "AI Workplace Chatbot",
    to: "/chat",
    icon: Bot,
    blurb: "Ask anything about your working day",
  },
  {
    label: "Settings",
    to: "/settings",
    icon: Settings,
    blurb: "Profile, security and AI preferences",
  },
];

export const FEATURE_ITEMS = NAV_ITEMS.filter(
  (item) => item.to !== "/dashboard" && item.to !== "/settings",
);
