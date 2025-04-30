/**
 * Helper functions for handling video URLs and formats
 */

// Get the full URL for a video file
export const getVideoUrl = (videoPath: string): string => {
    // If it's already a full URL, return it
    if (videoPath.startsWith('http')) {
      return videoPath;
    }
    
    // If it's a relative path from the API
    if (videoPath.startsWith('/')) {

      
      // For production, prefix with API base URL
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      return `${apiBaseUrl}${videoPath}`;
    }
    
    // Fallback to the sample video
    return '/placeholder-videos/sample.mp4';
  };
  
  // Get appropriate poster image for video
  export const getVideoPoster = (): string => {
    return '/placeholder-videos/poster.jpg';
  };