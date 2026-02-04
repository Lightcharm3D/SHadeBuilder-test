import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * Saves a string as an STL file. 
 * On Web: Triggers a standard browser download.
 * On Mobile: Saves to the app's cache and opens the native Share sheet.
 */
export const saveStlFile = async (content: string, fileName: string) => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Write the file using UTF-8 encoding directly to avoid base64 overhead/errors
      await Filesystem.writeFile({
        path: fileName,
        data: content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      // Get the native URI for the file we just wrote
      const uriResult = await Filesystem.getUri({
        directory: Directory.Cache,
        path: fileName
      });

      // Open the native share sheet which allows "Save to Files" on Android/iOS
      await Share.share({
        title: 'Export 3D Model',
        text: 'Your 3D printable STL file is ready.',
        url: uriResult.uri,
      });
      
      return true;
    } catch (error) {
      console.error('Error saving file on mobile:', error);
      throw error;
    }
  } else {
    // Standard Web Download
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }
};