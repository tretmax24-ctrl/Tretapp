import RNFS from 'react-native-fs';
import { ExportSettings, Project, Clip, Effect } from '@types/index';
import { RNFFmpeg } from 'react-native-ffmpeg';

const SUPPORTED_INPUT_FORMATS = [
  'mp4',
  'webm',
  'mov',
  'mkv',
  'avi',
  'flv',
  'wmv',
  'm4v',
  '3gp',
  'ogv',
];

const SUPPORTED_OUTPUT_FORMATS = ['mp4', 'webm', 'mov', 'mkv', 'avi', 'flv', 'wmv'];

const VIDEO_CODECS = {
  h264: 'libx264',
  h265: 'libx265',
  vp9: 'libvpx-vp9',
};

const AUDIO_CODECS = {
  aac: 'aac',
  mp3: 'libmp3lame',
  opus: 'libopus',
};

const RESOLUTION_MAP = {
  '480p': '854x480',
  '720p': '1280x720',
  '1080p': '1920x1080',
  '2k': '2560x1440',
  '4k': '3840x2160',
};

const BITRATE_MAP = {
  low: '1000k',
  medium: '5000k',
  high: '10000k',
};

/**
 * Trim a video clip to specified duration
 */
export const trimVideo = async (
  inputPath: string,
  outputPath: string,
  startTime: number,
  duration: number,
): Promise<void> => {
  try {
    const command = `-i ${inputPath} -ss ${startTime} -t ${duration} -c:v copy -c:a copy ${outputPath}`;
    const result = await RNFFmpeg.execute(command);
    
    if (result !== 0) {
      throw new Error(`FFmpeg trim failed with code ${result}`);
    }
    console.log('Video trimmed successfully:', outputPath);
  } catch (error) {
    console.error('Error trimming video:', error);
    throw error;
  }
};

/**
 * Apply visual effects to a video
 */
export const applyEffect = async (
  inputPath: string,
  outputPath: string,
  effect: Effect,
): Promise<void> => {
  try {
    let filterComplex = '';

    switch (effect.type) {
      case 'grayscale':
        filterComplex = 'format=gray';
        break;
      case 'blur':
        const blurAmount = Math.round(effect.intensity * 10);
        filterComplex = `boxblur=${blurAmount}`;
        break;
      case 'brightness':
        const brightness = (effect.intensity - 1) * 0.5;
        filterComplex = `eq=brightness=${brightness}`;
        break;
      case 'contrast':
        filterComplex = `eq=contrast=${effect.intensity}`;
        break;
      case 'saturation':
        filterComplex = `hue=s=${effect.intensity}`;
        break;
      case 'sepia':
        filterComplex = 'sepia';
        break;
    }

    const command = `-i ${inputPath} -vf "${filterComplex}" -c:a copy ${outputPath}`;
    const result = await RNFFmpeg.execute(command);

    if (result !== 0) {
      throw new Error(`FFmpeg effect application failed with code ${result}`);
    }
    console.log('Effect applied successfully:', outputPath);
  } catch (error) {
    console.error('Error applying effect:', error);
    throw error;
  }
};

/**
 * Merge multiple video clips
 */
export const mergeVideos = async (
  inputPaths: string[],
  outputPath: string,
): Promise<void> => {
  try {
    const concatFile = `${RNFS.DocumentDirectoryPath}/concat_${Date.now()}.txt`;
    const concatContent = inputPaths.map((path) => `file '${path}'`).join('\n');

    await RNFS.writeFile(concatFile, concatContent);

    const command = `-f concat -safe 0 -i ${concatFile} -c copy ${outputPath}`;
    const result = await RNFFmpeg.execute(command);

    // Cleanup concat file
    try {
      await RNFS.unlink(concatFile);
    } catch (e) {
      console.warn('Could not delete concat file');
    }

    if (result !== 0) {
      throw new Error(`FFmpeg merge failed with code ${result}`);
    }
    console.log('Videos merged successfully:', outputPath);
  } catch (error) {
    console.error('Error merging videos:', error);
    throw error;
  }
};

