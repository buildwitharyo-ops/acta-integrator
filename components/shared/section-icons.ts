import {
  MeetingRoomIcon,
  PresentationPodiumIcon,
  LayoutTwoColumnIcon,
  Megaphone01Icon,
  Presentation01Icon,
  Building06Icon,
  Mic01Icon,
  FootballPitchIcon,
  Tv01Icon,
  Speaker01Icon,
  ConferenceIcon,
  DashboardSquare01Icon,
  Presentation02Icon,
  Router01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export const SOLUTION_ICONS: Record<string, IconSvgElement> = {
  "smart-meeting-room": MeetingRoomIcon,
  "auditorium-performance-hall": PresentationPodiumIcon,
  "divisible-room-multipurpose-hall": LayoutTwoColumnIcon,
  "pa-commercial-sound-system": Megaphone01Icon,
  "smart-classroom-training-room": Presentation01Icon,
  "house-of-worship": Building06Icon,
  "broadcast-podcast-studio": Mic01Icon,
  "sports-entertainment-venue": FootballPitchIcon,
};

export const CATEGORY_ICONS: Record<string, IconSvgElement> = {
  display: Tv01Icon,
  audio: Speaker01Icon,
  "conferencing-collaboration": ConferenceIcon,
  "control-system": DashboardSquare01Icon,
  "digital-signage": Presentation02Icon,
  "infrastructure-networking": Router01Icon,
};

export const solutionIcon = (slug: string | null | undefined): IconSvgElement =>
  (slug && SOLUTION_ICONS[slug]) || MeetingRoomIcon;

export const categoryIcon = (slug: string | null | undefined): IconSvgElement =>
  (slug && CATEGORY_ICONS[slug]) || Tv01Icon;
