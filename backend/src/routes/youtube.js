import { Router } from 'express';
import youtubeService from '../services/youtube.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const archiver = require('archiver');

const router = Router();

router.get('/search', async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    const results = await youtubeService.search(q, parseInt(limit, 10) || 5);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

router.get('/details', async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'Query parameter "url" is required' });
    }
    const details = await youtubeService.getDetails(url);
    res.json(details);
  } catch (err) {
    next(err);
  }
});

router.get('/playlist', async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'Query parameter "url" is required' });
    }
    const episodes = await youtubeService.getPlaylistEpisodes(url);
    res.json({ results: episodes });
  } catch (err) {
    next(err);
  }
});

router.post('/playlist/download-zip', async (req, res, next) => {
  const tempDir = path.join(os.tmpdir(), `yt-downloads-${randomUUID()}`);
  
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Body parameter "urls" is required and must be a non-empty array' });
    }

    // 1. Create a unique temporary directory for this session
    await fs.mkdir(tempDir, { recursive: true });

    // 2. Set headers and flush them IMMEDIATELY to prevent Nginx 504/502 timeouts
    res.attachment('episodes.zip');
    res.setHeader('Content-Type', 'application/zip');
    res.flushHeaders();

    // 3. Create archiver and pipe to response
    const archive = archiver('zip', { zlib: { level: 0 } });
    
    archive.on('error', (err) => {
      console.error('[Archiver Error]', err);
      // We can't change status code since headers are sent, but we can end the stream
      if (!res.headersSent) res.status(500).json({ error: 'Failed to create zip' });
      else res.end();
    });

    archive.pipe(res);

    // 4. Download files sequentially and append them to the archive as they finish.
    // This keeps the stream active and prevents Nginx from timing out during long downloads.
    for (const url of urls) {
      const filePath = await youtubeService.downloadSingleVideo(url, tempDir);
      if (filePath) {
        // Append the file to the ZIP archive
        archive.append(fs.createReadStream(filePath), { name: path.basename(filePath) });
      }
    }

    // 5. Finalize the archive when all URLs are processed
    await archive.finalize();

  } catch (err) {
    if (!res.headersSent) {
      next(err);
    } else {
      res.end();
    }
  } finally {
    // 6. Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
});

export default router;
