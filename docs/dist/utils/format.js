/** 12345 -> "12,345" */
export function format_count(value) {
    return value.toLocaleString("en");
}
export function error_message(err) {
    return err instanceof Error ? err.message : String(err);
}
//# sourceMappingURL=format.js.map