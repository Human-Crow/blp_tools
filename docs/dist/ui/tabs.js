// Tabs: #mirror / #tier / #image, so each one can be linked.
import { tab_buttons } from "./dom.js";
import { start_tab, set_tab_in_url } from "../utils/url.js";
function panel_of(name) {
    return document.getElementById(`tab-${name}`);
}
export function show_tab(name) {
    if (!panel_of(name))
        name = "mirror";
    for (const tab of tab_buttons) {
        const tab_name = tab.dataset["tab"] ?? "";
        const active = tab_name === name;
        tab.setAttribute("aria-selected", String(active));
        const panel = panel_of(tab_name);
        if (panel)
            panel.hidden = !active;
    }
}
export function init_tabs() {
    for (const tab of tab_buttons) {
        tab.addEventListener("click", () => {
            const name = tab.dataset["tab"] ?? "mirror";
            set_tab_in_url(name);
            show_tab(name);
        });
    }
    show_tab(start_tab());
}
//# sourceMappingURL=tabs.js.map