import axios from 'axios';
import * as cheerio from 'cheerio';

async function searchOpenDirectories(query) {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`intitle:"index of" "${query}" (mp4|mkv|avi)`)}`;
    const { data } = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    
    const $ = cheerio.load(data);
    const results = [];
    
    $('.result__url').each((i, el) => {
      let url = $(el).text().trim();
      if (!url.startsWith('http')) url = 'http://' + url;
      results.push(url);
    });
    
    console.log("Found:", results);
  } catch (err) {
    console.error(err.message);
  }
}

searchOpenDirectories('Silicon Valley');
