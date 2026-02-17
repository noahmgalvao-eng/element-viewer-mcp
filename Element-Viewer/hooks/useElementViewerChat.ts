import { useChatGPT } from './useChatGPT';
import { ChemicalElement } from '../types';

interface UseElementViewerChatProps {
    globalTemperature: number;
    globalPressure: number;
    selectedElements: ChemicalElement[];
}

export function useElementViewerChat({
    globalTemperature,
    globalPressure,
    selectedElements
}: UseElementViewerChatProps) {

    const {
        displayMode,
        maxHeight,
        safeArea,
        isFullscreen,
        requestDisplayMode,
        sendFollowUpMessage
    } = useChatGPT();

    const handleInfoClick = async () => {
        if (!sendFollowUpMessage) {
            console.warn('ChatGPT SDK: sendFollowUpMessage not available');
            return;
        }

        const isMulti = selectedElements.length > 1;
        const baseContext = `Temperatura alvo ${globalTemperature.toFixed(1)} K e pressao ${globalPressure.toExponential(2)} Pa.`;

        const prompt = isMulti
            ? `${baseContext} Compare os elementos visiveis e explique, em linguagem natural, o que esta acontecendo com cada um agora: fase atual, se esta aquecendo ou resfriando e quais transicoes de fase estao em andamento (incluindo equilibrios, ponto triplo e regime supercritico quando aparecerem). Cite cada elemento por nome e simbolo. Traga uma curiosidade cientifica curta e proativa relacionada. Nao cite nomes internos do sistema ou da interface.`
            : `${baseContext} Explique, em linguagem natural, o que esta acontecendo com o elemento visivel agora: fase atual, tendencia termica (aquecendo/resfriando) e se ele esta em transicao de fase ou equilibrio (incluindo ponto triplo e regime supercritico quando aplicavel). Traga uma curiosidade cientifica curta e proativa relacionada. Nao cite nomes internos do sistema ou da interface.`;

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

