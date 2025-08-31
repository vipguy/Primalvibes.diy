import { CoerceURI, ResolveOnce } from "@adviser/cement";
import { loadAsset } from "./load-asset.js";

export interface TxtDoc {
  readonly name: string;
  readonly txt: string;
}

const files = [
  "callai.txt",
  "fireproof.txt",
  "image-gen.txt",
  "web-audio.txt",
  "d3.md",
  "three-js.md",
];

export interface TxtDocs {
  "fireproof.txt": TxtDoc;
  "image-gen.txt": TxtDoc;
  "web-audio.txt": TxtDoc;
  "d3.md": TxtDoc;
  "three-js.md": TxtDoc;

  [key: string]: TxtDoc;
}

export const txtDocs = new ResolveOnce<TxtDocs>();
export async function getTxtDocs(fallBackUrl: CoerceURI): Promise<TxtDocs> {
  return txtDocs.once(async () => {
    const m: TxtDocs = {} as TxtDocs;
    for (const f of files) {
      const rAsset = await loadAsset(f, fallBackUrl);
      if (rAsset.isErr()) {
        console.error(`Failed to load asset ${f}: ${rAsset.Err()}`);
        continue;
      }
      m[f] = { name: f, txt: rAsset.Ok() };
    }
    return m;
  });
}

export async function getTexts(
  name: string,
  fallBackUrl: CoerceURI,
): Promise<string | undefined> {
  name = name.toLocaleLowerCase().trim();
  const docs = await getTxtDocs(fallBackUrl);
  let doc = docs[name];
  if (!doc) {
    for (const key of Object.keys(docs)) {
      if (key.toLocaleLowerCase().trim().startsWith(name)) {
        doc = docs[key];
        break;
      }
    }
  }
  return doc?.txt;
}
