import fs from "fs";
import TOML from "@iarna/toml";

const file = "data/github.toml"

const raw = fs.readFileSync(file, "utf8");
const toml = TOML.parse(raw);
const {config, links} = toml;

const tags = Array.from(
  Object.values(links).reduce(
    (set, tags) => (tags.forEach(t => set.add(t)), set),
    new Set()
  )
);

const goms = Object
  .entries(links)
  .reduce(
    (obj, [ident, tags]) => ({ ...obj, [config.prefix + ident]: tags }), {}
  );

export {
  toml,
  tags,
  goms,
};
