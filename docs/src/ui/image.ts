// Image tab: decode the image in the browser, then one call that converts and uploads.

import { imageAndUpload, imagePixels } from "https://builderment.hcrow.workers.dev/api.js";
import { WORKER, MAX_OPEN, MAX_SHARE } from "../data/constants.js";
import {
    image_panel, img_input, drop_area, preview, file_name, image_info, convert_btn,
} from "./dom.js";
import { panel_ui, run } from "./panel.js";
import { format_count } from "../utils/format.js";


const ui = panel_ui(image_panel);
const NO_FILE_TEXT = "Choose an image or drop it here";

let image_file: File | null = null;
let preview_url: string | null = null;


/** one building per pixel that is more than half opaque */
function count_buildings(data: Uint8ClampedArray): number {
    let count = 0;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i]! > 127) count++;
    }
    return count;
}

function set_info(text: string, kind: "" | "warn" | "error" = ""): void {
    image_info.textContent = text;
    image_info.className = kind ? `muted ${kind}` : "muted";
}

function show_preview(file: File | null): void {
    if (preview_url) URL.revokeObjectURL(preview_url);
    preview_url = null;

    if (!file) {
        file_name.textContent = NO_FILE_TEXT;
        preview.hidden = true;
        return;
    }
    file_name.textContent = file.name;
    preview_url = URL.createObjectURL(file);
    preview.src = preview_url;
    preview.hidden = false;
}

async function set_image(file: File | null): Promise<void> {
    ui.clear();
    image_file = null;
    convert_btn.disabled = true;
    set_info("");
    show_preview(file);
    if (!file) return;

    try {
        const { width, height, data } = await imagePixels(file);
        const count = count_buildings(data);
        const size = `${width} × ${height} px · ${format_count(count)} buildings`;

        if (count === 0) return set_info(`${size} (the image is fully transparent)`, "error");
        if (count > MAX_OPEN) return set_info(`${size} (too big to open in the game)`, "error");
        if (count > MAX_SHARE) set_info(`${size} (may be too big to share)`, "warn");
        else set_info(size);

        image_file = file;
        convert_btn.disabled = false;
    } catch (err) {
        console.log(err);
        ui.error(new Error("Could not read this image"));
    }
}


export function init_image(): void {
    img_input.addEventListener("change", () => set_image(img_input.files?.[0] ?? null));

    convert_btn.addEventListener("click", () => {
        const file = image_file;
        if (!file) return;
        run(convert_btn, ui, "Converting...", () => imageAndUpload(WORKER, file));
    });

    // drag and drop (anywhere on the drop area)
    drop_area.addEventListener("dragover", (event) => {
        event.preventDefault();
        drop_area.classList.add("over");
    });
    drop_area.addEventListener("dragleave", () => drop_area.classList.remove("over"));
    drop_area.addEventListener("drop", (event) => {
        event.preventDefault();
        drop_area.classList.remove("over");
        const file = event.dataTransfer?.files[0];
        if (file && file.type.startsWith("image/")) set_image(file);
    });
}
