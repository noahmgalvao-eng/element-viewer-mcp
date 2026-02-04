/**
 * Simple SVG Path Interpolator
 * Assumes path commands (M, C, L, Z) match exactly in number and order.
 */
export function interpolatePath(d1: string, d2: string, progress: number): string {
  // Regex to match numbers (integer or float, positive or negative)
  const numRegex = /[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/g;
  
  const nums1 = d1.match(numRegex)?.map(Number) || [];
  const nums2 = d2.match(numRegex)?.map(Number) || [];

  if (nums1.length !== nums2.length) {
    // console.warn("Path interpolation mismatch: different number of coordinates.");
    return d1; 
  }

  let i = 0;
  // Replace numbers in d1 structure with interpolated values
  return d1.replace(numRegex, () => {
    const val1 = nums1[i];
    const val2 = nums2[i];
    const result = val1 + (val2 - val1) * progress;
    i++;
    return result.toFixed(2);
  });
}

/**
 * Interpolates between multiple keyframes based on a 0-1 progress.
 * @param values Array of path strings
 * @param progress 0 to 1 (mapped to entire array range)
 */
export function interpolateKeyframes(values: string[], progress: number): string {
  if (values.length === 0) return '';
  if (values.length === 1) return values[0];

  // Clamp progress
  const p = Math.max(0, Math.min(1, progress));
  
  // Calculate which segment we are in
  const totalSegments = values.length - 1;
  const segmentIndex = Math.min(Math.floor(p * totalSegments), totalSegments - 1);
  const segmentProgress = (p * totalSegments) - segmentIndex;

  return interpolatePath(values[segmentIndex], values[segmentIndex + 1], segmentProgress);
}

export function interpolateValue(v1: number, v2: number, progress: number): number {
    return v1 + (v2 - v1) * progress;
}

/**
 * Interpolates between two Hex colors.
 */
export function interpolateColor(color1: string, color2: string, factor: number): string {
    const p = Math.max(0, Math.min(1, factor));
    
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');

    // Handle shorthand
    const c1 = hex1.length === 3 ? hex1.split('').map(x=>x+x).join('') : hex1;
    const c2 = hex2.length === 3 ? hex2.split('').map(x=>x+x).join('') : hex2;

    const r1 = parseInt(c1.substring(0, 2), 16);
    const g1 = parseInt(c1.substring(2, 4), 16);
    const b1 = parseInt(c1.substring(4, 6), 16);

    const r2 = parseInt(c2.substring(0, 2), 16);
    const g2 = parseInt(c2.substring(2, 4), 16);
    const b2 = parseInt(c2.substring(4, 6), 16);

    const r = Math.round(r1 + (r2 - r1) * p);
    const g = Math.round(g1 + (g2 - g1) * p);
    const b = Math.round(b1 + (b2 - b1) * p);

    const toHex = (n: number) => {
        const h = Math.max(0, Math.min(255, n)).toString(16);
        return h.length === 1 ? '0' + h : h;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Interpolates numeric values based on keyTimes.
 * Useful for syncing animation values to a specific progress timeline.
 */
export function interpolateScalarWithKeyTimes(values: number[], keyTimes: number[], progress: number): number {
    if (values.length !== keyTimes.length) return values[0];
    
    // Clamp
    const p = Math.max(0, Math.min(1, progress));
    
    let i = 0;
    while (i < keyTimes.length - 1 && p > keyTimes[i+1]) {
        i++;
    }
    
    const t1 = keyTimes[i];
    const t2 = keyTimes[i+1];
    const v1 = values[i];
    const v2 = values[i+1];
    
    if (t2 === t1) return v2;

    const segmentProgress = (p - t1) / (t2 - t1);
    return v1 + (v2 - v1) * segmentProgress;
}