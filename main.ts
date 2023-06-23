import SpotifyWebApi from "spotify-web-api-node";

async function main() {
  const client = createClientWithToken();

  let showDetailsPromises: Promise<void>[] = [];
  let queryBasic = process.argv[2];
  let queryRegex = new RegExp(process.argv[3], "i");

  await refreshToken();

  await findEpisodes(queryBasic, queryRegex);

  async function findEpisodes(queryBasic: string,regexQuery: RegExp) {
    const savedshows = await client.getMySavedShows();
    let startFrom = 0;
    let shows = await getShows(queryBasic, startFrom);
    while (shows.length > 0) {
      shows
        .filter((ele) => ele.languages.indexOf("en") !== -1)
        .forEach((ele) => {
          showDetailsPromises.push(getMatchedEpisodes(ele.id, regexQuery));
        });
      startFrom += 50;
      shows = await getShows(queryBasic, startFrom);
    }
    await Promise.all(showDetailsPromises);
  }

  async function getShows(queryBasic: string, startFrom: number) {
    let response = await client.searchShows(queryBasic, {
      limit: 50,
      offset: startFrom,
    });
    return response.body.shows!.items;
  }

  async function getMatchedEpisodes(showId: string, regexQuery: RegExp) {
    const episodes = await client.getShowEpisodes(showId);
    episodes.body.items
      .filter((ele) => queryRegex.exec(ele.description) !== null)
      .forEach((ele) => {
        console.log("url:")
        console.log(ele.external_urls.spotify);
        console.log("description:");
        console.log(ele.description)
      });
  }

  function createClientWithToken() {
    const client = new SpotifyWebApi();
    client.setClientId(process.env.CLIENT_ID as string);
    client.setClientSecret(process.env.CLIENT_SECRET as string);

    client.setAccessToken(process.env.ACCESS_TOKEN as string);
    client.setRefreshToken(process.env.REFRESH_TOKEN as string);
    return client;
  }

  async function refreshToken() {
    try {
      await client.getAlbum("1");
    } catch (e) {
      console.log("error " + e);
      const data = await client.refreshAccessToken();
      client.setAccessToken(data.body["access_token"]);
    }
  }
}

main().catch((e) => {
  console.log(e);
});
