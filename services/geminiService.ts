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

  const ai = new GoogleGenAI({
    apiKey,
    ...(apiEndpoint && {clientOptions: {apiEndpoint}}),
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
    // Other models (VEO 3.x)
    config.resolution = params.resolution;
    // Aspect ratio is not used for extending videos.
    if (params.mode !== GenerationMode.EXTEND_VIDEO) {
      config.aspectRatio = params.aspectRatio;
    }
  }

  const generateVideoPayload: any = {
    model: params.model,
    config: config,
  };

  // Only add the prompt if it's not empty, as an empty prompt might interfere with other parameters.
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
    console.log(`Generating with input image: ${params.inputImage.file.name}`);
  } else if (params.mode === GenerationMode.FRAMES_TO_VIDEO) {
    if (params.startFrame) {
      generateVideoPayload.image = {
        imageBytes: params.startFrame.base64,
        mimeType: params.startFrame.file.type,
      };
      console.log(
        `Generating with start frame: ${params.startFrame.file.name}`,
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
          `Generating a looping video using start frame as end frame: ${finalEndFrame.file.name}`,
        );
      } else {
        console.log(`Generating with end frame: ${finalEndFrame.file.name}`);
      }
    }
  } else if (params.mode === GenerationMode.REFERENCES_TO_VIDEO) {
    const referenceImagesPayload: VideoGenerationReferenceImage[] = [];

    if (params.referenceImages) {
      for (const img of params.referenceImages) {
        console.log(`Adding reference image: ${img.file.name}`);
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
        `Adding style image as a reference: ${params.styleImage.file.name}`,
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
      console.log(`Generating extension from input video object.`);
    } else {
      throw new Error('An input video object is required to extend a video.');
    }
  }

  console.log('Submitting video generation request...', generateVideoPayload);
  let operation = await ai.models.generateVideos(generateVideoPayload);
  console.log('Video generation operation started:', operation);

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log('...Generating...');
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  if (operation?.response) {
    const videos = operation.response.generatedVideos;

    if (!videos || videos.length === 0) {
      throw new Error('No videos were generated.');
    }

    const firstVideo = videos[0];
    if (!firstVideo?.video?.uri) {
      throw new Error('Generated video is missing a URI.');
    }
    const videoObject = firstVideo.video;

    const originalUri = decodeURIComponent(videoObject.uri);
    let downloadUrl: string;

    if (apiEndpoint && apiEndpoint.trim() !== '') {
      try {
        const urlObject = new URL(originalUri);
        // Construct the new URL using the custom endpoint as the host.
        // Assumes the apiEndpoint is just the hostname, e.g., "my-proxy.com"
        // and the protocol is https.
        downloadUrl = `https://${apiEndpoint}${urlObject.pathname}`;
        console.log(
          `Using custom endpoint. Original URI: ${originalUri}, Constructed Download URL: ${downloadUrl}`,
        );
      } catch (e) {
        console.error(
          'Could not parse original video URI with custom endpoint, falling back to original URI.',
          e,
        );
        downloadUrl = originalUri;
      }
    } else {
      downloadUrl = originalUri;
    }

    console.log('Fetching video from:', downloadUrl);
    const res = await fetch(`${downloadUrl}&key=${apiKey}`);

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('Failed to fetch video. Response:', errorBody);
      throw new Error(
        `Failed to fetch video: ${res.status} ${res.statusText}. ${errorBody}`,
      );
    }

    const videoBlob = await res.blob();
    const objectUrl = URL.createObjectURL(videoBlob);

    return {objectUrl, blob: videoBlob, uri: downloadUrl, video: videoObject};
  } else {
    console.error('Operation failed:', operation);
    throw new Error('No videos generated.');
  }
};