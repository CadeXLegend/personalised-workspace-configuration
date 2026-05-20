/** regex patterns for the ffmpeg-tool extension */

export const patterns = {
  /**
   * matches common image file extensions.
   * capture group 1: the extension without the dot.
   */
  imageExtension: /\.(jpeg|jpg|png|gif|webp|avif|bmp|tiff?|svg)$/i,

  /**
   * matches common video file extensions.
   * capture group 1: the extension without the dot.
   */
  videoExtension: /\.(mp4|mkv|webm|mov|avi|wmv|flv|m4v|mpeg|mpg|ogv|ts)$/i,

  /**
   * matches any supported media file extension.
   * capture group 1: the extension without the dot.
   */
  mediaExtension: /\.(jpeg|jpg|png|gif|webp|avif|bmp|tiff?|svg|mp4|mkv|webm|mov|avi|wmv|flv|m4v|mpeg|mpg|ogv|ts)$/i,

  /**
   * matches a resolution string like "1920x1080" from ffprobe output.
   * capture group 1: width, capture group 2: height.
   */
  resolution: /(\d{2,5})x(\d{2,5})/,

  /**
   * matches a duration string like "01:23:45.678000" from ffprobe.
   */
  duration: /(\d{2}):(\d{2}):(\d{2})\.\d+/,
} as const;
