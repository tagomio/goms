import {Octokit} from "@octokit/core";
import {toml, tags} from "./data.js";
import mongodb from "mongodb";
import dotenv from "dotenv";
import ogs from "open-graph-scraper";

dotenv.config();
const {MongoClient} = mongodb;

const {
  GITHUB_TOKEN,
  MONGODB_URL,
} = process.env;

const github = new Octokit({auth: GITHUB_TOKEN});
const client = new MongoClient(
  MONGODB_URL, {useNewUrlParser: true, useUnifiedTopology: true}
);

async function getActivity(owner, repo) {
  const {data} = await github.request(
    "GET /repos/{owner}/{repo}/stats/code_frequency",
    {owner, repo},
  );

  return data.reduce(
    (acc, [, added, removed]) => acc + added + Math.abs(removed), 0
  );
}

async function getRepoInfo(owner, repo) {
  const {data} = await github.request(
    "GET /repos/{owner}/{repo}",
    {owner, repo},
  );

  // TODO contributors count
  // TODO save this infomation as time series data
  const {
    archived,
    stargazers_count,
    forks,
    subscribers_count,
  } = data;

  return {
    archived,
    stars: stargazers_count,
    forks,
    subscriber: subscribers_count,
  };
}

async function updateTags(collection, tags) {
  for (const tag of tags) {
    await collection.updateOne(
      {name: tag},
      {$set: {name: tag}},
      {upsert: true},
    )
  }
}

async function updateRepositories(collection, toml) {
  for (const [id, tags] of Object.entries(toml.links)) {
    const [owner, repo] = id.split('/');
    const url = toml.config.prefix + id;

    const info = await getRepoInfo(owner, repo);
    const activity = await getActivity(owner, repo);
    const {result} = await ogs({url});
    const {ogDescription, ogTitle, ogImage} = result;

    const data = {
      id,
      url,
      owner,
      repo,
      tags,
      activity,
      info,
      ogs: {
        ogDescription,
        ogTitle,
        ogImage,
      },
    };

    await collection.updateOne(
      {id},
      {$set: data},
      {upsert: true},
    )
  }
}

async function main() {
  await client.connect();
  const db = client.db("github");
  console.log("connected to mongodb")

  await updateTags(db.collection("tags"), tags);
  console.log("updated tags")

  await updateRepositories(db.collection("repositories"), toml)
  console.log("updated repositories")

  await client.close()
  console.log("connection closed")
}

main();
