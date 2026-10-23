import {
    mirrorAndUpload, imageAndUpload, imagePixels, tierAndUpload, tierSummary, TIER_BUILDINGS
} from "https://builderment.hcrow.workers.dev/api.js";

const WORKER = "https://builderment.hcrow.workers.dev";

const MAX_SHARE = 200_000;      // roughly what still uploads (1.5 MB compressed)
const MAX_OPEN = 999_999;       // what the game can open


// ---- tabs (#mirror / #image, so each can be linked) ----------------------------------------

const tabs = [...document.querySelectorAll(".tab")];

function show_tab(name) {
    if (!document.getElementById(`tab-${name}`)) name = "mirror";
    for (const tab of tabs) {
        const active = tab.dataset.tab === name;
        tab.setAttribute("aria-selected", String(active));
        document.getElementById(`tab-${tab.dataset.tab}`).hidden = !active;
    }
}

for (const tab of tabs) {
    tab.onclick = () => {
        history.replaceState(null, "", `#${tab.dataset.tab}`);
        show_tab(tab.dataset.tab);
    };
}
show_tab(location.hash.slice(1));


// ---- shared: status + result per panel ------------------------------------------------------

function panel_ui(panel) {
    const status = panel.querySelector(".status");
    const result = panel.querySelector(".result");
    const new_id = panel.querySelector(".new-id");
    const link = panel.querySelector(".link");
    const copy = panel.querySelector(".copy");

    copy.onclick = async () => {
        try {
            await navigator.clipboard.writeText(link.href);
            copy.textContent = "Copied!";
        } catch {
            copy.textContent = "Copy failed";
        }
        setTimeout(() => copy.textContent = "Copy link", 1500);
    };

    return {
        clear() {
            status.textContent = "";
            status.className = "status";
            result.hidden = true;
        },
        loading(text) {
            status.textContent = text;
            status.className = "status loading";
            result.hidden = true;
        },
        done(res) {
            status.textContent = "";
            status.className = "status";
            if (!res) return;           // nothing to show (e.g. loading the tier list)
            new_id.textContent = res.id;
            link.href = res.url;
            link.textContent = res.url;
            result.hidden = false;
        },
        error(err) {
            console.log(err);
            status.textContent = `Error! ${err?.message ?? err}`;
            status.className = "status error";
            result.hidden = true;
        },
    };
}

