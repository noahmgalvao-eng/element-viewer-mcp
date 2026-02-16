import { ChemicalElement, MatterState } from '../../types';
import { SimulationMutableState } from './types';
import {
    calculateMeltingPoint,
    calculateBoilingPoint,
    calculateSublimationPoint,
    predictMatterState
} from './phaseCalculations';

interface ThermodynamicsInput {
    simState: SimulationMutableState;
    element: ChemicalElement;
    targetEnvTemp: number;
    pressure: number;
    dt: number;
    timeScale: number;
}

interface ThermodynamicsOutput {
    phase: MatterState;
    detectedPhase: MatterState;
    currentTemp: number;
    meltingPointCurrent: number;
    boilingPointCurrent: number;
    sublimationPointCurrent: number;
    meltProgress: number;
    boilProgress: number;
    sublimationProgress: number;
    scfTransitionProgress: number;
    powerInput: number;
}

const SAMPLE_MASS = 0.001; // 1 gram sample
const THERMAL_TAU = 0.5; // Relaxation time

export const calculateThermodynamics = ({
    simState,
    element,
    targetEnvTemp,
    pressure,
    dt,
    timeScale
}: ThermodynamicsInput): ThermodynamicsOutput => {

    const {
        latentHeatFusion: L_FUSION,
        latentHeatVaporization: L_VAPORIZATION,
        specificHeatSolid: C_SOLID,
        specificHeatLiquid: C_LIQUID,
        specificHeatGas: C_GAS,
        meltingPointK: T_melt_base,
        boilingPointK: T_boil_std,
        enthalpyVapJmol,
        enthalpyFusionJmol,
        criticalPoint,
        triplePoint
    } = element.properties;

    // --- CHECK FOR SUBLIMATION REGIME ---
    // Pressure must be strictly below Triple Point Pressure
    const isSublimationRegime = triplePoint && pressure < triplePoint.pressurePa;
    const R = 8.314; // Ideal Gas Constant

    let currentTemp = 0;
    let detectedPhase: MatterState = MatterState.SOLID;
    let meltProgress = 0;
    let boilProgress = 0;
    let sublimationProgress = 0;
    let T_melt = 0;
    let T_boil = 0;
    let T_sub = 0;

    // --- SUBLIMATION PATH ---
    if (isSublimationRegime && triplePoint && enthalpyFusionJmol) {
        // 1. Calculate Sublimation Enthalpy (J/mol)
        // If Vap Enthalpy missing, estimate from latent heat (J/kg) * Molar Mass (kg/mol)
        const molarMassKg = element.mass / 1000;
        const dH_vap_mol = enthalpyVapJmol || (L_VAPORIZATION * molarMassKg);
        const dH_sub_mol = enthalpyFusionJmol + dH_vap_mol;

        // 2. Clausius-Clapeyron for Sublimation
        // 1/T_sub = 1/T_trip - (R * ln(P/P_trip) / dH_sub)
        // FIX: Clamp pressure to avoid -Infinity at 0 Pa
        const safePressure = Math.max(1e-9, pressure);
        const logTerm = Math.log(safePressure / triplePoint.pressurePa);
        const invTsub = (1 / triplePoint.tempK) - ((R * logTerm) / dH_sub_mol);
        T_sub = 1 / invTsub;

        // 3. Phase Energy Boundaries
        // Solid -> Gas (No Liquid)
        const L_SUB = L_FUSION + L_VAPORIZATION; // Approximation in J/kg for simulation energy bucket

        const H_sub_start = SAMPLE_MASS * C_SOLID * T_sub;
        const H_sub_end = H_sub_start + (SAMPLE_MASS * L_SUB);

        // FIX: Use <= to ensure absolute zero (Enthalpy=0) is treated as Solid
        if (simState.enthalpy <= H_sub_start) {
            currentTemp = simState.enthalpy / (SAMPLE_MASS * C_SOLID);
            detectedPhase = MatterState.SOLID;
            sublimationProgress = 0;
        } else if (simState.enthalpy < H_sub_end) {
            currentTemp = T_sub;
            detectedPhase = MatterState.SUBLIMATION;
            sublimationProgress = (simState.enthalpy - H_sub_start) / (SAMPLE_MASS * L_SUB);
        } else {
            currentTemp = T_sub + (simState.enthalpy - H_sub_end) / (SAMPLE_MASS * C_GAS);
            detectedPhase = MatterState.GAS;
            sublimationProgress = 1;
            // IMPORTANT: If fully gas via sublimation, we must set these to 1
            // so the particle system treats it as a free gas.
            meltProgress = 1;
            boilProgress = 1;
        }

        // Indicate other points don't exist in this regime
        T_melt = 0;
        T_boil = 0;

    } else {
        // --- STANDARD SIMON-GLATZEL & CLAUSIUS PATH ---

        // Use shared helper - exact same math
        T_melt = calculateMeltingPoint(element, pressure);
        T_boil = calculateBoilingPoint(element, pressure, T_melt);

        // --- PHASE DETECTION (Standard) ---
        const H_melt_start = SAMPLE_MASS * C_SOLID * T_melt;
        const H_melt_end = H_melt_start + (SAMPLE_MASS * L_FUSION);
        const H_boil_start = H_melt_end + (SAMPLE_MASS * C_LIQUID * (T_boil - T_melt));
        const H_boil_end = H_boil_start + (SAMPLE_MASS * L_VAPORIZATION);

        if (simState.enthalpy < H_melt_start) {
            currentTemp = simState.enthalpy / (SAMPLE_MASS * C_SOLID);
            detectedPhase = MatterState.SOLID;
            meltProgress = 0;
        } else if (simState.enthalpy < H_melt_end) {
            currentTemp = T_melt;
            detectedPhase = MatterState.MELTING;
            meltProgress = (simState.enthalpy - H_melt_start) / (SAMPLE_MASS * L_FUSION);
        } else if (simState.enthalpy < H_boil_start) {
            currentTemp = T_melt + (simState.enthalpy - H_melt_end) / (SAMPLE_MASS * C_LIQUID);
            detectedPhase = MatterState.LIQUID;
            meltProgress = 1;
        } else if (simState.enthalpy < H_boil_end) {
            currentTemp = T_boil;
            detectedPhase = MatterState.BOILING;
            meltProgress = 1;
            boilProgress = (simState.enthalpy - H_boil_start) / (SAMPLE_MASS * L_VAPORIZATION);
        } else {
            currentTemp = T_boil + (simState.enthalpy - H_boil_end) / (SAMPLE_MASS * C_GAS);
            detectedPhase = MatterState.GAS;
            meltProgress = 1;
            boilProgress = 1;
        }
    }

    // --- CRITICAL POINT DETECTION ---
    let isSupercritical = false;
    if (criticalPoint && !isSublimationRegime) {
        const T_crit = criticalPoint.tempK;
        const P_crit = criticalPoint.pressurePa;
        if (targetEnvTemp >= T_crit && pressure >= P_crit) {
            isSupercritical = true;
        }
    }

    // --- STATE MACHINE (SCF Transitions & Standard) ---
    let phase: MatterState = detectedPhase;
    let scfTransitionProgress = 0;

    // SCF LOGIC
    if (isSupercritical) {
        // ENTERING or STAYING SCF
        if (!simState.isTransitioning && simState.lastStableState !== MatterState.SUPERCRITICAL) {
            simState.isTransitioning = true;
            simState.transitionStartTime = simState.simTime;
            simState.lastStableState = phase; // Source Phase

            const currentCp = phase === MatterState.GAS ? C_GAS : C_LIQUID;
            const elementInertia = (element.mass / 20) * (currentCp / 1000);
            const physicsCalculatedTime = (0.6 * Math.max(0.8, elementInertia)) / timeScale;

            const isComingFromLiquid = simState.lastStableState === MatterState.LIQUID ||
                simState.lastStableState === MatterState.SOLID ||
                simState.lastStableState === MatterState.MELTING ||
                simState.lastStableState === MatterState.BOILING;

            const minDuration = isComingFromLiquid ? 2.5 : 1.0;
            simState.transitionDuration = Math.max(minDuration, physicsCalculatedTime);
        }

        const elapsed = simState.simTime - simState.transitionStartTime;
        const progress = Math.min(1, elapsed / simState.transitionDuration);
        scfTransitionProgress = progress;

        const isTimerDone = progress >= 1;
        const isSettled = simState.areAllParticlesSettled;

        const requiresMechanicalLock = simState.lastStableState !== MatterState.GAS;
        const isReady = requiresMechanicalLock ? (isTimerDone && isSettled) : isTimerDone;

        if (!isReady) {
            phase = MatterState.TRANSITION_SCF;
        } else {
            phase = MatterState.SUPERCRITICAL;
            simState.isTransitioning = false;
            simState.lastStableState = MatterState.SUPERCRITICAL;
        }
    } else {
        // EXITING SCF (or Normal)
        if (simState.lastStableState === MatterState.SUPERCRITICAL) {
            if (!simState.isTransitioning) {
                simState.isTransitioning = true;
                simState.transitionStartTime = simState.simTime;
                simState.transitionDuration = Math.max(1.0, 2.0 / timeScale);
            }

            const elapsed = simState.simTime - simState.transitionStartTime;
            const progress = Math.min(1, elapsed / simState.transitionDuration);
            scfTransitionProgress = 1 - progress;

            if (progress < 1) {
                phase = MatterState.TRANSITION_SCF;
            } else {
                simState.isTransitioning = false;
                simState.lastStableState = detectedPhase;
                phase = detectedPhase;
            }
        }
    }

    // --- THERMAL POWER INPUT ---
    const targetRounded = Math.round(targetEnvTemp);
    const meltRounded = Math.round(T_melt);
    const boilRounded = Math.round(T_boil);
    const subRounded = Math.round(T_sub);

    // TRIPLE POINT DETECTION
    let isTriplePoint = false;
    if (triplePoint && !isSupercritical && !isSublimationRegime) {
        const tDiff = Math.abs(targetEnvTemp - triplePoint.tempK);
        const pRatio = Math.max(pressure, triplePoint.pressurePa) / Math.min(pressure, triplePoint.pressurePa);
        if (tDiff < 1.0 && pRatio < 1.1) {
            isTriplePoint = true;
        }
    }

    // SUBLIMATION EQUILIBRIUM
    const isEquilibriumSub = isSublimationRegime && targetRounded === subRounded;
    const isEquilibriumMelt = !isSupercritical && !isSublimationRegime && !isTriplePoint && targetRounded === meltRounded;
    const isEquilibriumBoil = !isSupercritical && !isSublimationRegime && !isTriplePoint && targetRounded === boilRounded;

    let powerInput = 0;

    if (isTriplePoint) {
        // ... Triple Point Logic ...
        const time = simState.simTime;
        const oscillation = Math.sin(time * 1.5);
        const tripleMeltRatio = 0.675 + (oscillation * 0.075);
        const H_melt_end = (SAMPLE_MASS * C_SOLID * T_melt) + (SAMPLE_MASS * L_FUSION);
        const targetEnthalpy = H_melt_end;
        powerInput = (targetEnthalpy - simState.enthalpy) * 2.0;
        phase = MatterState.EQUILIBRIUM_TRIPLE;
        currentTemp = T_melt;
        meltProgress = tripleMeltRatio;
        boilProgress = 0.15;
        sublimationProgress = 0;

    } else if (isEquilibriumSub) {
        // SUBLIMATION EQUILIBRIUM LOGIC
        const time = simState.simTime;
        const oscillation = Math.sin(time * 1.5);
        const targetRatio = 0.5 + (oscillation * 0.2); // Oscillate roughly half-sublimated
        // Re-calculate enthalpy bounds for sub
        const L_SUB = L_FUSION + L_VAPORIZATION;
        const H_sub_start = SAMPLE_MASS * C_SOLID * T_sub;
        const targetEnthalpy = H_sub_start + (SAMPLE_MASS * L_SUB * targetRatio);

        powerInput = (targetEnthalpy - simState.enthalpy) * 5.0;
        phase = MatterState.EQUILIBRIUM_SUB;
        currentTemp = T_sub;
        sublimationProgress = targetRatio;

    } else if (isEquilibriumMelt) {
        const time = simState.simTime;
        const oscillation = Math.sin(time * 1.5);
        const targetRatio = 0.45 + (oscillation * 0.25);
        const H_melt_start = SAMPLE_MASS * C_SOLID * T_melt;
        const targetEnthalpy = H_melt_start + (SAMPLE_MASS * L_FUSION * targetRatio);
        powerInput = (targetEnthalpy - simState.enthalpy) * 5.0;
        phase = MatterState.EQUILIBRIUM_MELT;
        currentTemp = T_melt;
        meltProgress = targetRatio;

    } else if (isEquilibriumBoil) {
        const time = simState.simTime;
        const oscillation = Math.sin(time * 2.5);
        const targetRatio = 0.25 + (oscillation * 0.15); // Gas Ratio
        const H_melt_end = (SAMPLE_MASS * C_SOLID * T_melt) + (SAMPLE_MASS * L_FUSION);
        const H_boil_start = H_melt_end + (SAMPLE_MASS * C_LIQUID * (T_boil - T_melt));
        const targetEnthalpy = H_boil_start + (SAMPLE_MASS * L_VAPORIZATION * targetRatio);
        powerInput = (targetEnthalpy - simState.enthalpy) * 5.0;
        phase = MatterState.EQUILIBRIUM_BOIL;
        currentTemp = T_boil;
        boilProgress = targetRatio;

    } else {
        let activeSpecificHeat = C_SOLID;
        if (phase === MatterState.LIQUID) activeSpecificHeat = C_LIQUID;
        if (phase === MatterState.GAS || phase === MatterState.SUPERCRITICAL) activeSpecificHeat = C_GAS;
        if (phase === MatterState.MELTING || phase === MatterState.BOILING) activeSpecificHeat = C_LIQUID;
        // Approximation for Sublimation phase
        if (phase === MatterState.SUBLIMATION) activeSpecificHeat = (C_SOLID + C_GAS) / 2;

        const thermalMass = SAMPLE_MASS * activeSpecificHeat;
        powerInput = (thermalMass / THERMAL_TAU) * (targetEnvTemp - currentTemp);
    }

    // Update State Enthalpy
    simState.enthalpy += powerInput * dt;
    if (simState.enthalpy < 0) simState.enthalpy = 0;

    return {
        phase,
        detectedPhase,
        currentTemp,
        meltingPointCurrent: T_melt,
        boilingPointCurrent: T_boil,
        sublimationPointCurrent: T_sub,
        meltProgress,
        boilProgress,
        sublimationProgress,
        scfTransitionProgress,
        powerInput
    };
};
