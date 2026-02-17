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
            ? `${baseContext} Avalie quais sao os elementos em contexto e o que esta acontecendo, se estiver estável, fale sobre o estado em que ele está, se estiver aquecendo, resfriando ou em transições de fase, fale sobre isso. Se houver mais de um elemento, compare as diferenças deles perante as mesmas condições de temperatura e pressão. Traga curiosidades cientificas interessantes e educativas sobre os elementos e/ou a situação atual que está acontecendo. Converse normal na sua resposta, sem citar tópicos obrigatórios na resposta e não cite nomes internos do sistema ou da interface`
            : `${baseContext} Avalie qual elemento está em contexto e o que esta acontecendo, se estiver estável, fale sobre o estado em que ele está, se estiver aquecendo, resfriando ou em transições de fase, fale sobre isso. Se houver mais de um elemento, compare as diferenças deles perante as mesmas condições de temperatura e pressão. Traga curiosidades cientificas interessantes e educativas sobre os elementos e/ou a situação atual que está acontecendo. Converse normal na sua resposta, sem citar tópicos obrigatórios na resposta e não cite nomes internos do sistema ou da interface.`;
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

