import axios from "axios";

async function run() {
  const url = "https://gdywbrzuchuburczy.blogspot.com/feeds/posts/default?alt=json&max-results=1";
  const res = await axios.get(url);
  const entry = res.data.feed.entry[0];
  
  console.log("TITLE:", entry.title.$t);
  console.log("COMMENTS:", entry.link.find(l => l.rel === "replies"));
  console.log("ID:", entry.id.$t);
}
run();
