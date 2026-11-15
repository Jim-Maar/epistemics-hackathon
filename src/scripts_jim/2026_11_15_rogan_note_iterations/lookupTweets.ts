/** Looks up tweets by id through the X API and prints id, author and text for each one. */
const TWEETS_PER_REQUEST = 100;
const [idsFile] = process.argv.slice(2);
const ids = (await Bun.file(idsFile).text()).split("\n").filter(Boolean);
const bearerToken = process.env.X_READ_BEARER_TOKEN ?? process.env.X_BEARER_TOKEN;

for (let start = 0; start < ids.length; start += TWEETS_PER_REQUEST) {
  const batch = ids.slice(start, start + TWEETS_PER_REQUEST).join(",");
  const url = `https://api.x.com/2/tweets?ids=${batch}&expansions=author_id,attachments.media_keys&user.fields=username&media.fields=type,duration_ms&tweet.fields=created_at,public_metrics`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${bearerToken}` } });
  if (!response.ok) throw new Error(`X API ${response.status}: ${await response.text()}`);
  const body = await response.json();
  const usernames = new Map((body.includes?.users ?? []).map((user: { id: string; username: string }) => [user.id, user.username]));
  for (const tweet of body.data ?? []) {
    console.log(JSON.stringify({ id: tweet.id, author: usernames.get(tweet.author_id), created_at: tweet.created_at, media: tweet.attachments?.media_keys?.length ?? 0, text: tweet.text }));
  }
}
