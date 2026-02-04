import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * Saves a string or blob as a file. 
 * On Web: Triggers a standard download.
 * On Mobile: Saves to the device and opens the Share sheet.
 */
export const saveStlFile = async (content: string, fileName: string) => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Convert string to base64 for Capacitor Filesystem
      const base64Data = btoa(content);
      
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache, // Use Cache for temporary sharing
      });

      // Open the native share sheet so the user can save to 'Files' or send it
      await Share.share({
        title: 'Export 3D Model',
        text: 'Your 3D printable STL file is ready.',
        url: savedFile.uri,
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