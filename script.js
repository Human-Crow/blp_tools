import {
    mirrorAndUpload, imageAndUpload, imagePixels
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
