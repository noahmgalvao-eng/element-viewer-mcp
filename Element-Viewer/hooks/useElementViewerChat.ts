import React from 'react';
import { useChatGPT } from './useChatGPT';
import { ChemicalElement, PhysicsState } from '../types';

interface UseElementViewerChatProps {
    globalTemperature: number;
    globalPressure: number;
    selectedElements: ChemicalElement[];
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
    } = useChatGPT();

    const handleInfoClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!sendFollowUpMessage) {
            console.warn("ChatGPT SDK: sendFollowUpMessage not available");
            return;
        }

        // Criamos um prompt dinâmico super direto. 
        // O modelo usará o `widgetState` (sincronizado no App.tsx) para preencher os detalhes.
        const isMulti = selectedElements.length > 1;
        const baseContext = `Temperatura alvo: ${globalTemperature.toFixed(1)}K | Pressão: ${globalPressure.toExponential(2)}Pa.`;

        const prompt = isMulti
            ? `${baseContext} Leia o estado atual da simulação no seu widgetState e compare o comportamento dos elementos que estou vendo. Diga-me uma curiosidade científica sobre a diferença entre eles nestas condições.`
            : `${baseContext} Leia o estado atual da simulação no seu widgetState e me dê uma curiosidade científica ou fato educativo sobre o que está acontecendo com este elemento nestas condições.`;

        console.log("Enviando comando enxuto para o ChatGPT avaliar o widgetState:", prompt);

        // Envia a mensagem inserindo-a no chat como se o usuário estivesse pedindo.
        await sendFollowUpMessage(prompt);
    };

    return {
        displayMode,
        maxHeight,
        safeArea,
        isFullscreen,
        isPiP: displayMode === 'pip',
        requestDisplayMode,
        handleInfoClick
    };
}
