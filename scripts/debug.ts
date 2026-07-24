import axios from 'axios';

async function run() {
  const q = 'Najprostsze ciasto z rabarbarem';
  const url = `https://gdywbrzuchuburczy.blogspot.com/feeds/posts/default?alt=json&max-results=1&q=${encodeURIComponent(q)}`;
  const res = await axios.get(url);
  const content = res.data.feed.entry[0].content.$t;
  console.log(content.substring(2000));
}

run();
