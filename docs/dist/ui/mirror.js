// Mirror tab: one call that downloads, mirrors and uploads.
import { mirrorAndUpload } from "https://builderment.hcrow.workers.dev/api.js";
import { WORKER } from "../data/constants.js";
import { mirror_panel, mirror_form, mirror_id, mirror_btn } from "./dom.js";
import { panel_ui, run } from "./panel.js";
import { start_id } from "../utils/url.js";
export function init_mirror() {
    const ui = panel_ui(mirror_panel);
    const id = start_id();
    if (id)
        mirror_id.value = id;
    mirror_form.addEventListener("submit", (event) => {
        event.preventDefault();
        const id = mirror_id.value.trim();
        if (!id) {
            ui.error(new Error("Enter a blueprint id or url"));
            return;
        }
        run(mirror_btn, ui, "Mirroring...", () => mirrorAndUpload(WORKER, id));
    });
    mirror_id.addEventListener("input", () => ui.clear());
}
//# sourceMappingURL=mirror.js.map