/** Run one action at a time per button, so double clicks don't cost extra worker calls. */
async function run(button, ui, text, action) {
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


// ---- mirror ---------------------------------------------------------------------------------

const mirror_ui = panel_ui(document.getElementById("tab-mirror"));
const blp_id = document.getElementById("blp_id");
const mirror_btn = document.getElementById("mirror");

// a link like ...?id=w7tx25#mirror fills in the blueprint
const start_id = new URLSearchParams(location.search).get("id");
if (start_id) blp_id.value = start_id;

document.getElementById("mirror-form").onsubmit = (event) => {
    event.preventDefault();
    const id = blp_id.value.trim();
    if (!id) {
        mirror_ui.error(new Error("Enter a blueprint id or url"));
        return;
    }
    run(mirror_btn, mirror_ui, "Mirroring...", () => mirrorAndUpload(WORKER, id));
};
blp_id.oninput = () => mirror_ui.clear();


// ---- tier -----------------------------------------------------------------------------------
// Load: one call that lists the tiered buildings in the blueprint, grouped by building, current
// tier and recipe/filter. Change: one call that downloads, changes the chosen groups and uploads.

const tier_ui = panel_ui(document.getElementById("tab-tier"));
const tier_id = document.getElementById("tier_blp_id");
const tier_load_btn = document.getElementById("tier-load");
const tier_form = document.getElementById("tier-form");
const tier_info = document.getElementById("tier-info");
const tier_btn = document.getElementById("tier");
const tier_list = document.getElementById("tier-list");

const UNKNOWN_ICON = "assets/Unknown.png";
const NONE_ICON = "assets/None.png";        // no recipe / filter item set

let loaded_id = null;
let tier_rows = [];     // { group, row, icon, inputs }

const nice = (name) => name.replaceAll("_", " ");

function icon(src, size, class_name) {
    const img = document.createElement("img");
    img.className = class_name;
    img.alt = "";
    img.width = size;
    img.height = size;
    img.loading = "lazy";
    img.onerror = () => {
        img.onerror = null;
        img.src = UNKNOWN_ICON;
    };
    img.src = src;
    return img;
}

function building_icon(name, tier) {
    return `assets/${name}_${tier}.png`;
}

function selected_tier(entry) {
    const checked = entry.inputs.find(input => input.checked);
    return checked ? checked.value : "keep";
}

function update_tier_row(entry) {
    const tier = selected_tier(entry);
    const keep = tier === "keep" || Number(tier) === entry.group.tier;
    const src = building_icon(entry.group.building, keep ? entry.group.tier : tier);
    if (!entry.icon.src.endsWith(src)) {
        entry.icon.onerror = () => { entry.icon.onerror = null; entry.icon.src = UNKNOWN_ICON; };
        entry.icon.src = src;
    }
    entry.row.classList.toggle("keep", keep);
}

/** Changes that actually do something (picking the current tier is the same as Keep). */
function chosen_rules() {
    const rules = [];
    for (const entry of tier_rows) {
        const value = selected_tier(entry);
        if (value === "keep" || Number(value) === entry.group.tier) continue;
        const { building, tier, rec_fil } = entry.group;
        rules.push({ building, from: tier, rec_fil, tier: Number(value) });
    }
    return rules;
}

function update_tier_button() {
    tier_btn.disabled = chosen_rules().length === 0;
}

function recipe_line(group) {
    const line = document.createElement("span");
    line.className = "tier-recipe";
    if (group.rec_fil === undefined) return line;       // Storage: no recipe or filter

    if (group.item === null) {
        line.append(icon(NONE_ICON, 24, "item-icon"),
            group.building === "Robotic_Arm" ? "No filter" : "No recipe");
        return line;
    }
    const name = group.item === "Unknown" ? `Unknown (${group.rec_fil})` : nice(group.item);
    line.append(icon(`assets/${group.item}.png`, 24, "item-icon"), name);
    if (group.alt) {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = "ALT";
        line.append(badge);
    }
    return line;
}

function build_tier_list(groups) {
    tier_list.replaceChildren();
    tier_rows = [];

    groups.forEach((group, index) => {
        const max = TIER_BUILDINGS[group.building];
        const row = document.createElement("div");
        row.className = "tier-row";

        const main_icon = icon(building_icon(group.building, group.tier), 48, "tier-icon");

        const text = document.createElement("div");
        text.className = "tier-text";
        const title = document.createElement("span");
        title.className = "tier-name";
        title.textContent = nice(group.building);
        const meta = document.createElement("span");
        meta.className = "tier-meta";
        meta.textContent = `×${group.count.toLocaleString("en")} · now tier ${group.tier}`;
        text.append(title, recipe_line(group), meta);

        const segments = document.createElement("div");
        segments.className = "segments";
        segments.setAttribute("role", "radiogroup");
        segments.setAttribute("aria-label", `${nice(group.building)} tier`);

        const entry = { group, row, icon: main_icon, inputs: [] };
        for (const value of ["keep", ...Array.from({ length: max }, (_, i) => String(i + 1))]) {
            const id = `tier-${index}-${value}`;
            const input = document.createElement("input");
            input.type = "radio";
            input.name = `tier-${index}`;
            input.id = id;
            input.value = value;
            input.checked = value === "keep";
            input.onchange = () => {
                update_tier_row(entry);
                update_tier_button();
                tier_ui.clear();
            };
            const label = document.createElement("label");
            label.htmlFor = id;
            label.textContent = value === "keep" ? "Keep" : value;
            if (Number(value) === group.tier) label.classList.add("current");
            segments.append(input, label);
            entry.inputs.push(input);
        }

        row.append(main_icon, text, segments);
        tier_list.append(row);
        tier_rows.push(entry);
        update_tier_row(entry);
    });
    update_tier_button();
}

function reset_tier_list() {
    loaded_id = null;
    tier_rows = [];
    tier_list.replaceChildren();
    tier_form.hidden = true;
}

async function load_tiers() {
    const id = tier_id.value.trim();
    if (!id) {
        tier_ui.error(new Error("Enter a blueprint id or url"));
        return;
    }
    reset_tier_list();
    await run(tier_load_btn, tier_ui, "Loading blueprint...", async () => {
        const groups = await tierSummary(WORKER, id);
        if (groups.length === 0) throw new Error("This blueprint has no buildings with tiers");
        loaded_id = id;
        const total = groups.reduce((sum, group) => sum + group.count, 0);
        tier_info.textContent = `${total.toLocaleString("en")} buildings with tiers, in ${groups.length} groups`;
        build_tier_list(groups);
        tier_form.hidden = false;
        return null;
    });
}

for (const button of document.querySelectorAll("[data-preset]")) {
    button.onclick = () => {
        const preset = button.dataset.preset;
        for (const entry of tier_rows) {
            const value = preset === "max" ? String(TIER_BUILDINGS[entry.group.building]) : preset;
            for (const input of entry.inputs) input.checked = input.value === value;
            update_tier_row(entry);
        }
        update_tier_button();
        tier_ui.clear();
    };
}

document.getElementById("tier-load-form").onsubmit = (event) => {
    event.preventDefault();
    load_tiers();
};

tier_form.onsubmit = (event) => {
    event.preventDefault();
    if (!loaded_id) return;
    const rules = chosen_rules();
    // everything ends up at tier 1: the short form "all:1" does the same
    const all_one = tier_rows.every(entry => {
        const value = selected_tier(entry);
        return (value === "keep" ? entry.group.tier : Number(value)) === 1;
    });
    run(tier_btn, tier_ui, "Changing tiers...", () => tierAndUpload(WORKER, loaded_id, all_one ? 1 : rules))
        .then(update_tier_button);
};

tier_id.oninput = () => {
    tier_ui.clear();
    if (loaded_id !== null && tier_id.value.trim() !== loaded_id) reset_tier_list();
};

const start_tier_id = new URLSearchParams(location.search).get("id");
if (start_tier_id) {
    tier_id.value = start_tier_id;
    if (location.hash === "#tier") load_tiers();
}


// ---- image ----------------------------------------------------------------------------------

const image_ui = panel_ui(document.getElementById("tab-image"));
const img_input = document.getElementById("imgInput");
const drop = document.getElementById("drop");
const preview = document.getElementById("imagePreview");
const file_name = document.getElementById("fileNameDisplay");
const image_info = document.getElementById("imageInfo");
const convert_btn = document.getElementById("convert");

let image_file = null;
let preview_url = null;

function count_buildings(data) {
    let count = 0;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 127) count++;
    }
    return count;
}

