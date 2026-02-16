import { ChemicalElement, MatterState } from '../../types';

const R = 8.314; // Ideal Gas Constant

/**
 * Calculates current melting point using Simon-Glatzel equation or specific exceptions
 */
export const calculateMeltingPoint = (element: ChemicalElement, pressure: number): number => {
    const { properties, specialBehavior } = element;
    const T_ref = properties.meltingPointK;
    const P_ref = 101325;

    // 1. HELIUM EXCEPTION (Absolute Cutoff)
    if (specialBehavior?.cantFreezeBelowPa) {
        if (pressure < specialBehavior.cantFreezeBelowPa) return 0;
    }

    // 2. WATER-LIKE EXCEPTION (Linear Descent)
    if (specialBehavior?.isWaterLike) {
        const slope = -7.4e-8; // K/Pa approximation for ice
        const deltaP = pressure - P_ref;
        return Math.max(0, T_ref + (slope * deltaP));
    }

    // PREPARE SIMON-GLATZEL PARAMS
    const a = properties.simonA_Pa || ((properties.bulkModulusGPa || 50) * 1e9 * 0.05);
    const c = properties.simonC || 2.0;

    // Helper for SG Calculation
    const solveSG = (targetP: number) => {
        const term = ((targetP - P_ref) / a) + 1;
        if (term < 0) return 0; // Physics safety
        return T_ref * Math.pow(term, (1 / c));
    };

    // 3. TURNOVER EXCEPTION (Sodium/Lithium)
    if (specialBehavior?.highPressureTurnover) {
        const PEAK_P = 3e9; // ~3 GPa turnover point
        if (pressure < PEAK_P) {
            return solveSG(pressure);
        } else {
            const maxT = solveSG(PEAK_P);
            const excess = pressure - PEAK_P;
            const dropRate = 5e-8; // K/Pa decay
            return Math.max(0, maxT - (excess * dropRate));
        }
    }

    return solveSG(pressure);
};

/**
 * Calculates current boiling point using Clausius-Clapeyron equation
 */
export const calculateBoilingPoint = (element: ChemicalElement, pressure: number, meltingPointCurrent: number): number => {
    const { properties } = element;
    const T_boil_std = properties.boilingPointK;
    const dH_vap = properties.enthalpyVapJmol || 97000;

    // Clausius-Clapeyron
    const logPressureTerm = Math.log(Math.max(1, pressure) / 101325);
    const denominator = (1 / T_boil_std) - ((R * logPressureTerm) / dH_vap);
    let T_boil = (denominator <= 0.0001) ? 50000 : (1 / denominator);

    // Ensure Boiling doesn't cross Melting (Physics sanity for simulation)
    if (T_boil < meltingPointCurrent) T_boil = meltingPointCurrent + 0.1;

    return T_boil;
};

/**
 * Calculates current sublimation point using Clausius-Clapeyron for sublimation
 */
export const calculateSublimationPoint = (element: ChemicalElement, pressure: number): number => {
    const { properties } = element;
    const triplePoint = properties.triplePoint;

    if (!triplePoint || !properties.enthalpyFusionJmol) return 0;

    const molarMassKg = element.mass / 1000;
    const dH_vap_mol = properties.enthalpyVapJmol || (properties.latentHeatVaporization * molarMassKg);
    const dH_sub_mol = properties.enthalpyFusionJmol + dH_vap_mol;

    const safePressure = Math.max(1e-9, pressure);
    const logTerm = Math.log(safePressure / triplePoint.pressurePa);
    const invTsub = (1 / triplePoint.tempK) - ((R * logTerm) / dH_sub_mol);

    return 1 / invTsub;
};

/**
 * Predicts the state of matter for an element at a given Temperature and Pressure.
 * Used for both the Thermodynamics engine and the ChatGPT Context generation.
 */
export const predictMatterState = (
    element: ChemicalElement,
    temperature: number,
    pressure: number
): { state: MatterState, T_melt: number, T_boil: number, T_sub: number, isSupercritical: boolean, isTriplePoint: boolean } => {

    const { properties } = element;
    const { criticalPoint, triplePoint } = properties;

    // 1. Check Sublimation Regime
    const isSublimationRegime = !!triplePoint && pressure < triplePoint.pressurePa;

    // 2. Critical Point Check
    let isSupercritical = false;
    if (criticalPoint && !isSublimationRegime) {
        if (temperature >= criticalPoint.tempK && pressure >= criticalPoint.pressurePa) {
            isSupercritical = true;
        }
    }

    // 3. Triple Point Check
    let isTriplePoint = false;
    if (triplePoint && !isSupercritical && !isSublimationRegime) {
        // Broaden tolerance strictly for "Labeling/Prediction" purposes if needed, 
        // but keeping it tight to match visual simulation logic
        const tDiff = Math.abs(temperature - triplePoint.tempK);
        const pRatio = Math.max(pressure, triplePoint.pressurePa) / Math.min(pressure, triplePoint.pressurePa);
        if (tDiff < 1.0 && pRatio < 1.1) {
            isTriplePoint = true;
        }
    }

    // Phase Calculation
    let T_melt = 0;
    let T_boil = 0;
    let T_sub = 0;
    let predicted: MatterState = MatterState.SOLID;

    // Temperature rounding for Equilibrium checks
    const T_target_round = Math.round(temperature);

    if (isSupercritical) {
        predicted = MatterState.SUPERCRITICAL;
        // Even if SC, calculate boundaries for reference
        T_melt = calculateMeltingPoint(element, pressure);
        T_boil = calculateBoilingPoint(element, pressure, T_melt);
    } else if (isTriplePoint) {
        predicted = MatterState.EQUILIBRIUM_TRIPLE;
        // At TP, all T's converge roughly
        T_melt = triplePoint!.tempK;
        T_boil = triplePoint!.tempK;
        T_sub = triplePoint!.tempK;
    } else if (isSublimationRegime) {
        T_sub = calculateSublimationPoint(element, pressure);
        const T_sub_round = Math.round(T_sub);

        if (T_target_round === T_sub_round) {
            predicted = MatterState.EQUILIBRIUM_SUB;
        } else if (temperature < T_sub) {
            predicted = MatterState.SOLID; // Below sublimation point
        } else {
            predicted = MatterState.GAS;
        }
    } else {
        // Standard Regime
        T_melt = calculateMeltingPoint(element, pressure);
        T_boil = calculateBoilingPoint(element, pressure, T_melt);

        const T_melt_round = Math.round(T_melt);
        const T_boil_round = Math.round(T_boil);

        if (T_target_round === T_melt_round) {
            predicted = MatterState.EQUILIBRIUM_MELT;
        } else if (T_target_round === T_boil_round) {
            predicted = MatterState.EQUILIBRIUM_BOIL;
        } else if (temperature < T_melt) {
            predicted = MatterState.SOLID;
        } else if (temperature < T_boil) {
            predicted = MatterState.LIQUID;
        } else {
            predicted = MatterState.GAS;
        }
    }

    return {
        state: predicted,
        T_melt,
        T_boil,
        T_sub,
        isSupercritical,
        isTriplePoint
    };
};
