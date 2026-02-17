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
            ? `${baseContext} Fale de modo curto sobre o que está acontecendo, compare rapidamente a diferença entre os elementos na temperatura e pressão em que eles estão e dê uma curiosidade cientifica educativa interessante.`
            : `${baseContext} Fale de modo curto sobre o que está acontecendo com o elemento selecionado e dê uma curiosidade cientifica educativa interessante.`;
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

