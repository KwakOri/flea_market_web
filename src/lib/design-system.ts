import { cva } from "class-variance-authority";

export const pageShellClass =
  "min-h-screen overflow-x-hidden bg-zinc-50 text-zinc-950";

export const appShellClass =
  "flex w-full max-w-none flex-col gap-5 px-4 py-5 sm:px-6";

export const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      intent: {
        primary: "bg-zinc-950 text-white hover:bg-zinc-800",
        secondary:
          "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50",
        quiet: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
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
  "rounded-md border border-zinc-300 bg-white text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500",
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
  "rounded-md border border-zinc-300 bg-white text-sm text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500",
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
  "flex w-full overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-100 p-1 sm:inline-flex sm:w-auto";

export const dashboardTabVariants = cva(
  "inline-flex h-10 flex-none items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 sm:min-w-28",
  {
    variants: {
      active: {
        true: "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200",
        false: "text-zinc-500 hover:bg-white/70 hover:text-zinc-950",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export const panelVariants = cva(
  "rounded-lg border border-zinc-200 bg-white shadow-sm",
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
  "min-h-[92px] rounded-lg border border-zinc-200 bg-white p-4 shadow-sm",
);

export const sectionHeaderClass = "border-b border-zinc-200 px-4 py-3";

export const sectionTitleClass = "text-base font-semibold text-zinc-950";

export const sectionDescriptionClass = "mt-1 text-sm text-zinc-500";

export const inputClass = inputVariants();

export const selectClass = selectVariants();

export const compactSelectClass = selectVariants({
  size: "sm",
  width: "auto",
});
