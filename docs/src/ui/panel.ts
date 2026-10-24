// The status line and result box that every tab has.

import type { UploadResult } from "https://builderment.hcrow.workers.dev/api.js";
import type { PanelUI } from "../data/types.js";
import { COPY_TEXT } from "../data/constants.js";
import { error_message } from "../utils/format.js";


function find<T extends Element>(panel: HTMLElement, selector: string): T {
    const el = panel.querySelector<T>(selector);
    if (!el) throw new Error(`Missing ${selector} in #${panel.id}`);
    return el;
}

export function panel_ui(panel: HTMLElement): PanelUI {
    const status = find<HTMLParagraphElement>(panel, ".status");
    const result = find<HTMLDivElement>(panel, ".result");
    const new_id = find<HTMLElement>(panel, ".new-id");
    const link = find<HTMLAnchorElement>(panel, ".link");
    const copy = find<HTMLButtonElement>(panel, ".copy");

    copy.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(link.href);
            copy.textContent = "Copied!";
        } catch {
            copy.textContent = "Copy failed";
        }
        setTimeout(() => copy.textContent = COPY_TEXT, 1500);
    });

    function set_status(text: string, kind: "" | "loading" | "error"): void {
        status.textContent = text;
        status.className = kind ? `status ${kind}` : "status";
    }

    return {
        clear() {
            set_status("", "");
            result.hidden = true;
        },
        loading(text: string) {
            set_status(text, "loading");
            result.hidden = true;
        },
        done(res: UploadResult | null) {
            set_status("", "");
            if (!res) return;           // nothing to show (e.g. loading the tier list)
            new_id.textContent = res.id;
            link.href = res.url;
            link.textContent = res.url;
            result.hidden = false;
        },
        error(err: unknown) {
            console.log(err);
            set_status(`Error! ${error_message(err)}`, "error");
            result.hidden = true;
        },
    };
}

/** Run one action at a time per button, so double clicks don't cost extra worker calls. */
export async function run(
    button: HTMLButtonElement,
    ui: PanelUI,
    text: string,
    action: () => Promise<UploadResult | null>
): Promise<void> {
    if (button.disabled) return;
    button.disabled = true;
    ui.loading(text);
    try {
        ui.done(await action());
    } catch (err) {
        ui.error(err);
    } finally {
        button.disabled = false;
    }
}
