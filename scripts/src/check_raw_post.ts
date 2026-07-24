import axios from "axios";

async function run() {
  const url = "https://gdywbrzuchuburczy.blogspot.com/feeds/posts/default?alt=json&q=Deser+podwójnie+kawowy+z+musem+malinowym";
  const res = await axios.get(url);
  const feed = res.data.feed;
  const entries = feed.entry || [];
  
  for (const entry of entries) {
    console.log("=== TITLE:", entry.title.$t, "===");
    console.log(entry.content.$t.substring(0, 1500));
    console.log("=========================================\n");
  }
}
run();
