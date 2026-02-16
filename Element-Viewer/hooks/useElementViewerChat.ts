import React, { useEffect } from 'react';
import { useChatGPT } from './useChatGPT';
import { ChemicalElement, MatterState, PhysicsState } from '../types';
import { predictMatterState } from './physics/phaseCalculations';

interface UseElementViewerChatProps {
    globalTemperature: number;
    globalPressure: number;
    selectedElements: ChemicalElement[];
    // We need a way to get the *current* physics state of valid simulations
    simulationRegistry: React.MutableRefObject<Map<number, () => PhysicsState>>;
}

export function useElementViewerChat({
    globalTemperature,
    globalPressure,
    selectedElements,
    simulationRegistry
}: UseElementViewerChatProps) {

    const {
        displayMode,
        maxHeight,
        safeArea,
        isFullscreen,
        requestDisplayMode,
        sendFollowUpMessage
        // could add toolInput/toolOutput if we want to handle incoming requests
    } = useChatGPT();

    // Sync State to OpenAI (Optional - if we want the "Server" to know about client state via widgetState)
    // For now, we focus on the "Info" tool which uses prompt injection via `sendFollowUpMessage`

    const handleInfoClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!sendFollowUpMessage) {
            console.warn("ChatGPT SDK: sendFollowUpMessage not available");
            return;
        }

        const elementDataRequests = selectedElements.map(el => {
            const getter = simulationRegistry.current.get(el.atomicNumber);
            const currentState = getter ? getter() : null;

            // PREDICT TARGET
            const prediction = predictMatterState(el, globalTemperature, globalPressure);

            return {
                element: el,
                current: currentState,
                target: prediction
            };
        });

        // Construct Natural Language Prompt
        let prompt = `I am currently looking at the Element Viewer App.\n`;
        prompt += `Environment: Target Temperature ${globalTemperature.toFixed(1)} K, Pressure ${globalPressure.toExponential(2)} Pa.\n\n`;

        if (elementDataRequests.length === 1) {
            const data = elementDataRequests[0];
            const { element, current, target } = data;

            prompt += `I am viewing **${element.name} (${element.symbol})**.\n`;

            if (current) {
                prompt += `Current State: **${current.state}** at ${current.temperature.toFixed(1)} K.\n`;

                // Compare Current vs Target
                const tempDiff = globalTemperature - current.temperature;
                if (Math.abs(tempDiff) < 1.0 && current.state === target.state) {
                    prompt += `Status: The system is in **Equilibrium/Static**. It is stable at this temperature.\n`;
                } else {
                    if (tempDiff > 10) prompt += `Status: **Heating Up** (Delta: +${tempDiff.toFixed(0)}K).\n`;
                    else if (tempDiff < -10) prompt += `Status: **Cooling Down** (Delta: ${tempDiff.toFixed(0)}K).\n`;

                    prompt += `Prediction: It will reach **${target.state}** at the target temperature.\n`;
                }

                // Add context details
                if (target.isSupercritical) prompt += `Note: This is a Supercritical Fluid state.\n`;
                if (target.isTriplePoint) prompt += `Note: This is the Triple Point (Solid/Liquid/Gas coexistence).\n`;
                if (target.state === MatterState.EQUILIBRIUM_MELT) prompt += `Note: It is exactly at the Melting Point.\n`;
                if (target.state === MatterState.EQUILIBRIUM_BOIL) prompt += `Note: It is exactly at the Boiling Point.\n`;
            }

        } else {
            // MULTI ELEMENT
            prompt += `I am comparing ${elementDataRequests.length} elements:\n`;
            elementDataRequests.forEach(data => {
                const { element, current, target } = data;
                prompt += `- **${element.name}**: `;
                if (current) {
                    prompt += `Currently ${current.state} (${current.temperature.toFixed(0)}K). `;
                    prompt += `Will become ${target.state}. `;
                }
                prompt += `\n`;
            });
            prompt += `\nPlease compare how these elements react differently to these conditions.\n`;
        }

        prompt += `\nTask for ChatGPT: Based on this specific state, tell me a verified scientific curiosity or educational fact about what is happening on screen (e.g. why is it melting, or properties of this state). Be proactive and educational.`;

        console.log("Sending Info Prompt to ChatGPT:", prompt);
        await sendFollowUpMessage(prompt);
    };

    return {
        displayMode,
        maxHeight,
        safeArea,
        isFullscreen,
        isPiP: displayMode === 'pip', // approximate check
        requestDisplayMode,
        handleInfoClick
    };
}
