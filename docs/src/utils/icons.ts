import { UNKNOWN_ICON } from "../data/constants.js";


/** "Machine_Shop" -> "Machine Shop" */
export function nice_name(name: string): string {
    return name.replaceAll("_", " ");
}

export function building_icon(name: string, tier: number | string): string {
    return `assets/${name}_${tier}.png`;
}

export function item_icon(item: string): string {
    return `assets/${item}.png`;
}

/** show the Unknown icon when an image is missing */
export function fallback_on_error(img: HTMLImageElement): void {
    img.onerror = () => {
        img.onerror = null;
        img.src = UNKNOWN_ICON;
    };
}

export function create_icon(src: string, size: number, class_name: string): HTMLImageElement {
    const img = document.createElement("img");
    img.className = class_name;
    img.alt = "";
    img.width = size;
    img.height = size;
    img.loading = "lazy";
    fallback_on_error(img);
    img.src = src;
    return img;
}
