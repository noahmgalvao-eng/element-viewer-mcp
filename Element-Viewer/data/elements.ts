
import { ChemicalElement, ElementProperties } from "../types";
import { SOURCE_DATA } from "./periodic_table_source";
import { SCIENTIFIC_DATA } from "./scientific_data";
import { CUSTOM_DATA, SODIUM_FALLBACK, ElementCustomData } from "./elements-visuals";

// The 11 Frames extracted from the provided SVG liquid path (Preserved from original)
export const MATTER_PATH_FRAMES = [
  "M -60,-120 C -20,-120 20,-120 60,-120 C 60,-80 60,-40 60,0 C 20,0 -20,0 -60,0 C -60,-40 -60,-80 -60,-120 Z",
  "M -55,-100 C -20,-105 20,-105 55,-100 C 75,-60 75,-30 70,0 C 20,5 -20,5 -70,0 C -75,-30 -75,-60 -55,-100 Z",
  "M -80,-60 C -40,-70 40,-60 80,-55 C 100,-30 110,-10 100,0 C 40,5 -40,5 -100,0 C -110,-10 -100,-30 -80,-60 Z",
  "M -100,-35 C -50,-45 50,-40 100,-30 C 115,-15 110,5 90,5 C 40,8 -40,8 -90,5 C -110,5 -115,-15 -100,-35 Z",
  "M -130,-15 C -80,-25 -30,-30 20,-20 C 70,-10 120,-25 140,-10 C 150,5 130,15 0,15 C -130,15 -150,5 -130,-15 Z",
  "M -130,-15 C -90,-35 -40,-10 10,-25 C 60,-40 110,-15 140,-10 C 150,5 130,15 0,15 C -130,15 -150,5 -130,-15 Z",
  "M -91,-10 C -63,-24 -28,-7 7,-17 C 42,-28 77,-10 98,-7 C 105,3 91,10 0,10 C -91,10 -105,3 -91,-10 Z",
  "M -52,-6 C -36,-14 -16,-4 4,-10 C 24,-16 44,-6 56,-4 C 60,2 52,6 0,6 C -52,6 -60,2 -52,-6 Z",
  "M -19,-2 C -13,-5 -6,-1 1,-3 C 9,-6 16,-2 21,-1 C 22,0 19,2 0,2 C -19,2 -22,0 -19,-2 Z",
  "M 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 Z",
  "M 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 C 0,0 0,0 0,0 Z"
];

