/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import React, {useCallback, useEffect, useState} from 'react';
import {CurvedArrowDownIcon} from './components/icons';
import LoadingIndicator from './components/LoadingIndicator';
import PromptForm from './components/PromptForm';
import VideoResult from './components/VideoResult';
import {generateVideo} from './services/geminiService';
import {
  AppState,
  GenerateVideoParams,
  GenerationMode,
  Resolution,
  VideoFile,
} from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<GenerateVideoParams | null>(
    null,
  );
  const [lastVideoObject, setLastVideoObject] = useState<Video | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('gemini-api-key') || '',
  );
  const [apiEndpoint, setApiEndpoint] = useState(
    localStorage.getItem('gemini-api-endpoint') || '',
  );

  // Salve a chave de API no localStorage sempre que ela mudar
  useEffect(() => {
    localStorage.setItem('gemini-api-key', apiKey);
  }, [apiKey]);

  // Salve o endpoint da API no localStorage sempre que ele mudar
  useEffect(() => {
    localStorage.setItem('gemini-api-endpoint', apiEndpoint);
  }, [apiEndpoint]);

  // Um único estado para armazenar os valores iniciais para o formulário de comando
  const [initialFormValues, setInitialFormValues] =
    useState<GenerateVideoParams | null>(null);

  const showStatusError = (message: string) => {
    setErrorMessage(message);
    setAppState(AppState.ERROR);
  };

  const handleGenerate = useCallback(
    async (params: GenerateVideoParams) => {
      if (!apiKey) {
        setErrorMessage(
          'Por favor, insira sua chave de API nas configurações antes de gerar um vídeo.',
        );
        setAppState(AppState.ERROR);
        return;
      }

      setAppState(AppState.LOADING);
      setErrorMessage(null);
      setLastConfig(params);
      // Redefina os valores iniciais do formulário para o próximo novo começo
      setInitialFormValues(null);

      try {
        const {objectUrl, blob, video} = await generateVideo(
          params,
          apiKey,
          apiEndpoint,
        );
        setVideoUrl(objectUrl);
        setLastVideoBlob(blob);
        setLastVideoObject(video);
        setAppState(AppState.SUCCESS);
      } catch (error) {
        console.error('Video generation failed:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unknown error occurred.';

        let userFriendlyMessage = `A geração do vídeo falhou: ${errorMessage}`;

        if (typeof errorMessage === 'string') {
          if (
            errorMessage.includes('API_KEY_INVALID') ||
            errorMessage.includes('API key not valid') ||
            errorMessage.toLowerCase().includes('permission denied') ||
            errorMessage.includes('Requested entity was not found.')
          ) {
            userFriendlyMessage =
              'Sua chave de API é inválida ou não tem as permissões necessárias. Por favor, verifique sua chave nas configurações e certifique-se que o faturamento está ativado para o projeto associado.';
          }
        }

        setErrorMessage(userFriendlyMessage);
        setAppState(AppState.ERROR);
      }
    },
    [apiKey, apiEndpoint],
  );

  const handleRetry = useCallback(() => {
    if (lastConfig) {
      handleGenerate(lastConfig);
    }
  }, [lastConfig, handleGenerate]);

  const handleNewVideo = useCallback(() => {
    setAppState(AppState.IDLE);
    setVideoUrl(null);
    setErrorMessage(null);
    setLastConfig(null);
    setLastVideoObject(null);
    setLastVideoBlob(null);
    setInitialFormValues(null); // Limpe o estado do formulário
  }, []);

  const handleTryAgainFromError = useCallback(() => {
    if (lastConfig) {
      setInitialFormValues(lastConfig);
      setAppState(AppState.IDLE);
      setErrorMessage(null);
    } else {
      // Retorne para um novo começo se não houver última configuração
      handleNewVideo();
    }
  }, [lastConfig, handleNewVideo]);

  const handleExtend = useCallback(async () => {
    if (lastConfig && lastVideoBlob && lastVideoObject) {
      try {
        const file = new File([lastVideoBlob], 'last_video.mp4', {
          type: lastVideoBlob.type,
        });
        const videoFile: VideoFile = {file, base64: ''};

        setInitialFormValues({
          ...lastConfig, // Mantenha o modelo, proporção
          mode: GenerationMode.EXTEND_VIDEO,
          prompt: '', // Comece com um comando em branco
          inputVideo: videoFile, // para pré-visualização no formulário
          inputVideoObject: lastVideoObject, // para a chamada da API
          resolution: Resolution.P720, // Estender requer 720p
          // Redefina outros tipos de mídia
          startFrame: null,
          endFrame: null,
          referenceImages: [],
          styleImage: null,
          isLooping: false,
        });

        setAppState(AppState.IDLE);
        setVideoUrl(null);
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to process video for extension:', error);
        const message =
          error instanceof Error
            ? error.message
            : 'An unknown error occurred.';
        showStatusError(`Falha ao preparar o vídeo para extensão: ${message}`);
      }
    }
  }, [lastConfig, lastVideoBlob, lastVideoObject]);

  const renderError = (message: string) => (
    <div className="text-center bg-red-900/20 border border-red-500 p-8 rounded-lg">
      <h2 className="text-2xl font-bold text-red-400 mb-4">Erro</h2>
      <p className="text-red-300">{message}</p>
      <button
        onClick={handleTryAgainFromError}
        className="mt-6 px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
        Tentar Novamente
      </button>
    </div>
  );

  return (
    <div className="h-screen bg-black text-gray-200 flex flex-col font-sans overflow-hidden">
      <header className="py-6 flex justify-center items-center px-8 relative z-10">
        <h1 className="text-5xl font-semibold tracking-wide text-center bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Estúdio Veo
        </h1>
      </header>
      <main className="w-full max-w-4xl mx-auto flex-grow flex flex-col p-4">
        {appState === AppState.IDLE ? (
          <>
            <div className="flex-grow flex items-center justify-center">
              <div className="relative text-center">
                <h2 className="text-3xl text-gray-600">
                  Digite na caixa de comando para começar
                </h2>
                <CurvedArrowDownIcon className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-24 h-24 text-gray-700 opacity-60" />
              </div>
            </div>
            <div className="pb-4">
              <PromptForm
                onGenerate={handleGenerate}
                initialValues={initialFormValues}
                apiKey={apiKey}
                setApiKey={setApiKey}
                apiEndpoint={apiEndpoint}
                setApiEndpoint={setApiEndpoint}
              />
            </div>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            {appState === AppState.LOADING && <LoadingIndicator />}
            {appState === AppState.SUCCESS && videoUrl && (
              <VideoResult
                videoUrl={videoUrl}
                onRetry={handleRetry}
                onNewVideo={handleNewVideo}
                onExtend={handleExtend}
                canExtend={lastConfig?.resolution === Resolution.P720}
              />
            )}
            {appState === AppState.SUCCESS &&
              !videoUrl &&
              renderError(
                'Vídeo gerado, mas a URL está faltando. Por favor, tente novamente.',
              )}
            {appState === AppState.ERROR &&
              errorMessage &&
              renderError(errorMessage)}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
