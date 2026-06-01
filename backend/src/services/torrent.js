import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

/**
 * Common trackers appended to magnet links built from info hashes.
 */
const TRACKERS = [
  'udp://open.demonii.com:1337/announce',
  'udp://tracker.openbittorrent.com:80',
  'udp://tracker.coppersurfer.tk:6969',
  'udp://glotorrents.pw:6969/announce',
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://torrent.gresille.org:80/announce',
  'udp://p4p.arenabg.com:1337',
  'udp://tracker.leechers-paradise.org:6969',
];

function buildMagnet(hash, name) {
  const dn = encodeURIComponent(name);
  const tr = TRACKERS.map((t) => `&tr=${encodeURIComponent(t)}`).join('');
  return `magnet:?xt=urn:btih:${hash}&dn=${dn}${tr}`;
}

class TorrentService {
  async search(query) {
    if (!query) return [];

    const [r1337x, rTPB] = await Promise.allSettled([
      this.search1337x(query),
      this.searchTPB(query),
    ]);

    const combined = [
      ...(r1337x.status === 'fulfilled' ? r1337x.value : []),
      ...(rTPB.status === 'fulfilled' ? rTPB.value : []),
    ];

    const seen = new Set();
    return combined.filter((item) => {
      const hash = this._extractHash(item.magnet);
      if (!hash) return true;
      if (seen.has(hash)) return false;
      seen.add(hash);
      return true;
    });
  }

  async search1337x(query, pageNum = 1) {
    let browser = null;
    try {
      const searchUrl = `https://1337x.to/search/${encodeURIComponent(query)}/${pageNum}/`;

      browser = await puppeteer.launch({
        headless: 'new',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });

      const page = await browser.newPage();
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      const html = await page.content();
      const $ = cheerio.load(html);
      const rows = [];

      $('table.table-list tbody tr').each((_i, el) => {
        const $el = $(el);
        const nameLink = $el.find('td.name a').eq(1);
        const name = nameLink.text().trim();
        const href = nameLink.attr('href');
        const seeds = parseInt($el.find('td.seeds').text().trim(), 10) || 0;
        const peers = parseInt($el.find('td.leeches').text().trim(), 10) || 0;
        const size = $el.find('td.size').clone().children().remove().end().text().trim();

        if (name && href) {
          rows.push({ name, href, seeds, peers, size });
        }
      });

      const top = rows.slice(0, 10);
      const results = [];

      // Fetch magnet links sequentially to avoid overloading the headless browser
      for (const row of top) {
        try {
          const detailPage = await browser.newPage();
          await detailPage.goto(`https://1337x.to${row.href}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          const detailHtml = await detailPage.content();
          const detail$ = cheerio.load(detailHtml);
          const magnet = detail$('a[href^="magnet:"]').attr('href') || null;
          
          if (magnet) {
            results.push({ ...row, magnet, source: '1337x' });
          }
          await detailPage.close();
        } catch (e) {
          console.warn(`[TorrentService] Failed to fetch magnet for ${row.name}`);
        }
      }

      return results;
    } catch (err) {
      console.warn(`[TorrentService] 1337x scraping failed: ${err.message}`);
      return [];
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  async searchTPB(query) {
    try {
      const { data } = await axios.get('https://apibay.org/q.php', {
        params: { q: query, cat: 0 },
        timeout: 5000,
      });

      if (!Array.isArray(data) || (data.length === 1 && data[0].id === '0')) return [];

      return data.map((item) => ({
        name: item.name,
        seeds: parseInt(item.seeders, 10) || 0,
        peers: parseInt(item.leechers, 10) || 0,
        size: this._formatBytes(parseInt(item.size, 10) || 0),
        magnet: buildMagnet(item.info_hash, item.name),
        source: 'TPB',
      }));
    } catch (err) {
      console.warn(`[TorrentService] TPB search failed: ${err.message}`);
      return [];
    }
  }

  async searchEZTV(imdbId) {
    try {
      const numericId = String(imdbId).replace(/^tt/i, '');
      const { data } = await axios.get('https://eztvx.to/api/get-torrents', {
        params: { imdb_id: numericId, limit: 30 },
        timeout: 5000,
      });

      if (!data.torrents || !Array.isArray(data.torrents)) return [];

      return data.torrents.map((t) => ({
        name: t.title || t.filename,
        seeds: t.seeds || 0,
        peers: t.peers || 0,
        size: this._formatBytes(t.size_bytes || 0),
        magnet: t.magnet_url || buildMagnet(t.hash, t.title || t.filename),
        source: 'EZTV',
      }));
    } catch (err) {
      return [];
    }
  }

  _extractHash(magnet) {
    if (!magnet) return null;
    const match = magnet.match(/btih:([a-fA-F0-9]{40})/i);
    return match ? match[1].toLowerCase() : null;
  }

  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / 1024 ** i).toFixed(2)} ${units[i]}`;
  }
}

export default new TorrentService();
