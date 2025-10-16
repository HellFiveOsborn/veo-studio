/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { KeyIcon } from './icons';

interface ApiKeyDialogProps {
  onContinue: () => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl max-w-lg w-full p-8 text-center flex flex-col items-center">
        <div className="bg-indigo-600/20 p-4 rounded-full mb-6">
          <KeyIcon className="w-12 h-12 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Chave de API Necessária para o Veo</h2>
        <p className="text-gray-300 mb-6">
          O Veo é um modelo de geração de vídeo pago. Para usar este recurso, selecione uma chave de API associada a um projeto do Google Cloud com o faturamento ativado.
        </p>
        <p className="text-gray-400 mb-8 text-sm">
          Para mais informações, consulte{' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline font-medium"
          >
            como ativar o faturamento
          </a>{' '}
          e{' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/pricing#veo-3"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline font-medium"
          >
            preços do Veo
          </a>.
        </p>
        <button
          onClick={onContinue}
          className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-lg"
        >
          Continuar para Selecionar Chave de API
        </button>
      </div>
    </div>
  );
};

export default ApiKeyDialog;