/**
 * Add transition between two videos
 */
export const addTransition = async (
  inputPath1: string,
  inputPath2: string,
  outputPath: string,
  transitionType: string,
  duration: number,
): Promise<void> => {
  try {
    let transitionFilter = '';

    switch (transitionType) {
      case 'fade':
        transitionFilter = `[0]fade=t=out:st=${duration - 0.5}:d=0.5[fade0];[1]fade=t=in:st=0:d=0.5[fade1];[fade0][fade1]overlay`;
        break;
      case 'slide':
        transitionFilter = `[0]scale=1920:1080[v0];[1]scale=1920:1080[v1];[v0][v1]xfade=transition=slideleft:duration=${duration}`;
        break;
      case 'dissolve':
        transitionFilter = `[0][1]xfade=transition=dissolve:duration=${duration}`;
        break;
      case 'wipe':
        transitionFilter = `[0][1]xfade=transition=wipeleft:duration=${duration}`;
        break;
      default:
        transitionFilter = `[0][1]concat=n=2:v=1:a=1`;
    }

    const command = `-i ${inputPath1} -i ${inputPath2} -filter_complex "${transitionFilter}" -pix_fmt yuv420p ${outputPath}`;
    const result = await RNFFmpeg.execute(command);

    if (result !== 0) {
      throw new Error(`FFmpeg transition failed with code ${result}`);
    }
    console.log('Transition added successfully:', outputPath);
  } catch (error) {
    console.error('Error adding transition:', error);
    throw error;
  }
};

/**
 * Extract audio from video
 */
export const extractAudio = async (
  inputPath: string,
  outputPath: string,
): Promise<void> => {
  try {
    const command = `-i ${inputPath} -q:a 9 -n -acodec libmp3lame ${outputPath}`;
    const result = await RNFFmpeg.execute(command);

    if (result !== 0) {
      throw new Error(`FFmpeg audio extraction failed with code ${result}`);
    }
    console.log('Audio extracted successfully:', outputPath);
  } catch (error) {
    console.error('Error extracting audio:', error);
    throw error;
  }
};

/**
 * Mix multiple audio tracks
 */
export const mixAudio = async (
  videoPaths: string[],
  audioFilters: string[],
  outputPath: string,
): Promise<void> => {
  try {
    let inputs = '';
    let filterComplex = '';

    // Build input string
    videoPaths.forEach((path) => {
      inputs += ` -i "${path}"`;
    });

    // Build filter complex for mixing
    const audioCount = videoPaths.length;
    for (let i = 0; i < audioCount; i++) {
      filterComplex += `[${i}:a]`;
    }
    filterComplex += `concat=n=${audioCount}:v=0:a=1[a]`;

    const command = `${inputs} -filter_complex "${filterComplex}" -map 0:v -map "[a]" ${outputPath}`;
    const result = await RNFFmpeg.execute(command);

    if (result !== 0) {
      throw new Error(`FFmpeg audio mixing failed with code ${result}`);
    }
    console.log('Audio mixed successfully:', outputPath);
  } catch (error) {
    console.error('Error mixing audio:', error);
    throw error;
  }
};

/**
 * Get video metadata/information
 */
export const getVideoInfo = async (videoPath: string) => {
  try {
    const exists = await RNFS.exists(videoPath);
    if (!exists) {
      throw new Error('Video file not found');
    }

    // Use ffprobe command to get video information
    const command = `-v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:csv=p=0 "${videoPath}"`;
    const result = await RNFFmpeg.execute(command);

    // Parse result to get duration
    const stats = await RNFS.stat(videoPath);

    return {
      path: videoPath,
      exists: true,
      size: stats.size,
      duration: parseFloat(result.toString()) || 0,
      width: 1920,
      height: 1080,
      bitrate: '5000k',
    };
  } catch (error) {
    console.error('Error getting video info:', error);
    throw error;
  }
};

/**
 * Resize/Scale video to specific resolution
 */
