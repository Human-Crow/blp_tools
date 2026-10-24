// Tier tab.
// Load: one call that lists the tiered buildings in the blueprint, grouped by building, current
// tier and recipe/filter. Change: one call that downloads, changes the chosen groups and uploads.

import {
    tierSummary, tierAndUpload, TIER_BUILDINGS
} from "https://builderment.hcrow.workers.dev/api.js";
import type { TierChoice } from "../data/types.js";
import { WORKER } from "../data/constants.js";
import {
    tier_panel, tier_load_form, tier_id, tier_load_btn, tier_form, tier_info, tier_btn,
    preset_buttons,
} from "./dom.js";
import { panel_ui, run } from "./panel.js";
import {
    build_tier_list, clear_tier_list, chosen_rules, final_tier, select_tier, tier_rows,
    update_tier_button,
} from "./tier_rows.js";
import { start_id } from "../utils/url.js";
import { format_count } from "../utils/format.js";


const ui = panel_ui(tier_panel);
let loaded_id: string | null = null;


function reset(): void {
    loaded_id = null;
    clear_tier_list();
    tier_form.hidden = true;
}

function on_row_change(): void {
    update_tier_button();
    ui.clear();
}

async function load(): Promise<void> {
    const id = tier_id.value.trim();
    if (!id) {
        ui.error(new Error("Enter a blueprint id or url"));
        return;
    }
    reset();
    await run(tier_load_btn, ui, "Loading blueprint...", async () => {
        const groups = await tierSummary(WORKER, id);
        if (groups.length === 0) throw new Error("This blueprint has no buildings with tiers");
        loaded_id = id;
        const total = groups.reduce((sum, group) => sum + group.count, 0);
        tier_info.textContent =
            `${format_count(total)} buildings with tiers, in ${groups.length} groups`;
        build_tier_list(groups, on_row_change);
        tier_form.hidden = false;
        return null;
    });
}

/** All tier 1 / All max / Keep all */
function apply_preset(preset: string): void {
    for (const entry of tier_rows()) {
        const value = preset === "max"
            ? `${TIER_BUILDINGS[entry.group.building]}` as const
            : preset as TierChoice;
        select_tier(entry, value);
    }
    update_tier_button();
    ui.clear();
}

function change_tiers(): void {
    const id = loaded_id;
    if (!id) return;
    // everything ends up at tier 1: the short form "all:1" does the same
    const all_one = tier_rows().every(entry => final_tier(entry) === 1);
    const tiers = all_one ? 1 : chosen_rules();
    run(tier_btn, ui, "Changing tiers...", () => tierAndUpload(WORKER, id, tiers))
        .then(update_tier_button);
}


export function init_tier(): void {
    tier_load_form.addEventListener("submit", (event) => {
        event.preventDefault();
        load();
    });

    tier_form.addEventListener("submit", (event) => {
        event.preventDefault();
        change_tiers();
    });

    for (const button of preset_buttons) {
        button.addEventListener("click", () => apply_preset(button.dataset["preset"] ?? "keep"));
    }

    // typing another blueprint hides the list, so it can't be applied to the wrong one
    tier_id.addEventListener("input", () => {
        ui.clear();
        if (loaded_id !== null && tier_id.value.trim() !== loaded_id) reset();
    });

    const id = start_id();
    if (id) {
        tier_id.value = id;
        if (location.hash === "#tier") load();
    }
}
