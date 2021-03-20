import toml from '@iarna/toml';
import fs from 'fs';
import {Octokit} from "@octokit/core";

const token = process.env.TOKEN;
const github = new Octokit({
  auth: token,
});

async function getStats(owner, repo) {
  const {data} = await github.request(
    'GET /repos/{owner}/{repo}/stats/code_frequency',
    {owner, repo}
  );
  return data;
}

async function getRepoInfo(owner, repo) {
  const {data} = await github.request(
    'GET /repos/{owner}/{repo}',
    {owner, repo}
  );
  return data;
}

async function main() {
  const file = 'data/github.toml'
  const outputFolder = 'build';

  const raw = fs.readFileSync(file, 'utf8')
  const {config, links} = toml.parse(raw)


  const data = Object
    .entries(links)
    .reduce((obj, [ident, tags]) => ({...obj, [config.prefix + ident]: tags}), {})

  if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder)
  fs.writeFileSync(`${outputFolder}/data.json`, JSON.stringify(data))
}

main();
