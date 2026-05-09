import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as mediaPicker from '@services/mediaPickerService';
import { useProject } from '@hooks/useProject';

export const ImportMedia: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { currentProject, addClip, addAudioTrack } = useProject();

  const ensureProject = () => {
    if (!currentProject) {
      Alert.alert('No project', 'Please create or open a project before importing media.');
      return false;
    }
    return true;
  };

  const handlePickFromStorage = async () => {
    if (!ensureProject()) return;
    try {
      setLoading(true);
      const clip = await mediaPicker.pickVideoFromStorage();
      if (!clip) return;

      // Optionally copy into app directory for safe-keeping
      try {
        const copiedPath = await mediaPicker.copyVideoToAppDirectory(clip.uri);
        clip.uri = copiedPath;
      } catch (e) {
        // If copy fails, proceed with original uri
        console.warn('Copy to app directory failed, using original uri');
      }

      await addClip(currentProject.id, clip);
      Alert.alert('Imported', 'Video imported into project');
    } catch (error) {
      console.error('Error importing video from storage:', error);
      Alert.alert('Import error', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePickFromGallery = async () => {
    if (!ensureProject()) return;
    try {
      setLoading(true);
      const clip = await mediaPicker.pickVideoFromGallery();
      if (!clip) return;

      try {
        const copiedPath = await mediaPicker.copyVideoToAppDirectory(clip.uri);
        clip.uri = copiedPath;
      } catch (e) {
        console.warn('Copy to app directory failed, using original uri');
      }

      await addClip(currentProject.id, clip);
      Alert.alert('Imported', 'Video imported from gallery');
    } catch (error) {
      console.error('Error importing video from gallery:', error);
      Alert.alert('Import error', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRecordVideo = async () => {
    if (!ensureProject()) return;
    try {
      setLoading(true);
      const clip = await mediaPicker.recordVideo();
      if (!clip) return;

      try {
        const copiedPath = await mediaPicker.copyVideoToAppDirectory(clip.uri);
        clip.uri = copiedPath;
      } catch (e) {
        console.warn('Copy to app directory failed, using original uri');
      }

      await addClip(currentProject.id, clip);
      Alert.alert('Recorded', 'Recorded video added to project');
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Recording error', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePickAudio = async () => {
    if (!ensureProject()) return;
    try {
      setLoading(true);
      const audio = await mediaPicker.pickAudioFile();
      if (!audio) return;

      // Add as audio track
      const track = {
        id: Math.random().toString(36).slice(2),
        uri: audio.uri,
        duration: audio.duration || 0,
        volume: 1,
        startTime: 0,
        fadeIn: 0,
        fadeOut: 0,
      } as any;

      await addAudioTrack(currentProject.id, track);
      Alert.alert('Imported', 'Audio added to project');
    } catch (error) {
      console.error('Error picking audio:', error);
      Alert.alert('Import error', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Import Media</Text>

      <TouchableOpacity style={styles.button} onPress={handlePickFromStorage} disabled={loading}>
        <Text style={styles.buttonText}>Pick Video from Files</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handlePickFromGallery} disabled={loading}>
        <Text style={styles.buttonText}>Pick Video from Gallery</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleRecordVideo} disabled={loading}>
        <Text style={styles.buttonText}>Record Video</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handlePickAudio} disabled={loading}>
        <Text style={styles.buttonText}>Pick Audio File</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="small" color="#4c9aff" style={{ marginTop: 12 }} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ImportMedia;
