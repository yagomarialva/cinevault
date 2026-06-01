import { exec } from 'child_process';
import util from 'util';
import axios from 'axios';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = util.promisify(exec);

/**
 * YouTube Service using yt-dlp CLI and direct scraping
 */
class YouTubeService {
  /**
   * Search YouTube for playlists.
   *
   * @param {string} query - The search query
   * @param {number} limit - Number of results to return
   * @returns {Promise<object[]>}
   */
  async search(query, limit = 5) {
    if (!query) return [];
    try {
      const { data } = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAw%253D%253D`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });

      const match = data.match(/var ytInitialData = ({.*?});<\/script>/) || data.match(/window\["ytInitialData"\] = ({.*?});\n/);
      if (!match) return [];

      const ytData = JSON.parse(match[1]);
      const contents = ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
      
      if (!contents || !contents[0] || !contents[0].itemSectionRenderer || !contents[0].itemSectionRenderer.contents) {
        return [];
      }

      const items = contents[0].itemSectionRenderer.contents;
      const playlists = [];

      for (const item of items) {
        if (playlists.length >= limit) break;
        
        // Handle the newer lockupViewModel format
        if (item.lockupViewModel && item.lockupViewModel.contentType === 'LOCKUP_CONTENT_TYPE_PLAYLIST') {
          const lvm = item.lockupViewModel;
          playlists.push({
            id: lvm.contentId,
            title: lvm.metadata?.lockupMetadataViewModel?.title?.content || 'Unknown Playlist',
            url: `https://www.youtube.com/playlist?list=${lvm.contentId}`,
            channel: lvm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts?.[0]?.text?.content || 'YouTube',
            thumbnail: lvm.contentImage?.collectionThumbnailViewModel?.primaryThumbnail?.thumbnailViewModel?.image?.sources?.[0]?.url || '',
            duration: 0,
            view_count: 0
          });
        }
      }

      return playlists;
    } catch (err) {
      console.warn(`[YouTubeService] search failed: ${err.message}`);
      return [];
    }
  }

  /**
   * Fetch all episodes/videos from a playlist URL using yt-dlp --flat-playlist
   * 
   * @param {string} url - The playlist URL
   * @returns {Promise<object[]>}
   */
  async getPlaylistEpisodes(url) {
    if (!url) throw new Error('Playlist URL is required');
    try {
      const command = `yt-dlp -j --flat-playlist "${url}"`;
      const { stdout } = await execAsync(command);
      
      const results = stdout
        .trim()
        .split('\n')
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      return results.map(item => ({
        id: item.id,
        title: item.title,
        url: item.url,
        duration: item.duration || 0,
        channel: item.uploader || item.channel || '',
        thumbnail: item.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
      }));
    } catch (err) {
      console.warn(`[YouTubeService] getPlaylistEpisodes failed: ${err.message}`);
      throw new Error('Failed to fetch playlist episodes');
    }
  }

  /**
   * Get direct download/playback URLs for a specific video
   *
   * @param {string} url - YouTube URL
   * @returns {Promise<object>}
   */
  async getDetails(url) {
    if (!url) throw new Error('URL is required');
    try {
      // -j returns full metadata including format URLs
      const command = `yt-dlp -j --no-playlist "${url}"`;
      const { stdout } = await execAsync(command);
      
      const item = JSON.parse(stdout.trim());
      
      // Find the best mp4 format with video and audio, or just fallback to the best overall url
      const bestFormat = item.formats.find(f => f.ext === 'mp4' && f.vcodec !== 'none' && f.acodec !== 'none') 
                         || item.formats.find(f => f.ext === 'mp4') 
                         || item.formats[0];

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        thumbnail: item.thumbnail,
        duration: item.duration,
        formats: item.formats.filter(f => f.vcodec !== 'none' || f.acodec !== 'none').slice(-5), // Last 5 usually best
        directUrl: bestFormat ? bestFormat.url : item.url,
      };
    } catch (err) {
      console.warn(`[YouTubeService] getDetails failed: ${err.message}`);
      throw new Error('Failed to fetch YouTube video details');
    }
  }
  /**
   * Download a single video to a specified directory
   *
   * @param {string} url - YouTube URL
   * @param {string} tempDir - Directory to save the video
   * @returns {Promise<string|null>} - The path to the downloaded file, or null if failed
   */
  async downloadSingleVideo(url, tempDir) {
    // Generate a unique ID for the filename to prevent collisions
    const uuid = randomUUID();
    const command = `yt-dlp --no-progress "${url}" -f "best[ext=mp4]/best" -o "${tempDir}/%(title)s_${uuid}.%(ext)s"`;

    try {
      await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
      
      // Find the downloaded file in the directory
      const files = await fs.readdir(tempDir);
      const downloadedFile = files.find(f => f.includes(uuid));
      
      if (downloadedFile) {
        return path.join(tempDir, downloadedFile);
      }
      return null;
    } catch (err) {
      console.warn(`[YouTubeService] downloadSingleVideo failed for ${url}: ${err.message}`);
      return null;
    }
  }
}

export default new YouTubeService();
