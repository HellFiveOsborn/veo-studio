/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {
  GoogleGenAI,
  Video,
  VideoGenerationReferenceImage,
  VideoGenerationReferenceType,
} from '@google/genai';
import {GenerateVideoParams, GenerationMode, VeoModel} from '../types';

export const generateVideo = async (
  params: GenerateVideoParams,
  apiKey: string,
  apiEndpoint?: string,
): Promise<{objectUrl: string; blob: Blob; uri: string; video: Video}> => {
  if (!apiKey) {
    throw new Error(
      'A chave de API é necessária. Por favor, adicione-a nas configurações.',
    );
  }
  console.log('Starting video generation with params:', params);

  // Configure o cliente de IA, usando um endpoint personalizado se fornecido.
  const clientConfig: {
    apiKey: string;
    httpOptions?: {
      baseUrl?: string;
      headers?: Record<string, string>;
    };
  } = {apiKey};

  let downloadBaseUrl: string | undefined;

  if (apiEndpoint && apiEndpoint.trim() !== '') {
    try {
      // Analise a entrada do usuário para construir URLs corretamente.
      const endpointUrl = new URL(
        apiEndpoint.startsWith('http')
          ? apiEndpoint
          : `https://${apiEndpoint}`,
      );

      // A opção `baseUrl` do SDK espera a URL base completa, incluindo o protocolo.
      const baseUrlForSdk = endpointUrl.toString().replace(/\/$/, '');

      // Isso será usado para reconstruir a URL de download final do vídeo.
      downloadBaseUrl = baseUrlForSdk;

      // Configure o URL base para as requisições e o cabeçalho de autorização.
      clientConfig.httpOptions = {
        baseUrl: baseUrlForSdk,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      };

      console.log(`Endpoint de API personalizado configurado para o SDK: ${baseUrlForSdk}`);
    } catch (e) {
      throw new Error(
        `Endpoint de API inválido: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }

  const ai = new GoogleGenAI(clientConfig);

  const config: {
    numberOfVideos: number;
    resolution?: string;
    aspectRatio?: string;
    lastFrame?: {imageBytes: string; mimeType: string};
    referenceImages?: VideoGenerationReferenceImage[];
    durationSeconds?: number;
    personGeneration?: string;
  } = {
    numberOfVideos: 1,
  };

  if (params.model === VeoModel.VEO_2_0) {
    config.aspectRatio = params.aspectRatio;
    if (params.durationSeconds) {
      config.durationSeconds = params.durationSeconds;
    }
    if (params.allowPeople) {
      config.personGeneration = 'allow_adult';
    }
  } else {
    // Outros modelos (VEO 3.x)
    config.resolution = params.resolution;
    // A proporção não é usada para estender vídeos.
    if (params.mode !== GenerationMode.EXTEND_VIDEO) {
      config.aspectRatio = params.aspectRatio;
    }
  }

  const generateVideoPayload: any = {
    model: params.model,
    config: config,
  };

  // Adicione o prompt apenas se não estiver vazio, pois um prompt vazio pode interferir em outros parâmetros.
  if (params.prompt) {
    generateVideoPayload.prompt = params.prompt;
  }

  if (
    params.mode === GenerationMode.TEXT_TO_VIDEO &&
    params.model === VeoModel.VEO_2_0 &&
    params.inputImage
  ) {
    generateVideoPayload.image = {
      imageBytes: params.inputImage.base64,
      mimeType: params.inputImage.file.type,
    };
    console.log(`Gerando com imagem de entrada: ${params.inputImage.file.name}`);
  } else if (params.mode === GenerationMode.FRAMES_TO_VIDEO) {
    if (params.startFrame) {
      generateVideoPayload.image = {
        imageBytes: params.startFrame.base64,
        mimeType: params.startFrame.file.type,
      };
      console.log(
        `Gerando com frame inicial: ${params.startFrame.file.name}`,
      );
    }

    const finalEndFrame = params.isLooping
      ? params.startFrame
      : params.endFrame;
    if (finalEndFrame) {
      generateVideoPayload.config.lastFrame = {
        imageBytes: finalEndFrame.base64,
        mimeType: finalEndFrame.file.type,
      };
      if (params.isLooping) {
        console.log(
          `Gerando um vídeo em loop usando o frame inicial como frame final: ${finalEndFrame.file.name}`,
        );
      } else {
        console.log(`Gerando com frame final: ${finalEndFrame.file.name}`);
      }
    }
  } else if (params.mode === GenerationMode.REFERENCES_TO_VIDEO) {
    const referenceImagesPayload: VideoGenerationReferenceImage[] = [];

    if (params.referenceImages) {
      for (const img of params.referenceImages) {
        console.log(`Adicionando imagem de referência: ${img.file.name}`);
        referenceImagesPayload.push({
          image: {
            imageBytes: img.base64,
            mimeType: img.file.type,
          },
          referenceType: VideoGenerationReferenceType.ASSET,
        });
      }
    }

    if (params.styleImage) {
      console.log(
        `Adicionando imagem de estilo como referência: ${params.styleImage.file.name}`,
      );
      referenceImagesPayload.push({
        image: {
          imageBytes: params.styleImage.base64,
          mimeType: params.styleImage.file.type,
        },
        referenceType: VideoGenerationReferenceType.STYLE,
      });
    }

    if (referenceImagesPayload.length > 0) {
      generateVideoPayload.config.referenceImages = referenceImagesPayload;
    }
  } else if (params.mode === GenerationMode.EXTEND_VIDEO) {
    if (params.inputVideoObject) {
      generateVideoPayload.video = params.inputVideoObject;
      console.log(`Gerando extensão a partir do objeto de vídeo de entrada.`);
    } else {
      throw new Error(
        'Um objeto de vídeo de entrada é necessário para estender um vídeo.',
      );
    }
  }

  console.log('Enviando solicitação de geração de vídeo...', generateVideoPayload);
  let operation = await ai.models.generateVideos(generateVideoPayload);
  console.log('Operação de geração de vídeo iniciada:', operation);

  // A sondagem do SDK (GET) pode ser armazenada em cache por proxies personalizados.
  // Se um endpoint personalizado for usado, faremos a sondagem manualmente com um parâmetro
  // de cache-busting para garantir que recebemos o status mais recente.
  if (apiEndpoint && apiEndpoint.trim() !== '' && downloadBaseUrl) {
    const operationName = operation.name;
    const pollUrl = new URL(`${downloadBaseUrl}/v1beta/${operationName}`);
    const pollHeaders = {
      Authorization: `Bearer ${apiKey}`,
    };

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      console.log('...Gerando (sondagem manual para evitar cache)...');

      // Parâmetro de cache-busting
      pollUrl.searchParams.set('_', Date.now().toString());

      try {
        const pollResponse = await fetch(pollUrl.toString(), {
          headers: pollHeaders,
        });

        if (!pollResponse.ok) {
          const errorText = await pollResponse.text();
          throw new Error(
            `Falha na sondagem da operação: ${pollResponse.status} ${pollResponse.statusText}. ${errorText}`,
          );
        }
        // Atualize o objeto de operação com o novo status
        operation = await pollResponse.json();
      } catch (error) {
        console.error('Erro durante a sondagem manual:', error);
        // Pare a sondagem em caso de erro de rede, etc., para evitar um loop infinito
        throw error;
      }
    }
  } else {
    // Lógica de sondagem original para o endpoint padrão do Google
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      console.log('...Gerando...');
      operation = await ai.operations.getVideosOperation({operation: operation});
    }
  }

  if (operation?.response) {
    // O SDK normaliza a resposta para `generatedVideos`.
    // A resposta bruta da API da sondagem manual a tem em `generateVideoResponse.generatedSamples`.
    // Precisamos lidar com ambas as estruturas.
    const videos =
      (operation.response as any).generatedVideos ??
      (operation.response as any).generateVideoResponse?.generatedSamples;

    if (!videos || videos.length === 0) {
      throw new Error('Nenhum vídeo foi gerado.');
    }

    const firstVideo = videos[0];
    if (!firstVideo?.video?.uri) {
      throw new Error('O vídeo gerado não possui um URI.');
    }
    const videoObject = firstVideo.video;

    const originalUri = decodeURIComponent(videoObject.uri);
    let downloadUrl: string;

    if (downloadBaseUrl) {
      try {
        // A URI da API é uma URL completa. Precisamos apenas do seu caminho e parâmetros de consulta.
        const originalUrlObject = new URL(originalUri);
        const pathWithQuery =
          originalUrlObject.pathname + originalUrlObject.search;

        // Anexe o caminho e a consulta ao nosso URL base personalizado.
        downloadUrl = `${downloadBaseUrl}${pathWithQuery}`;
        console.log(
          `Usando endpoint personalizado. URI Original: ${originalUri}, URL de Download Construída: ${downloadUrl}`,
        );
      } catch (e) {
        console.error(
          'Não foi possível analisar o URI do vídeo original, retornando ao URI original.',
          e,
        );
        downloadUrl = originalUri;
      }
    } else {
      downloadUrl = originalUri;
    }

    const finalDownloadUrl = new URL(downloadUrl);
    const fetchOptions: RequestInit = {};

    // Para endpoints personalizados, a autenticação é necessária para todas as requisições,
    // incluindo o download final do vídeo. Usaremos um token Bearer.
    if (apiEndpoint) {
      fetchOptions.headers = {
        Authorization: `Bearer ${apiKey}`,
      };
      // A chave de API é enviada no cabeçalho, então a removemos dos parâmetros de consulta.
      finalDownloadUrl.searchParams.delete('key');
    } else {
      // Para o endpoint padrão do Google, a chave de API é passada como um parâmetro de consulta.
      // A URI original já deve contê-la, mas garantimos que esteja lá.
      if (!finalDownloadUrl.searchParams.has('key')) {
        finalDownloadUrl.searchParams.set('key', apiKey);
      }
    }

    console.log('Buscando vídeo de:', finalDownloadUrl.toString());
    const res = await fetch(finalDownloadUrl.toString(), fetchOptions);

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('Falha ao buscar vídeo. Resposta:', errorBody);
      throw new Error(
        `Falha ao buscar vídeo: ${res.status} ${res.statusText}. ${errorBody}`,
      );
    }

    const videoBlob = await res.blob();
    const objectUrl = URL.createObjectURL(videoBlob);

    return {objectUrl, blob: videoBlob, uri: downloadUrl, video: videoObject};
  } else {
    console.error('A operação falhou:', operation);
    // Tente extrair informações de erro da operação, se disponíveis.
    const opError = (operation as any).error;
    if (opError) {
      throw new Error(`A operação falhou: ${opError.message || JSON.stringify(opError)}`);
    }
    throw new Error('Nenhum vídeo gerado.');
  }
};