// Types for the worker's api.js, which the site imports straight from the worker.
// Only the parts this site uses.

declare module "https://builderment.hcrow.workers.dev/api.js" {
    export interface UploadResult {
        id: string;
        url: string;
    }

    export type TierBuilding =
        | "Extractor" | "Workshop" | "Furnace" | "Machine_Shop" | "Forge"
        | "Industrial_Factory" | "Manufacturer" | "Storage" | "Robotic_Arm";

    /** highest tier of every building that has tiers */
    export const TIER_BUILDINGS: Record<TierBuilding, number>;

    /** change buildings of one type, optionally only at one tier and with one recipe/filter */
    export interface TierRule {
        building: TierBuilding | "all";
        from?: number;
        rec_fil?: number;
        tier: number;
    }

    /** a number sets every tiered building to that tier */
    export type TierSettings = number | Partial<Record<TierBuilding, number>> | TierRule[];

    /** buildings in a blueprint with the same type, tier and recipe/filter */
    export interface TierGroup {
        building: TierBuilding;
        tier: number;               // current tier, 1 = lowest
        rec_fil?: number;           // missing for buildings without recipe/filter (Storage)
        item: string | null;        // item of the recipe/filter, null = none set
        alt: boolean;               // ALT recipe
        count: number;
    }

    export interface ImagePixels {
        name: string;
        width: number;
        height: number;
        data: Uint8ClampedArray;
    }

    export function mirrorAndUpload(worker_url: string, id: string): Promise<UploadResult>;
    export function imageAndUpload(worker_url: string, file: Blob & { name?: string }): Promise<UploadResult>;
    export function imagePixels(file: Blob & { name?: string }): Promise<ImagePixels>;
    export function tierSummary(worker_url: string, id: string): Promise<TierGroup[]>;
    export function tierAndUpload(worker_url: string, id: string, tiers: TierSettings): Promise<UploadResult>;
}