// Adapter: Transform Raw JSON (Layer 1) + Scientific (Layer 2) + Custom (Layer 3)
export const ELEMENTS: ChemicalElement[] = SOURCE_DATA.elements.map((source: any) => {

  // 1. Setup Data Layers
  const symbol = source.symbol;

  // Layer 2: Scientific Data (Physics + Color)
  const scientific = (SCIENTIFIC_DATA as any)[symbol];

  // Layer 3: Custom Data (Legacy Props + Simulation Tuning)
  const customData: ElementCustomData = CUSTOM_DATA[symbol] || SODIUM_FALLBACK;

  // Helper for Layer 3 retention & Safety Fallbacks
  const baseLegacyProps = SODIUM_FALLBACK.properties as ElementProperties;
  const specificLegacyProps = customData.properties || {};

  // HELPER: Sanity Check for Physics (Prevents 0/Infinity/NaN bugs)
  // If scientific data is missing or 0, fallback to Sodium defaults (Layer 3 base).
  const ensurePhysical = (val: number | undefined | null, fallback: number): number => {
    // Handles "N/A" which results in NaN after simple casting
    if (typeof val === 'string' && val === 'N/A') return fallback;
    if (typeof val === 'number' && !isNaN(val) && val > 0) return val;
    return fallback;
  };

  // HELPER: Parse Scientific Values (handles '*', 'N/A', '<', '>', '~', and numeric suffixes like '_5')
  const parseSciValue = (input: string | number | undefined, fallback: number) => {
    if (input === undefined || input === null) return { val: fallback, str: undefined, source: undefined };

    // If explicit N/A, return fallback for physics, but 'N/A' string for Display
    if (input === "N/A") return { val: fallback, str: "N/A", source: undefined };

    if (typeof input === 'number') return { val: input, str: input.toString(), source: undefined };

    let str = input.toString();

    // 1. Extract Source Suffix (e.g. "_2" or "_10")
    let sourceId: number | undefined = undefined;
    const suffixMatch = str.match(/_(\d+)$/);
    if (suffixMatch) {
      sourceId = parseInt(suffixMatch[1], 10);
      str = str.replace(/_(\d+)$/, ''); // Remove suffix for parsing
    }

    // 2. Parse Value (Handle special chars)
    // Remove '*', '<', '>', '~' for numeric parsing, but keep logic in mind
    // keeping str as is (minus suffix) for display is usually good, but we might want to clean * for display?
    // The previous code kept * in str for display.
    const cleanStr = str.replace(/[*<>~]/g, '');
    const val = parseFloat(cleanStr);

    const isValid = !isNaN(val) && val >= 0;

    return {
      val: isValid ? val : fallback,
      str: str, // Keep original string (e.g. "< 1e-5*") for display
      source: sourceId
    };
  };

  // 2. Resolve Base Properties (Layer 1 Corrections)
  let resolvedDensity = source.density;
  if (source.phase === "Gas" && source.density) {
    resolvedDensity = source.density / 1000;
  }

  // Physics Density (with fallback)
  const physicsDensity = resolvedDensity || baseLegacyProps.density || 1.0;
  // Display Density (Raw)
  const displayDensity = resolvedDensity ? `${resolvedDensity} g/cm³` : 'N/A';

  // Parse Specific Heats (Layer 2)
  const shSolid = parseSciValue(scientific?.specificHeat?.solid, baseLegacyProps.specificHeatSolid);
  const shLiquid = parseSciValue(scientific?.specificHeat?.liquid, baseLegacyProps.specificHeatLiquid);
  const shGas = parseSciValue(scientific?.specificHeat?.gas, baseLegacyProps.specificHeatGas);

  // Parse Latent Heats (Layer 2)
  const lhFusion = parseSciValue(scientific?.latentHeat?.fusion, baseLegacyProps.latentHeatFusion);
  const lhVap = parseSciValue(scientific?.latentHeat?.vaporization, baseLegacyProps.latentHeatVaporization);

  // Parse Others
  const thermCondRaw = scientific?.thermalConductivity;
  const thermCond = parseSciValue(thermCondRaw, baseLegacyProps.thermalConductivity || 10);

  const atRadRaw = scientific?.atomicRadiusPm;
  const atRad = parseSciValue(atRadRaw, baseLegacyProps.atomicRadiusPm!);

  // Phase Temps (Prioritize Scientific Data)
  const rawMelt = scientific?.phaseTemperatures?.meltingK ?? source.melt;
  const rawBoil = scientific?.phaseTemperatures?.boilingK ?? source.boil;

  const meltTemp = parseSciValue(rawMelt, baseLegacyProps.meltingPointK);
  const boilTemp = parseSciValue(rawBoil, 9999);

  // --- TRIPLE POINT PARSING (Official Source) ---
  const scientificTemps = scientific?.phaseTemperatures;

  // Temp Parsing (Sentinel -999)
  let tpTempRes = parseSciValue(scientificTemps?.triplePointTempK, -999);
  let tpTemp = tpTempRes.val;
  let tpTempStr = tpTempRes.str;
  let tpSource = tpTempRes.source;

  if (tpTemp === -999) {
    // Fallback: If N/A or Missing -> Use Melt Temp, add *, remove source
    tpTemp = meltTemp.val;
    tpTempStr = `${meltTemp.val}*`;
    tpSource = undefined;
  }

  // Pressure Parsing (Sentinel -999, Input is kPa)
  let tpPressRes = parseSciValue(scientificTemps?.triplePointPressKPa, -999);
  let tpPress = tpPressRes.val;
  let tpPressStr = tpPressRes.str;

  if (tpPress === -999) {
    // Fallback: If N/A -> 0, add *, remove source if it was inherited
    tpPress = 0;
    tpPressStr = "0*";
    // Don't use source for estimated N/A
    if (tpTemp === -999) tpSource = undefined; // If both estimated
  } else {
    tpPress = tpPress * 1000; // Convert kPa to Pa
    // If we didn't have a source from Temp (unlikely if Press exists), take from Press
    if (!tpSource) tpSource = tpPressRes.source;
  }

  // Construct Triple Point Object
  // Always object if valid or estimated
  const triplePointObj = { tempK: tpTemp, pressurePa: tpPress };

  // Oxidation States Handling
  // Scientific data might have string "N/A" instead of array
  const rawOx = scientific?.oxidationStates;
  const physicsOx = Array.isArray(rawOx) ? rawOx : []; // Fallback to empty array for physics
  const displayOx = Array.isArray(rawOx) ? rawOx.join(", ") : (rawOx || "N/A");

  // Ionization & Electron Affinity
  const rawIon = source.ionization_energies;
  const displayIon = rawIon && rawIon.length > 0 ? rawIon[0] : "N/A";
  const displayAffinity = source.electron_affinity !== undefined && source.electron_affinity !== null ? source.electron_affinity : "N/A";
  const displayElectronegativity = source.electronegativity_pauling !== undefined && source.electronegativity_pauling !== null ? source.electronegativity_pauling : "N/A";

  // Bulk Modulus (Layer 3)
  const rawBulk = specificLegacyProps.bulkModulusGPa;
  const displayBulk = rawBulk !== undefined ? `${rawBulk} GPa` : "N/A";

  // MASS PARSING
  const massRes = parseSciValue(scientific?.mass, source.atomic_mass);

  // 3. Construct Properties Object adhering to Merge Strategy
  const properties: ElementProperties = {
    // --- BASE IDENTITY (Layer 1 + Layer 2 Temperatures) ---
    meltingPointK: ensurePhysical(meltTemp.val, baseLegacyProps.meltingPointK),
    boilingPointK: ensurePhysical(boilTemp.val, 9999),
    meltingPointSource: meltTemp.source,
    boilingPointSource: boilTemp.source,

    // DISPLAY FIELDS (Strictly Source/Scientific)
    meltingPointDisplay: meltTemp.str ? `${meltTemp.str} K` : 'N/A',
    boilingPointDisplay: boilTemp.str ? `${boilTemp.str} K` : 'N/A',
    densityDisplay: displayDensity,
    atomicRadiusDisplay: atRad.str ? `${atRad.str} pm` : 'N/A',
    electronegativityDisplay: String(displayElectronegativity),
    electronAffinityDisplay: displayAffinity !== "N/A" ? `${displayAffinity} kJ/mol` : "N/A",
    ionizationEnergyDisplay: displayIon !== "N/A" ? `${displayIon} kJ/mol` : "N/A",
    oxidationStatesDisplay: displayOx,
    thermalConductivityDisplay: thermCond.str ? `${thermCond.str} W/mK` : 'N/A',
    bulkModulusDisplay: displayBulk,
    electricalConductivityDisplay: 'N/A', // Not currently in scientific data source, kept as fallback for UI if added later

    density: physicsDensity,
    electronegativity: source.electronegativity_pauling || 0,
    electronConfiguration: source.electron_configuration_semantic,
    electronAffinity: source.electron_affinity || 0,
    ionizationEnergy: source.ionization_energies ? source.ionization_energies[0] : 0,

    // --- NEW PHYSICS (Layer 2 - Scientific Data with Safety Fallbacks) ---
    // CRITICAL FIX: Never allow these to be 0 for simulation stability.
    specificHeatSolid: shSolid.val,
    specificHeatLiquid: shLiquid.val,
    specificHeatGas: shGas.val,
    // Store Display Strings (for *, N/A)
    specificHeatSolidDisplay: shSolid.str,
    specificHeatLiquidDisplay: shLiquid.str,
    specificHeatGasDisplay: shGas.str,
    // Sources
    specificHeatSolidSource: shSolid.source,
    specificHeatLiquidSource: shLiquid.source,
    specificHeatGasSource: shGas.source,

    thermalConductivity: thermCond.val,
    thermalConductivitySource: thermCond.source,

    atomicRadiusPm: ensurePhysical(atRad.val, baseLegacyProps.atomicRadiusPm!),
    atomicRadiusSource: atRad.source,

    oxidationStates: physicsOx,

    // LATENT HEAT
    latentHeatFusion: lhFusion.val,
    latentHeatVaporization: lhVap.val,
    // Display strings
    latentHeatFusionDisplay: lhFusion.str,
    latentHeatVaporizationDisplay: lhVap.str,
    // Sources
    latentHeatFusionSource: lhFusion.source,
    latentHeatVaporizationSource: lhVap.source,

    // --- RETAINED LEGACY (Layer 3 - Custom/Sodium Fallback) ---
    bulkModulusGPa: specificLegacyProps.bulkModulusGPa ?? baseLegacyProps.bulkModulusGPa,
    criticalPoint: specificLegacyProps.criticalPoint ?? baseLegacyProps.criticalPoint,

    // Triple Point: Use Calculated from Scientific Data
    triplePoint: triplePointObj,
    triplePointSource: tpSource,
    triplePointTempDisplay: tpTempStr,
    triplePointPressDisplay: tpPressStr,

    // Simulation Tuning Parameters (Always Layer 3)
    simonA_Pa: specificLegacyProps.simonA_Pa ?? baseLegacyProps.simonA_Pa,
    simonC: specificLegacyProps.simonC ?? baseLegacyProps.simonC,

    // Optional Enthalpy Overrides
    enthalpyFusionJmol: specificLegacyProps.enthalpyFusionJmol ?? baseLegacyProps.enthalpyFusionJmol,
    enthalpyVapJmol: specificLegacyProps.enthalpyVapJmol,
  };

  // 4. Construct Visual DNA (Strictly from Layer 2 Scientific Data)
  const elementColor = scientific?.color || "#94a3b8"; // Default to Slate-400 if missing (e.g. Uue)

  const generatedVisualDNA = {
    solid: { color: elementColor, opacidade: 1.0 },
    liquid: { color: elementColor, opacidade: 1.0 },
    gas: { color: elementColor, opacidade: 1.0 }
  };

  return {
    atomicNumber: source.number,
    symbol: source.symbol,
    name: source.name, // DIRECT FROM SOURCE
    summary: source.summary, // DIRECT FROM SOURCE

    classification: {
      group: String(source.group),
      groupBlock: source.block.toUpperCase(),
      groupName: customData.classification?.groupName || "Elemento Químico",
      period: source.period,
      electronShells: source.shells ? source.shells.length : 0
    },

    mass: massRes.val, // Use scientific val (or fallback)
    massSource: massRes.source, // NEW: Capture Source
    category: customData.category || SODIUM_FALLBACK.category || 'metal',

    properties,
    visualDNA: generatedVisualDNA,
    specialBehavior: customData.specialBehavior || SODIUM_FALLBACK.specialBehavior,
    molecularForms: customData.molecularForms || SODIUM_FALLBACK.molecularForms
  };
});