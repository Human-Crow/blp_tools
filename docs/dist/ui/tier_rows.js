// Tier list rows: one per building + current tier + recipe/filter, with Keep / 1 / 2 / ... buttons.
import { TIER_BUILDINGS } from "https://builderment.hcrow.workers.dev/api.js";
import { NONE_ICON } from "../data/constants.js";
import { tier_list, tier_btn } from "./dom.js";
import { building_icon, create_icon, fallback_on_error, item_icon, nice_name } from "../utils/icons.js";
import { format_count } from "../utils/format.js";
let rows = [];
export function tier_rows() {
    return rows;
}
// ---- reading and setting a row ------------------------------------------------------------
export function selected_tier(entry) {
    const checked = entry.inputs.find(input => input.checked);
    return (checked ? checked.value : "keep");
}
/** the tier a row ends up with */
export function final_tier(entry) {
    const value = selected_tier(entry);
    return value === "keep" ? entry.group.tier : Number(value);
}
export function select_tier(entry, value) {
    for (const input of entry.inputs)
        input.checked = input.value === value;
    update_row(entry);
}
function update_row(entry) {
    const keep = final_tier(entry) === entry.group.tier;
    const src = building_icon(entry.group.building, final_tier(entry));
    if (!entry.icon.src.endsWith(src)) {
        fallback_on_error(entry.icon);
        entry.icon.src = src;
    }
    entry.row.classList.toggle("keep", keep);
}
/** changes that actually do something (picking the current tier is the same as Keep) */
export function chosen_rules() {
    const rules = [];
    for (const entry of rows) {
        const tier = final_tier(entry);
        if (tier === entry.group.tier)
            continue;
        const { building, tier: from, rec_fil } = entry.group;
        // Storage has no recipe/filter: leave rec_fil out instead of setting it to undefined
        rules.push(rec_fil === undefined
            ? { building, from, tier }
            : { building, from, rec_fil, tier });
    }
    return rules;
}
export function update_tier_button() {
    tier_btn.disabled = chosen_rules().length === 0;
}
// ---- building the list --------------------------------------------------------------------
function recipe_line(group) {
    const line = document.createElement("span");
    line.className = "tier-recipe";
    if (group.rec_fil === undefined)
        return line; // Storage: no recipe or filter
    if (group.item === null) {
        line.append(create_icon(NONE_ICON, 24, "item-icon"), group.building === "Robotic_Arm" ? "No filter" : "No recipe");
        return line;
    }
    const name = group.item === "Unknown" ? `Unknown (${group.rec_fil})` : nice_name(group.item);
    line.append(create_icon(item_icon(group.item), 24, "item-icon"), name);
    if (group.alt) {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = "ALT";
        line.append(badge);
    }
    return line;
}
function row_text(group) {
    const text = document.createElement("div");
    text.className = "tier-text";
    const title = document.createElement("span");
    title.className = "tier-name";
    title.textContent = nice_name(group.building);
    const meta = document.createElement("span");
    meta.className = "tier-meta";
    meta.textContent = `×${format_count(group.count)} · now tier ${group.tier}`;
    text.append(title, recipe_line(group), meta);
    return text;
}
function tier_buttons(entry, index, on_change) {
    const { group } = entry;
    const segments = document.createElement("div");
    segments.className = "segments";
    segments.setAttribute("role", "radiogroup");
    segments.setAttribute("aria-label", `${nice_name(group.building)} tier`);
    const max = TIER_BUILDINGS[group.building];
    const values = ["keep", ...Array.from({ length: max }, (_, i) => `${i + 1}`)];
    for (const value of values) {
        const id = `tier-${index}-${value}`;
        const input = document.createElement("input");
        input.type = "radio";
        input.name = `tier-${index}`;
        input.id = id;
        input.value = value;
        input.checked = value === "keep";
        input.addEventListener("change", () => {
            update_row(entry);
            on_change();
        });
        const label = document.createElement("label");
        label.htmlFor = id;
        label.textContent = value === "keep" ? "Keep" : value;
        if (Number(value) === group.tier)
            label.classList.add("current");
        segments.append(input, label);
        entry.inputs.push(input);
    }
    return segments;
}
/** on_change: called when a row's tier changes */
export function build_tier_list(groups, on_change) {
    tier_list.replaceChildren();
    rows = [];
    groups.forEach((group, index) => {
        const row = document.createElement("div");
        row.className = "tier-row";
        const icon = create_icon(building_icon(group.building, group.tier), 48, "tier-icon");
        const entry = { group, row, icon, inputs: [] };
        row.append(icon, row_text(group), tier_buttons(entry, index, on_change));
        tier_list.append(row);
        rows.push(entry);
        update_row(entry);
    });
    update_tier_button();
}
export function clear_tier_list() {
    rows = [];
    tier_list.replaceChildren();
}
//# sourceMappingURL=tier_rows.js.map