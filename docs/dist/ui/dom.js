// Every element the site uses, found once.
function get(id) {
    const el = document.getElementById(id);
    if (!el)
        throw new Error(`Missing element #${id}`);
    return el;
}
// tabs
export const tab_buttons = [...document.querySelectorAll(".tab")];
export const mirror_panel = get("tab-mirror");
export const tier_panel = get("tab-tier");
export const image_panel = get("tab-image");
// mirror
export const mirror_form = get("mirror-form");
export const mirror_id = get("blp_id");
export const mirror_btn = get("mirror");
// tier
export const tier_load_form = get("tier-load-form");
export const tier_id = get("tier_blp_id");
export const tier_load_btn = get("tier-load");
export const tier_form = get("tier-form");
export const tier_info = get("tier-info");
export const tier_btn = get("tier");
export const tier_list = get("tier-list");
export const preset_buttons = [...document.querySelectorAll("[data-preset]")];
// image
export const img_input = get("imgInput");
export const drop_area = get("drop");
export const preview = get("imagePreview");
export const file_name = get("fileNameDisplay");
export const image_info = get("imageInfo");
export const convert_btn = get("convert");
//# sourceMappingURL=dom.js.map