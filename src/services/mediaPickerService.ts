import { DocumentPickerResponse } from 'react-native-document-picker';
import DocumentPicker from 'react-native-document-picker';
import ImagePicker, { ImageOrVideo } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { Clip } from '@types/index';
import { v4 as uuidv4 } from 'uuid';
import * as videoService from './videoService';

const SUPPORTED_FORMATS = [
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

/**
 * Pick a video file from device storage
 */
export const pickVideoFromStorage = async (): Promise<Clip | null> => {
  try {
    const result = await DocumentPicker.pick({
      type: [DocumentPicker.types.video],
      copyTo: 'documentDirectory',
    });

    if (!result || result.length === 0) {
      return null;
    }

    const file = result[0];
    const fileName = file.name || 'video';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'mp4';

    // Validate format
    if (!SUPPORTED_FORMATS.includes(fileExtension)) {
      throw new Error(`Unsupported video format: ${fileExtension}`);
    }

    // Get video information
    let duration = 0;
    try {
      const videoInfo = await videoService.getVideoInfo(file.fileCopyUri || file.uri);
      duration = videoInfo.duration;
    } catch (error) {
      console.warn('Could not get video duration:', error);
      duration = 0; // Default duration
    }

    // Create clip object
    const clip: Clip = {
      id: uuidv4(),
      uri: file.fileCopyUri || file.uri,
      duration: duration,
      startTime: 0,
      endTime: duration,
      volume: 1,
      opacity: 1,
      effects: [],
    };

    console.log('Video picked successfully:', clip);
    return clip;
  } catch (error) {
    if (DocumentPicker.isCancel(error)) {
      console.log('User cancelled video picker');
      return null;
    }
    console.error('Error picking video:', error);
    throw error;
  }
};

/**
 * Pick a video using camera/gallery picker (ImagePicker)
 */
export const pickVideoFromGallery = async (): Promise<Clip | null> => {
  return new Promise((resolve) => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: 'video',
        quality: 1,
        videoQuality: 'high',
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled video picker');
          resolve(null);
        } else if (response.errorCode) {
          console.error('ImagePicker error:', response.errorMessage);
          resolve(null);
        } else if (response.assets && response.assets.length > 0) {
          const video = response.assets[0];
          const uri = video.uri || '';
          const duration = (video.duration || 0) / 1000; // Convert ms to seconds

          const clip: Clip = {
            id: uuidv4(),
            uri: uri,
            duration: duration,
            startTime: 0,
            endTime: duration,
            volume: 1,
            opacity: 1,
            effects: [],
          };

          console.log('Video picked from gallery:', clip);
          resolve(clip);
        }
      },
    );
  });
};

/**
 * Record a new video using device camera
 */
export const recordVideo = async (): Promise<Clip | null> => {
  return new Promise((resolve) => {
    ImagePicker.launchCamera(
      {
        mediaType: 'video',
        videoQuality: 'high',
        durationLimit: 600, // 10 minutes max
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled video recording');
          resolve(null);
        } else if (response.errorCode) {
          console.error('Camera error:', response.errorMessage);
          resolve(null);
        } else if (response.assets && response.assets.length > 0) {
          const video = response.assets[0];
          const uri = video.uri || '';
          const duration = (video.duration || 0) / 1000; // Convert ms to seconds

          const clip: Clip = {
            id: uuidv4(),
            uri: uri,
            duration: duration,
            startTime: 0,
            endTime: duration,
            volume: 1,
            opacity: 1,
            effects: [],
          };

          console.log('Video recorded:', clip);
          resolve(clip);
        }
      },
    );
  });
};

/**
 * Pick an audio file
 */
export const pickAudioFile = async (): Promise<{ uri: string; duration: number } | null> => {
  try {
    const result = await DocumentPicker.pick({
      type: ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/mp4'],
    });

    if (!result || result.length === 0) {
      return null;
    }

    const file = result[0];

    // Get audio duration
    let duration = 0;
    try {
      // You would need ffprobe to get accurate duration
      // For now, return 0 and let user set manually
      duration = 0;
    } catch (error) {
      console.warn('Could not get audio duration');
    }

    console.log('Audio file picked:', file);
    return {
      uri: file.uri,
      duration: duration,
    };
  } catch (error) {
    if (DocumentPicker.isCancel(error)) {
      console.log('User cancelled audio picker');
      return null;
    }
    console.error('Error picking audio:', error);
    throw error;
  }
};

/**
 * Copy video file to app directory for backup
 */
export const copyVideoToAppDirectory = async (sourceUri: string): Promise<string> => {
  try {
    const fileName = `video_${Date.now()}.mp4`;
    const destinationPath = `${RNFS.DocumentDirectoryPath}/videos/${fileName}`;

    // Create videos directory if it doesn't exist
    const videosDir = `${RNFS.DocumentDirectoryPath}/videos`;
    const dirExists = await RNFS.exists(videosDir);
    if (!dirExists) {
      await RNFS.mkdir(videosDir);
    }

    // Copy file
    await RNFS.copyFile(sourceUri, destinationPath);

    console.log('Video copied to:', destinationPath);
    return destinationPath;
  } catch (error) {
    console.error('Error copying video:', error);
    throw error;
  }
};

/**
 * Get file size in MB
 */
export const getFileSizeInMB = async (filePath: string): Promise<number> => {
  try {
    const stats = await RNFS.stat(filePath);
    return stats.size / (1024 * 1024); // Convert to MB
  } catch (error) {
    console.error('Error getting file size:', error);
    return 0;
  }
};

/**
 * Delete video file
 */
export const deleteVideoFile = async (filePath: string): Promise<void> => {
  try {
    const exists = await RNFS.exists(filePath);
    if (exists) {
      await RNFS.unlink(filePath);
      console.log('Video file deleted:', filePath);
    }
  } catch (error) {
    console.error('Error deleting video file:', error);
    throw error;
  }
};

/**
 * Get list of all videos in app directory
 */
export const getAppVideos = async (): Promise<string[]> => {
  try {
    const videosDir = `${RNFS.DocumentDirectoryPath}/videos`;
    const dirExists = await RNFS.exists(videosDir);

    if (!dirExists) {
      return [];
    }

    const files = await RNFS.readDir(videosDir);
    const videoFiles = files
      .filter((file) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return SUPPORTED_FORMATS.includes(ext || '');
      })
      .map((file) => file.path);

    return videoFiles;
  } catch (error) {
    console.error('Error getting app videos:', error);
    return [];
  }
};

/**
 * Clear old temporary files
 */
export const cleanupTempFiles = async (): Promise<void> => {
  try {
    const tempDir = RNFS.TemporaryDirectoryPath;
    const files = await RNFS.readDir(tempDir);

    // Delete files older than 24 hours
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (now - file.mtime!.getTime() > oneDayMs) {
        try {
          await RNFS.unlink(file.path);
        } catch (e) {
          console.warn('Could not delete temp file:', file.path);
        }
      }
    }

    console.log('Temp files cleanup complete');
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
};

/**
 * Validate video file
 */
export const validateVideoFile = async (filePath: string): Promise<boolean> => {
  try {
    const exists = await RNFS.exists(filePath);
    if (!exists) {
      console.warn('Video file does not exist:', filePath);
      return false;
    }

    const stats = await RNFS.stat(filePath);
    const minSizeBytes = 100 * 1024; // 100 KB minimum

    if (stats.size < minSizeBytes) {
      console.warn('Video file is too small:', stats.size);
      return false;
    }

    // Check file extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_FORMATS.includes(ext || '')) {
      console.warn('Unsupported video format:', ext);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating video file:', error);
    return false;
  }
};
