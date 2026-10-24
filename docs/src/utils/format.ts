/** 12345 -> "12,345" */
export function format_count(value: number): string {
    return value.toLocaleString("en");
}

export function error_message(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}
