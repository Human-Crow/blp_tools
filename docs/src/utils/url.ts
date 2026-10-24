/** ?id=... in the page url (a link like ...?id=c5y184#tier fills in the blueprint) */
export function start_id(): string | null {
    return new URLSearchParams(location.search).get("id");
}

/** the tab in the page url, e.g. "tier" for #tier */
export function start_tab(): string {
    return location.hash.slice(1);
}

export function set_tab_in_url(name: string): void {
    history.replaceState(null, "", `#${name}`);
}
