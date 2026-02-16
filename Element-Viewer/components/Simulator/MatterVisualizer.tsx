
import React, { useMemo } from 'react';
import { PhysicsState, ChemicalElement, MatterState, ParticleState, ViewBoxDimensions } from '../../types';
import { MATTER_PATH_FRAMES } from '../../data/elements';
import { interpolatePath, interpolateColor, interpolateValue } from '../../utils/interpolator';
import { getMolecularSymbol } from '../../utils/physicsUtils';

interface Props {
    physics: PhysicsState;
    element: ChemicalElement;
    showParticles: boolean;
    viewBounds: ViewBoxDimensions;
    totalElements: number;
    onInspect?: (e: React.MouseEvent, physics: PhysicsState) => void;
}

const MatterVisualizer: React.FC<Props> = ({ physics, element, showParticles, viewBounds, totalElements, onInspect }) => {
    const { pathProgress, state, particles, boilProgress, meltProgress, matterRect, gasBounds, scfOpacity, simTime, sublimationProgress } = physics;

    // --- 1. SVG Path Interpolator (Puddle / Solid) ---
    const currentPath = useMemo(() => {
        // pathProgress goes 0 -> 10
        const frameIndex = Math.min(Math.floor(pathProgress), MATTER_PATH_FRAMES.length - 2);
        const nextFrameIndex = frameIndex + 1;
        const progressInFrame = pathProgress - frameIndex;

        const d1 = MATTER_PATH_FRAMES[frameIndex];
        const d2 = MATTER_PATH_FRAMES[nextFrameIndex];

        if (!d1 || !d2) return MATTER_PATH_FRAMES[0];
        return interpolatePath(d1, d2, progressInFrame);
    }, [pathProgress]);

    // --- DNA Visual Properties (Dynamic from JSON) ---
    const { solid, liquid, gas } = element.visualDNA;

    // --- Dynamic Color & Opacity Logic ---
    const bulkVisuals = useMemo(() => {
        // 1. Determine base Visual DNA based on state
        let targetVisual = solid;
        if (state === MatterState.LIQUID || state === MatterState.BOILING || state === MatterState.EQUILIBRIUM_BOIL || state === MatterState.EQUILIBRIUM_TRIPLE) {
            targetVisual = liquid;
        } else if (state === MatterState.GAS || state === MatterState.SUPERCRITICAL || state === MatterState.TRANSITION_SCF) {
            targetVisual = gas;
        } else if (state === MatterState.SUBLIMATION || state === MatterState.EQUILIBRIUM_SUB) {
            // Sublimation starts as Solid color
            targetVisual = solid;
        }

        // 2. Interpolate if Melting
        let finalOpacity = targetVisual.opacidade;
        let finalFill = targetVisual.color;

        if (state === MatterState.MELTING || state === MatterState.EQUILIBRIUM_MELT) {
            finalOpacity = interpolateValue(solid.opacidade, liquid.opacidade, meltProgress);
            finalFill = interpolateColor(solid.color, liquid.color, meltProgress);
        }

        // Triple Point interpolation
        if (state === MatterState.EQUILIBRIUM_TRIPLE) {
            const tProgress = Math.min(1, Math.max(0, meltProgress));
            finalOpacity = interpolateValue(solid.opacidade, liquid.opacidade, tProgress);
            finalFill = interpolateColor(solid.color, liquid.color, tProgress);
        }

        // X-Ray Mode Override
        if (showParticles) {
            return { fill: finalFill, opacity: 0.3 };
        }

        return {
            fill: finalFill,
            opacity: finalOpacity
        };
    }, [state, meltProgress, solid, liquid, gas, showParticles]);

    // --- VISIBILITY LOGIC ---
    const hasTrappedParticles = useMemo(() => {
        return particles.some(p => p.state === ParticleState.TRAPPED);
    }, [particles]);

    const hasLiquidParticles = useMemo(() => {
        return particles.some(p => p.state === ParticleState.TRAPPED || p.state === ParticleState.CONDENSING);
    }, [particles]);

    const shouldShowPuddle =
        state === MatterState.SOLID ||
        state === MatterState.MELTING ||
        state === MatterState.EQUILIBRIUM_MELT ||
        state === MatterState.LIQUID ||
        state === MatterState.EQUILIBRIUM_TRIPLE ||
        ((state === MatterState.BOILING || state === MatterState.EQUILIBRIUM_BOIL) && (boilProgress < 1.0 || hasTrappedParticles)) ||
        (state === MatterState.TRANSITION_SCF && hasLiquidParticles) ||
        (state === MatterState.GAS && hasLiquidParticles) ||
        // Sublimation Visibility
        ((state === MatterState.SUBLIMATION || state === MatterState.EQUILIBRIUM_SUB) && sublimationProgress < 1.0);

    const puddleOpacity = shouldShowPuddle && pathProgress < 9.9 ? bulkVisuals.opacity : 0;

    // --- Turbulence Scale Logic (Gradient based on Temperature) ---
    let displacementScale = 0;

    if (state === MatterState.SOLID || state === MatterState.MELTING || state === MatterState.EQUILIBRIUM_MELT) {
        displacementScale = 0;
    } else if (state === MatterState.LIQUID) {
        displacementScale = 0;
    } else if (state === MatterState.EQUILIBRIUM_TRIPLE) {
        displacementScale = 0.8;
    } else if (state === MatterState.BOILING || state === MatterState.EQUILIBRIUM_BOIL || state === MatterState.TRANSITION_SCF) {
        displacementScale = 5 + (boilProgress * 15);
    } else if (state === MatterState.SUBLIMATION || state === MatterState.EQUILIBRIUM_SUB) {
        // Mild shimmer for Sublimation
        displacementScale = 2 + (sublimationProgress * 2);
    } else {
        displacementScale = 0;
    }

    // --- ANIMATION VALUES ---
    const hazeFreq = 0.02 + (0.01 * Math.abs(Math.sin(simTime * 0.3)));
    const boilingSeed = Math.floor(simTime * 60) % 100;
    const steamFreq = 0.02 + (0.005 * Math.abs(Math.sin(simTime * 0.5)));
    const scfSeed = Math.floor(simTime * 20) % 100;
    const scfNoiseSeed = Math.floor(simTime * 15) % 100;

    // --- FILTER ACTIVATION LOGIC ---
    const showBoilingEffect =
        state === MatterState.BOILING ||
        state === MatterState.EQUILIBRIUM_BOIL ||
        state === MatterState.TRANSITION_SCF ||
        state === MatterState.EQUILIBRIUM_TRIPLE ||
        state === MatterState.SUBLIMATION ||
        state === MatterState.EQUILIBRIUM_SUB;

    const showSteamBlur =
        state === MatterState.BOILING ||
        state === MatterState.EQUILIBRIUM_BOIL ||
        state === MatterState.TRANSITION_SCF ||
        state === MatterState.EQUILIBRIUM_TRIPLE ||
        state === MatterState.SUBLIMATION ||
        state === MatterState.EQUILIBRIUM_SUB;


    // --- STEP 3: FORCE VISUAL SYNC ---
    // Sublimation has fixed width (120->134ish) and height handled by matterRect directly in SimulationUnit via usePhysics geometry output.
    // We use standard ref dimensions here for scaling correction, but since Sublimation forces Path 0,
    // we need to be careful. Path 0 is roughly 120x120.

    // Standard logic:
    let refWidth = 120 + (180 * meltProgress);
    let refHeight = 120 - (70 * meltProgress);

    if (state === MatterState.SUBLIMATION || state === MatterState.EQUILIBRIUM_SUB) {
        refWidth = 120; // Path 0 Width
        refHeight = 120; // Path 0 Height
    }

    const scaleX = matterRect ? matterRect.w / refWidth : 1;
    const scaleY = matterRect ? matterRect.h / refHeight : 1;

    const centerX = 200;
    const centerY = 300;

    const isMetallic = ['metal', 'metalloid'].includes(element.category);
    const viewBoxString = `${viewBounds.minX} ${viewBounds.minY} ${viewBounds.width} ${viewBounds.height}`;

    const displaySymbol = useMemo(() => {
        return getMolecularSymbol(element, physics.temperature);
    }, [element, physics.temperature]);

    const handleInteraction = (e: React.MouseEvent) => {
        if (onInspect) {
            e.stopPropagation();
            onInspect(e, physics);
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden select-none">

            <svg
                width="100%"
                height="100%"
                viewBox={viewBoxString}
                preserveAspectRatio="xMidYMid meet"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full z-10"
            >
                <defs>
                    <radialGradient id={`metalSpot-${element.symbol}`} cx="30%" cy="30%" r="80%" fx="20%" fy="20%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.6" />
                        <stop offset="40%" stopColor="white" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="black" stopOpacity="0.1" />
                    </radialGradient>

                    <linearGradient id={`metalSpread-${element.symbol}`} x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.0" />
                        <stop offset="50%" stopColor="white" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="white" stopOpacity="0.0" />
                    </linearGradient>

                    <filter id={`contactShadow-${element.symbol}`}>
                        <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
                    </filter>

                    <filter id={`heatHaze-${element.symbol}`}>
                        <feTurbulence type="fractalNoise" baseFrequency={hazeFreq} numOctaves="2" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale={displacementScale > 5 ? 5 : 0} />
                    </filter>

                    <filter id={`boilingEffect-${element.symbol}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed={boilingSeed} />
                        <feDisplacementMap in="SourceGraphic" scale={displacementScale} xChannelSelector="R" yChannelSelector="G" />
                    </filter>

                    <filter id={`steamBlur-${element.symbol}`} x="-200%" y="-200%" width="500%" height="500%" filterUnits="objectBoundingBox">
                        <feTurbulence type="fractalNoise" baseFrequency={steamFreq} numOctaves="4" seed="2" result="cloudNoise" />
                        <feDisplacementMap in="SourceGraphic" in2="cloudNoise" scale="80" xChannelSelector="R" yChannelSelector="G" result="puddleExplosion" />
                        <feComposite operator="in" in="cloudNoise" in2="puddleExplosion" result="texturedVapor" />
                        <feOffset in="texturedVapor" dx="0" dy="-30" result="risingVapor" />
                        <feGaussianBlur in="risingVapor" stdDeviation="18" result="finalGasRaw" />
                        <feMorphology in="SourceAlpha" operator="dilate" radius="60" result="expandedBase" />
                        <feGaussianBlur in="expandedBase" stdDeviation="40" result="softFadeMask" />
                        <feComposite in="finalGasRaw" in2="softFadeMask" operator="in" result="finalGasFaded" />
                        <feColorMatrix in="finalGasFaded" type="matrix" values="1 0 0 0 0.95 0 1 0 0 0.95 0 0 1 0 0.95 0 0 0 1 0" />
                    </filter>

                    {/* SUPERCRITICAL NEBULA NOISE FILTER (Organic Cloud) */}
                    <filter id={`scfNoise-${element.symbol}`} x="-20%" y="-20%" width="140%" height="140%">
                        {/* 1. Internal Texture */}
                        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed={scfNoiseSeed} result="noise" />
                        <feColorMatrix in="noise" type="matrix" values="1 0 0 0 0.9   0 1 0 0 0.9   0 0 1 0 0.9  0 0 0 1 0" result="coloredNoise" />

                        {/* 2. Soft Mask Generation */}
                        <feGaussianBlur in="SourceAlpha" stdDeviation="15" result="softEdge" />
                        <feComposite in="coloredNoise" in2="softEdge" operator="in" result="softCloud" />

                        {/* 3. Edge Distortion */}
                        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed={scfSeed} result="edgeNoise" />
                        <feDisplacementMap in="softCloud" in2="edgeNoise" scale="20" xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                </defs>

                {/* Dynamic Pressure Volume Box / Background (Bounds) */}
                {(state === MatterState.GAS || state === MatterState.BOILING || state === MatterState.EQUILIBRIUM_BOIL || state === MatterState.EQUILIBRIUM_TRIPLE || state === MatterState.SUPERCRITICAL || state === MatterState.TRANSITION_SCF || state === MatterState.SUBLIMATION || state === MatterState.EQUILIBRIUM_SUB) && gasBounds && (
                    <>
                        {/* 1. SUPERCRITICAL FOG LAYER (NEBULA) */}
                        <rect
                            x={gasBounds.minX - 20}
                            y={gasBounds.minY - 20}
                            width={(gasBounds.maxX - gasBounds.minX) + 40}
                            height={(gasBounds.maxY - gasBounds.minY) + 40}
                            fill={element.visualDNA.gas.color}
                            opacity={scfOpacity}
                            filter={`url(#scfNoise-${element.symbol})`}
                            className="transition-opacity duration-300"
                            pointerEvents="none"
                        />

                        {/* 2. Dotted Outline - Fixed real-time sync by removing CSS transitions on geometry */}
                        <rect
                            x={gasBounds.minX}
                            y={gasBounds.minY}
                            width={gasBounds.maxX - gasBounds.minX}
                            height={gasBounds.maxY - gasBounds.minY}
                            fill="transparent"
                            stroke="#64748b"
                            strokeWidth="2"
                            strokeDasharray="6,6"
                            opacity={0.1}
                            pointerEvents="all"
                            onClick={handleInteraction}
                            className="cursor-help"
                        />
                    </>
                )}

                {/* --- BULK MATTER (PUDDLE) GROUP --- */}
                <g transform={`translate(${centerX}, ${centerY}) scale(${scaleX}, ${scaleY})`}>
                    <path
                        d={currentPath}
                        fill="#0f172a"
                        filter={`url(#contactShadow-${element.symbol})`}
                        opacity={puddleOpacity * 0.5}
                    />

                    <path
                        d={currentPath}
                        fill={gas.color}
                        filter={`url(#steamBlur-${element.symbol})`}
                        opacity={showSteamBlur && puddleOpacity > 0 ? 1 : 0}
                        className="transition-opacity duration-700"
                        pointerEvents="none"
                    />

                    {/* 1. BASE MATERIAL LAYER (Interactive) */}
                    <path
                        d={currentPath}
                        fill={bulkVisuals.fill}
                        stroke={isMetallic ? "rgba(255,255,255,0.4)" : "#475569"}
                        strokeWidth="0.5"
                        opacity={puddleOpacity}
                        filter={showBoilingEffect ? `url(#boilingEffect-${element.symbol})` : undefined}
                        className="transition-colors duration-200 cursor-help"
                        onClick={handleInteraction}
                    />

                    {/* 2. SPECULAR SHINE LAYERS */}
                    {isMetallic && state !== MatterState.GAS && state !== MatterState.SUPERCRITICAL && state !== MatterState.SUBLIMATION && state !== MatterState.EQUILIBRIUM_SUB && (
                        <>
                            <path
                                d={currentPath}
                                fill={`url(#metalSpot-${element.symbol})`}
                                style={{ mixBlendMode: 'overlay' }}
                                opacity={puddleOpacity}
                                pointerEvents="none"
                                filter={showBoilingEffect ? `url(#boilingEffect-${element.symbol})` : undefined}
                            />
                            <path
                                d={currentPath}
                                fill={`url(#metalSpread-${element.symbol})`}
                                style={{ mixBlendMode: 'overlay' }}
                                opacity={puddleOpacity}
                                pointerEvents="none"
                                filter={showBoilingEffect ? `url(#boilingEffect-${element.symbol})` : undefined}
                            />
                        </>
                    )}
                </g>

                {/* --- PARTICLE SYSTEM LAYER --- */}
                <g filter={`url(#heatHaze-${element.symbol})`} pointerEvents="none">
                    {particles.map((p) => {
                        // VISIBILITY FIX:
                        // Only hide particles if they are TRAPPED inside the bulk solid/liquid.
                        // Free floating (GAS, RISING) or Condensing particles should be visible.
                        const isHiddenStrict = !showParticles && p.state === ParticleState.TRAPPED;

                        if (isHiddenStrict) return null;

                        let fill = gas.color;
                        let opacity = gas.opacidade;
                        let renderX = p.x;
                        let renderY = p.y;

                        if (p.state === ParticleState.RISING || p.state === ParticleState.CONDENSING) {
                            fill = liquid.color;
                            opacity = liquid.opacidade;
                        }

                        if (state === MatterState.SUBLIMATION || state === MatterState.EQUILIBRIUM_SUB) {
                            if (p.state === ParticleState.RISING || p.state === ParticleState.CONDENSING) {
                                fill = gas.color; // Sublimation creates gas directly, and condensation is gas -> solid
                                opacity = gas.opacidade;
                            }
                        }

                        if (p.state === ParticleState.TRAPPED) {
                            fill = state === MatterState.SOLID || state === MatterState.SUBLIMATION || state === MatterState.EQUILIBRIUM_SUB ? solid.color : liquid.color;
                            opacity = 0.9;

                            const vibrationAmp = Math.sqrt(physics.temperature) * 0.15;
                            const time = physics.simTime * 25;
                            const jitterX = Math.sin(time + p.id * 123) * vibrationAmp;
                            const jitterY = Math.cos(time + p.id * 321) * vibrationAmp;
                            renderX += jitterX;
                            renderY += jitterY;
                        }

                        return (
                            <circle
                                key={p.id}
                                cx={renderX}
                                cy={renderY}
                                r={p.r}
                                fill={fill}
                                opacity={opacity}
                                className="transition-opacity duration-300"
                                stroke={p.state === ParticleState.TRAPPED ? 'rgba(0,0,0,0.2)' : 'none'}
                                strokeWidth="0.5"
                            />
                        );
                    })}
                </g>

                {/* --- HUD: CENTERED IDENTITY & MOLECULAR STATUS --- */}
                <g
                    transform="translate(200, 30)"
                    pointerEvents="all"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={handleInteraction}
                >

                    {/* 1. Identity Sphere */}
                    <circle
                        r="30"
                        fill={element.visualDNA.gas.color}
                        stroke="none"
                        strokeWidth="0"
                        opacity="1"
                        className="drop-shadow-xl"
                    />

                    {/* 2. Molecular Symbol */}
                    <text
                        y="2"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontFamily="sans-serif"
                        fontWeight="900"
                        fontSize="22"
                        fill="white"
                        stroke="black"
                        strokeWidth="1.2px"
                        style={{ paintOrder: 'stroke', userSelect: 'none' }}
                    >
                        {displaySymbol}
                    </text>

                    {/* 3. Phase Status */}
                    <text
                        y="45"
                        textAnchor="middle"
                        fontFamily="monospace"
                        fontWeight="bold"
                        fontSize="12"
                        letterSpacing="1px"
                        style={{ userSelect: 'none', textShadow: '0px 2px 4px rgba(0,0,0,0.5)' }}
                        fill={
                            state === MatterState.SUPERCRITICAL || state === MatterState.TRANSITION_SCF ? '#EF4444' :
                                state === MatterState.EQUILIBRIUM_MELT ? '#7DD3FC' :
                                    state === MatterState.EQUILIBRIUM_BOIL ? '#7DD3FC' :
                                        state === MatterState.EQUILIBRIUM_TRIPLE ? '#34D399' :
                                            state === MatterState.EQUILIBRIUM_SUB ? '#F472B6' : // Pink for Sublimation Eq
                                                state === MatterState.SUBLIMATION ? '#C084FC' : // Purple for Sublimation
                                                    (state === MatterState.MELTING || state === MatterState.BOILING) ? '#EAB308' :
                                                        state === MatterState.SOLID ? '#94A3B8' :
                                                            state === MatterState.LIQUID ? '#38BDF8' : '#A78BFA'
                        }
                    >
                        {state === MatterState.MELTING ? 'MELTING' :
                            state === MatterState.BOILING ? 'BOILING' :
                                state === MatterState.EQUILIBRIUM_MELT ? 'EQUILIBRIUM (SOLID + LIQUID)' :
                                    state === MatterState.EQUILIBRIUM_BOIL ? 'EQUILIBRIUM (LIQUID + GAS)' :
                                        state === MatterState.EQUILIBRIUM_TRIPLE ? 'THREE-PHASE SYSTEM (SOLID + LIQUID + GAS)' :
                                            state === MatterState.SUPERCRITICAL ? 'SUPERCRITICAL FLUID' :
                                                state === MatterState.TRANSITION_SCF ? 'SUPERCRITICAL FLUID (Transition)' :
                                                    state === MatterState.SUBLIMATION ? 'SUBLIMATION (SOLID -> GAS)' :
                                                        state === MatterState.EQUILIBRIUM_SUB ? 'SUBLIMATION EQUILIBRIUM' :
                                                            `${state} PHASE`}
                    </text>
                </g>

            </svg>
        </div>
    );
};

export default MatterVisualizer;
