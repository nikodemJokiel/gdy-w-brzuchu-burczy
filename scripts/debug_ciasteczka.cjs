const axios = require('axios');
const { JSDOM } = require('jsdom');

async function main() {
  const res = await axios.get(`https://gdywbrzuchuburczy.blogspot.com/feeds/posts/default?alt=json&max-results=1&q=${encodeURIComponent('Ciasteczka kokosowo')}`);
  const entry = res.data.feed.entry?.[0];
  if (!entry) return;
  const html = entry.content.$t;
  
  // Strip images like the parser does
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  doc.querySelectorAll('a[href*="facebook.com"], a[href*="instagram.com"], a[href*="pinterest"]').forEach(el => el.remove());
  doc.querySelectorAll('img[src*="social"]').forEach(el => el.remove());
  doc.querySelectorAll('img').forEach(img => {
    const table = img.closest('table.tr-caption-container');
    const separator = img.closest('.separator');
    const anchor = img.closest('a');
    if (table) table.remove();
    else if (separator) separator.remove();
    else if (anchor) anchor.remove();
    else img.remove();
  });
  
  console.log('=== After stripping images ===');
  console.log(doc.body.innerHTML.substring(0, 5000));
}

main();
