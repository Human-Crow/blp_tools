// Every element the site uses, found once.

function get<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing element #${id}`);
    return el as T;
}


// tabs
export const tab_buttons = [...document.querySelectorAll<HTMLButtonElement>(".tab")];
export const mirror_panel = get<HTMLElement>("tab-mirror");
export const tier_panel   = get<HTMLElement>("tab-tier");
export const image_panel  = get<HTMLElement>("tab-image");

// mirror
export const mirror_form  = get<HTMLFormElement>("mirror-form");
export const mirror_id    = get<HTMLInputElement>("blp_id");
export const mirror_btn   = get<HTMLButtonElement>("mirror");

// tier
export const tier_load_form = get<HTMLFormElement>("tier-load-form");
export const tier_id        = get<HTMLInputElement>("tier_blp_id");
export const tier_load_btn  = get<HTMLButtonElement>("tier-load");
export const tier_form      = get<HTMLFormElement>("tier-form");
export const tier_info      = get<HTMLParagraphElement>("tier-info");
export const tier_btn       = get<HTMLButtonElement>("tier");
export const tier_list      = get<HTMLDivElement>("tier-list");
export const preset_buttons = [...document.querySelectorAll<HTMLButtonElement>("[data-preset]")];

// image
export const img_input    = get<HTMLInputElement>("imgInput");
export const drop_area    = get<HTMLLabelElement>("drop");
export const preview      = get<HTMLImageElement>("imagePreview");
export const file_name    = get<HTMLSpanElement>("fileNameDisplay");
export const image_info   = get<HTMLSpanElement>("imageInfo");
export const convert_btn  = get<HTMLButtonElement>("convert");
