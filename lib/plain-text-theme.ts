import { Theme } from "@earendil-works/pi-coding-agent";

/**
 * Extensions require a complete Theme, while the web UI applies its own styling.
 *
 * The Pi `Theme` constructor eagerly resolves every derived color key, so each
 * derivation source must be present even when the web UI never renders ANSI.
 * Pi 0.87 derives `scrollbarTrack`/`scrollbarThumb`/`thinkingMax`/
 * `searchMatchText` in the foreground set from `muted`, `text`, and
 * `thinkingXhigh`; a missing source reaches `fgAnsi(undefined)` and throws
 * `undefined.startsWith` while this module is being imported, which breaks
 * `next build` and every API route that loads the RPC manager. The derived keys
 * are listed explicitly so a future Pi release that adds another derivation
 * keeps constructing.
 */
const PLAIN_TEXT_FOREGROUND_COLORS = {
  text: "",
  muted: "",
  thinkingXhigh: "",
  scrollbarTrack: "",
  scrollbarThumb: "",
  thinkingMax: "",
  searchMatchText: "",
} as ConstructorParameters<typeof Theme>[0];

const PLAIN_TEXT_BACKGROUND_COLORS = {
  selectedBg: "",
  searchMatchBg: "",
} as ConstructorParameters<typeof Theme>[1];

export class PlainTextTheme extends Theme {
  constructor() {
    super(PLAIN_TEXT_FOREGROUND_COLORS, PLAIN_TEXT_BACKGROUND_COLORS, "truecolor");
  }

  override fg(...[, text]: Parameters<Theme["fg"]>): string { return text; }
  override bg(...[, text]: Parameters<Theme["bg"]>): string { return text; }
  override bold(text: string): string { return text; }
  override italic(text: string): string { return text; }
  override underline(text: string): string { return text; }
  override inverse(text: string): string { return text; }
  override strikethrough(text: string): string { return text; }
  override getFgAnsi(): string { return ""; }
  override getBgAnsi(): string { return ""; }
  override getThinkingBorderColor(): (text: string) => string {
    return (text) => text;
  }
  override getBashModeBorderColor(): (text: string) => string { return (text) => text; }
}

export const PLAIN_TEXT_THEME = new PlainTextTheme();
