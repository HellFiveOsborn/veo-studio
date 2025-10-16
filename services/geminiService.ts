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

  let sdkEndpoint: string | undefined;
  let downloadBaseUrl: string | undefined;

  if (apiEndpoint && apiEndpoint.trim() !== '') {
    try {
      const endpointUrl = new URL(
        apiEndpoint.startsWith('http') ? apiEndpoint : `https://${apiEndpoint}`,
      );
      // Para o SDK: host + caminho (ex: "meu-proxy.com/gemini")
      sdkEndpoint = `${endpointUrl.host}${endpointUrl.pathname.replace(
        /\/$/,
        '',
      )}`;
      // Para download: protocolo + host + caminho (ex: "https://meu-proxy.com/gemini")
      downloadBaseUrl = `${endpointUrl.protocol}//${sdkEndpoint}`;
    } catch (e) {
      console.error(
        'Formato de Endpoint de API inválido, tentando usar como está:',
        apiEndpoint,
      );
      // Fallback para hostnames simples
      sdkEndpoint = apiEndpoint;
      downloadBaseUrl = `https://${apiEndpoint}`;
    }
  }

  const ai = new GoogleGenAI({
    apiKey,
    ...(sdkEndpoint && {clientOptions: {apiEndpoint: sdkEndpoint}}),
  });

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
      throw new Error('Um objeto de vídeo de entrada é necessário para estender um vídeo.');
    }
  }

  console.log('Enviando solicitação de geração de vídeo...', generateVideoPayload);
  let operation = await ai.models.generateVideos(generateVideoPayload);
  console.log('Operação de geração de vídeo iniciada:', operation);

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log('...Gerando...');
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  if (operation?.response) {
    const videos = operation.response.generatedVideos;

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
        const originalUrlObject = new URL(originalUri);
        // Anexe o caminho do URI original do Google
        downloadUrl = `${downloadBaseUrl}${originalUrlObject.pathname}`;
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

    console.log('Buscando vídeo de:', downloadUrl);
    const res = await fetch(`${downloadUrl}&key=${apiKey}`);

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
    throw new Error('Nenhum vídeo gerado.');
  }
};
