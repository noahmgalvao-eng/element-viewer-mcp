import { ChemicalElement } from "../types";

// Returns a random number from a standard normal distribution (mean=0, stdev=1)
export const randomGaussian = () => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
};

export const getMolecularSymbol = (element: ChemicalElement, currentTempK: number): string => {
    // 1. If no molecular forms defined (Metals: Au, Na, Fe...), return atomic symbol.
    if (!element.molecularForms || element.molecularForms.length === 0) {
        return element.symbol;
    }

    // 2. Check dissociation thresholds.
    // The array is ordered by stability (e.g., S8 first, then S2).
    // If Temp < maxTemp of the form, that form survives.
    for (const form of element.molecularForms) {
        if (currentTempK <= form.maxTempK) {
            return form.symbol;
        }
    }

    // 3. If it's hotter than all thresholds, the molecule is fully dissociated into atoms.
    return element.symbol;
};