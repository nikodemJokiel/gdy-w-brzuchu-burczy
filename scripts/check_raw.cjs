const axios = require('axios');

async function main() {
  const titles = ['Chrupiące gofry', 'Ciasteczka kokosowo', 'Rosół domowy', 'Owsiane ciastka'];
  
  for (const q of titles) {
    try {
      const res = await axios.get(`https://gdywbrzuchuburczy.blogspot.com/feeds/posts/default?alt=json&max-results=1&q=${encodeURIComponent(q)}`);
      const entry = res.data.feed.entry?.[0];
      if (!entry) { console.log(`No result for: ${q}`); continue; }
      const content = entry.content?.$t || '';
      const title = entry.title?.$t || '';
      console.log(`\n=== ${title} ===`);
      console.log('Content length:', content.length);
      console.log('Has <ul>:', content.includes('<ul'));
      console.log('Has MsoNormal mso-list:', content.includes('MsoNormal') && content.includes('mso-list'));
      console.log('First 1500 chars of content:');
      console.log(content.substring(0, 1500));
      console.log('---');
    } catch(e) {
      console.log(`Error for ${q}:`, e.message);
    }
  }
}

main();
