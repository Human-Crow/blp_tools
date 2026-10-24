// The status line and result box that every tab has.
import { COPY_TEXT } from "../data/constants.js";
import { error_message } from "../utils/format.js";
function find(panel, selector) {
    const el = panel.querySelector(selector);
    if (!el)
        throw new Error(`Missing ${selector} in #${panel.id}`);
    return el;
}
export function panel_ui(panel) {
    const status = find(panel, ".status");
    const result = find(panel, ".result");
    const new_id = find(panel, ".new-id");
    const link = find(panel, ".link");
    const copy = find(panel, ".copy");
    copy.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(link.href);
            copy.textContent = "Copied!";
        }
        catch {
            copy.textContent = "Copy failed";
        }
        setTimeout(() => copy.textContent = COPY_TEXT, 1500);
    });
    function set_status(text, kind) {
        status.textContent = text;
        status.className = kind ? `status ${kind}` : "status";
    }
    return {
        clear() {
            set_status("", "");
            result.hidden = true;
        },
        loading(text) {
            set_status(text, "loading");
            result.hidden = true;
        },
        done(res) {
            set_status("", "");
            if (!res)
                return; // nothing to show (e.g. loading the tier list)
            new_id.textContent = res.id;
            link.href = res.url;
            link.textContent = res.url;
            result.hidden = false;
        },
        error(err) {
            console.log(err);
            set_status(`Error! ${error_message(err)}`, "error");
            result.hidden = true;
        },
    };
}
/** Run one action at a time per button, so double clicks don't cost extra worker calls. */
export async function run(button, ui, text, action) {
    if (button.disabled)
        return;
    button.disabled = true;
    ui.loading(text);
    try {
        ui.done(await action());
    }
    catch (err) {
        ui.error(err);
    }
    finally {
        button.disabled = false;
    }
}
//# sourceMappingURL=panel.js.map