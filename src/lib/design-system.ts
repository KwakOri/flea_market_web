import { cva } from "class-variance-authority";

export const pageShellClass =
  "relative min-h-screen w-full min-w-0 overflow-x-clip bg-canvas text-ink";

export const appShellClass =
  "mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 px-4 pb-28 pt-5 sm:px-6 lg:px-8";

export const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center rounded-[10px] px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      intent: {
        primary: "bg-brand text-on-brand hover:bg-brand-hover",
        secondary:
          "border border-border bg-surface text-ink hover:bg-canvas-soft",
        quiet: "text-body hover:bg-canvas-soft hover:text-ink",
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
  "rounded-[10px] border border-border bg-surface text-sm text-ink outline-none transition placeholder:text-muted-soft focus:border-ink focus:ring-2 focus:ring-brand-tint disabled:cursor-not-allowed disabled:bg-canvas-soft disabled:text-muted",
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
  "rounded-[10px] border border-border bg-surface text-sm text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-brand-tint disabled:cursor-not-allowed disabled:bg-canvas-soft disabled:text-muted",
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
  "flex w-full max-w-full flex-wrap rounded-[14px] border border-border bg-surface p-1 xl:inline-flex xl:w-auto";

export const dashboardTabVariants = cva(
  "inline-flex h-10 flex-none items-center justify-center whitespace-nowrap rounded-[10px] px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:min-w-28",
  {
    variants: {
      active: {
        true: "bg-brand text-on-brand",
        false: "text-muted hover:bg-canvas-soft hover:text-ink",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export const panelVariants = cva(
  "min-w-0 rounded-[18px] border border-hairline bg-surface shadow-[0_1px_3px_rgba(26,27,18,0.05)]",
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
  "min-h-[92px] min-w-0 rounded-[16px] border border-hairline bg-surface p-4 shadow-[0_1px_3px_rgba(26,27,18,0.05)]",
);

export const sectionHeaderClass = "border-b border-hairline px-5 py-4";

export const sectionTitleClass = "font-display text-base font-bold text-ink";

export const sectionDescriptionClass = "mt-1 text-sm text-muted";

export const inputClass = inputVariants();

export const selectClass = selectVariants();

export const compactSelectClass = selectVariants({
  size: "sm",
  width: "auto",
});