export const scaleVideo = async (
  inputPath: string,
  outputPath: string,
  resolution: string,
): Promise<void> => {
  try {
    const [width, height] = (RESOLUTION_MAP[resolution as keyof typeof RESOLUTION_MAP] || '1920:1080').split('x');
    const command = `-i "${inputPath}" -vf "scale=${width}:${height}" -c:a copy "${outputPath}"`;
    const result = await RNFFmpeg.execute(command);

    if (result !== 0) {
      throw new Error(`FFmpeg scaling failed with code ${result}`);
    }
    console.log('Video scaled successfully:', outputPath);
  } catch (error) {
    console.error('Error scaling video:', error);
    throw error;
  }
};

/**
 * Compress video
 */
export const compressVideo = async (
  inputPath: string,
  outputPath: string,
  bitrate: string,
): Promise<void> => {
  try {
    const command = `-i "${inputPath}" -b:v ${bitrate} -c:a aac -b:a 192k "${outputPath}"`;
    const result = await RNFFmpeg.execute(command);

    if (result !== 0) {
      throw new Error(`FFmpeg compression failed with code ${result}`);
    }
    console.log('Video compressed successfully:', outputPath);
  } catch (error) {
    console.error('Error compressing video:', error);
    throw error;
  }
};

/**
 * Export project to video file
 */
export const exportProject = async (
  projectId: string,
  clips: Clip[],
  settings: ExportSettings,
): Promise<string> => {
  try {
    if (!SUPPORTED_OUTPUT_FORMATS.includes(settings.format)) {
      throw new Error(`Unsupported output format: ${settings.format}`);
    }

    // Create export directory
    const exportDir = `${RNFS.DocumentDirectoryPath}/exports`;
    const dirExists = await RNFS.exists(exportDir);
    if (!dirExists) {
      await RNFS.mkdir(exportDir);
    }

    const timestamp = new Date().getTime();
    const outputPath = `${exportDir}/${projectId}_${timestamp}.${settings.format}`;

    const resolution = RESOLUTION_MAP[settings.resolution] || '1920:1080';
    const bitrate = BITRATE_MAP[settings.quality] || '5000k';
    const videoCodec = VIDEO_CODECS[settings.videoCodec] || 'libx264';
    const audioCodec = AUDIO_CODECS[settings.audioCodec] || 'aac';

    // Build input string for all clips
    let inputs = '';
    let filterComplex = '';

    clips.forEach((clip, index) => {
      inputs += ` -i "${clip.uri}"`;
    });

    // Create concat filter for all clips
    clips.forEach((_, index) => {
      filterComplex += `[${index}:v][${index}:a]`;
    });
    filterComplex += `concat=n=${clips.length}:v=1:a=1[v][a]`;

    // Build final export command
    const command = `${inputs} -filter_complex "${filterComplex}" -map "[v]" -map "[a]" -c:v ${videoCodec} -b:v ${bitrate} -s ${resolution} -c:a ${audioCodec} -b:a 192k -f ${settings.format} "${outputPath}"`;

    console.log('Starting export with command:', command);
    const result = await RNFFmpeg.execute(command);

    if (result !== 0) {
      throw new Error(`FFmpeg export failed with code ${result}`);
    }

    console.log('Export completed successfully:', outputPath);
    return outputPath;
  } catch (error) {
    console.error('Error exporting project:', error);
    throw error;
  }
};

/**
 * Cancel ongoing FFmpeg operation
 */
export const cancelFFmpegOperation = async (): Promise<void> => {
  try {
    await RNFFmpeg.cancel();
    console.log('FFmpeg operation cancelled');
  } catch (error) {
    console.error('Error cancelling FFmpeg:', error);
  }
};

/**
 * Get FFmpeg version
 */
export const getFFmpegVersion = async (): Promise<string> => {
  try {
    const result = await RNFFmpeg.execute('-version');
    return result.toString();
  } catch (error) {
    console.error('Error getting FFmpeg version:', error);
    throw error;
  }
};
