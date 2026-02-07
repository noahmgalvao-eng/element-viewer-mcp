
// Temperature Units
export type TempUnit = 'K' | 'C' | 'F' | 'Ra';

export const TEMP_UNITS: { value: TempUnit; label: string }[] = [
  { value: 'K', label: 'K' },
  { value: 'C', label: '°C' },
  { value: 'F', label: '°F' },
  { value: 'Ra', label: '°Ra' },
];

// Pressure Units
export type PressureUnit = 'Pa' | 'kPa' | 'MPa' | 'psi' | 'kgf_cm2' | 'inHg' | 'mmHg' | 'bar' | 'atm' | 'mmH2O';

export const PRESSURE_UNITS: { value: PressureUnit; label: string }[] = [
  { value: 'Pa', label: 'Pa' },
  { value: 'kPa', label: 'kPa' },
  { value: 'MPa', label: 'MPa' },
  { value: 'atm', label: 'atm' },
  { value: 'bar', label: 'bar' },
  { value: 'psi', label: 'psi' },
  { value: 'kgf_cm2', label: 'kgf/cm²' },
  { value: 'mmHg', label: 'mmHg' },
  { value: 'inHg', label: 'inHg' },
  { value: 'mmH2O', label: 'mmH₂O' },
];

// --- Temperature Conversion Logic ---

export const toKelvin = (value: number, from: TempUnit): number => {
  switch (from) {
    case 'K': return value;
    case 'C': return value + 273.15;
    case 'F': return (value - 32) * (5 / 9) + 273.15;
    case 'Ra': return value * (5 / 9);
    default: return value;
  }
};

export const fromKelvin = (valInKelvin: number, to: TempUnit): number => {
  switch (to) {
    case 'K': return valInKelvin;
    case 'C': return valInKelvin - 273.15;
    case 'F': return (valInKelvin - 273.15) * (9 / 5) + 32;
    case 'Ra': return valInKelvin * 1.8;
    default: return valInKelvin;
  }
};

// --- Pressure Conversion Logic ---

// Base is Pascal (Pa)
const P_FACTORS: Record<PressureUnit, number> = {
  Pa: 1,
  kPa: 1000,
  MPa: 1000000,
  bar: 100000,
  atm: 101325,
  psi: 6894.76,
  kgf_cm2: 98066.5,
  mmHg: 133.322,
  inHg: 3386.39,
  mmH2O: 9.80665,
};

export const toPascal = (value: number, from: PressureUnit): number => {
  return value * (P_FACTORS[from] || 1);
};

export const fromPascal = (valInPascal: number, to: PressureUnit): number => {
  return valInPascal / (P_FACTORS[to] || 1);
};