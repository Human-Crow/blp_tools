import type { TierGroup, UploadResult } from "https://builderment.hcrow.workers.dev/api.js";


/** status line and result box of one tab */
export interface PanelUI {
    clear(): void;
    loading(text: string): void;
    done(result: UploadResult | null): void;
    error(err: unknown): void;
}

/** one row of the tier list */
export interface TierEntry {
    group: TierGroup;
    row: HTMLDivElement;
    icon: HTMLImageElement;
    inputs: HTMLInputElement[];
}

/** what a tier row is set to: keep the current tier, or a tier as text ("1", "2", ...) */
export type TierChoice = "keep" | `${number}`;
