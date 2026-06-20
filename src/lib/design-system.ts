import { cva } from "class-variance-authority";

export const pageShellClass =
  "relative min-h-screen w-full min-w-0 overflow-x-clip bg-[#e9e5d8] text-[#1a1b12]";

export const appShellClass =
  "mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 px-4 pb-28 pt-5 sm:px-6 lg:px-8";

export const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center rounded-[10px] px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c7f94b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9e5d8] disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      intent: {
        primary: "bg-[#16170f] text-[#c7f94b] hover:bg-[#2a2b20]",
        secondary:
          "border border-[#d8d3c2] bg-[#fcfbf6] text-[#1a1b12] hover:bg-[#f1eee2]",
        quiet: "text-[#56564a] hover:bg-[#f1eee2] hover:text-[#1a1b12]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
      },
    },
    defaultVariants: {
      intent: "primary",
      size: "md",
    },
  },
);

export const inputVariants = cva(
  "rounded-[10px] border border-[#e0dbca] bg-[#fcfbf6] text-sm text-[#1a1b12] outline-none transition placeholder:text-[#a8a593] focus:border-[#16170f] focus:ring-2 focus:ring-[#eef9d4] disabled:cursor-not-allowed disabled:bg-[#f1eee2] disabled:text-[#8a8775]",
  {
    variants: {
      size: {
        sm: "h-8 px-2",
        md: "h-10 px-3",
      },
      width: {
        auto: "w-auto",
        full: "w-full",
      },
    },
    defaultVariants: {
      size: "md",
      width: "full",
    },
  },
);

export const selectVariants = cva(
  "rounded-[10px] border border-[#e0dbca] bg-[#fcfbf6] text-sm text-[#1a1b12] outline-none transition focus:border-[#16170f] focus:ring-2 focus:ring-[#eef9d4] disabled:cursor-not-allowed disabled:bg-[#f1eee2] disabled:text-[#8a8775]",
  {
    variants: {
      size: {
        sm: "h-8 px-2",
        md: "h-10 px-3",
      },
      width: {
        auto: "w-auto",
        full: "w-full",
      },
    },
    defaultVariants: {
      size: "md",
      width: "full",
    },
  },
);

export const dashboardTabListClass =
  "flex w-full max-w-full flex-wrap rounded-[14px] border border-[#d8d3c2] bg-[#fbf9f1] p-1 xl:inline-flex xl:w-auto";

export const dashboardTabVariants = cva(
  "inline-flex h-10 flex-none items-center justify-center whitespace-nowrap rounded-[10px] px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c7f94b] focus-visible:ring-offset-2 sm:min-w-28",
  {
    variants: {
      active: {
        true: "bg-[#c7f94b] text-[#16170f]",
        false: "text-[#8a8775] hover:bg-[#f1eee2] hover:text-[#1a1b12]",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export const panelVariants = cva(
  "min-w-0 rounded-[18px] border border-[#e6e2d4] bg-white shadow-[0_1px_3px_rgba(26,27,18,0.05)]",
  {
    variants: {
      padding: {
        none: "",
        sm: "p-3",
        md: "p-4",
      },
    },
    defaultVariants: {
      padding: "none",
    },
  },
);

export const statCardVariants = cva(
  "min-h-[92px] min-w-0 rounded-[16px] border border-[#e6e2d4] bg-white p-4 shadow-[0_1px_3px_rgba(26,27,18,0.05)]",
);

export const sectionHeaderClass = "border-b border-[#eee9da] px-5 py-4";

export const sectionTitleClass =
  "font-display text-base font-bold text-[#1a1b12]";

export const sectionDescriptionClass = "mt-1 text-sm text-[#8a8775]";

export const inputClass = inputVariants();

export const selectClass = selectVariants();

export const compactSelectClass = selectVariants({
  size: "sm",
  width: "auto",
});