async function set_image(file) {
    image_ui.clear();
    image_file = null;
    convert_btn.disabled = true;
    image_info.textContent = "";
    image_info.className = "muted";

    if (preview_url) URL.revokeObjectURL(preview_url);
    preview_url = null;

    if (!file) {
        file_name.textContent = "Choose an image or drop it here";
        preview.hidden = true;
        return;
    }
    file_name.textContent = file.name;
    preview_url = URL.createObjectURL(file);
    preview.src = preview_url;
    preview.hidden = false;

    try {
        const { width, height, data } = await imagePixels(file);
        const count = count_buildings(data);
        image_info.textContent =
            `${width} × ${height} px · ${count.toLocaleString("en")} buildings`;

        if (count === 0) {
            image_info.textContent += " (the image is fully transparent)";
            image_info.className = "muted error";
            return;
        }
        if (count > MAX_OPEN) {
            image_info.textContent += " (too big to open in the game)";
            image_info.className = "muted error";
            return;
        }
        if (count > MAX_SHARE) {
            image_info.textContent += " (may be too big to share)";
            image_info.className = "muted warn";
        }
        image_file = file;
        convert_btn.disabled = false;
    } catch (err) {
        image_ui.error(new Error("Could not read this image"));
        console.log(err);
    }
}

img_input.onchange = () => set_image(img_input.files[0]);

convert_btn.onclick = () => {
    if (!image_file) return;
    run(convert_btn, image_ui, "Converting...", () => imageAndUpload(WORKER, image_file));
};

// drag and drop (anywhere on the drop area)
drop.ondragover = (event) => {
    event.preventDefault();
    drop.classList.add("over");
};
drop.ondragleave = () => drop.classList.remove("over");
drop.ondrop = (event) => {
    event.preventDefault();
    drop.classList.remove("over");
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) set_image(file);
};
