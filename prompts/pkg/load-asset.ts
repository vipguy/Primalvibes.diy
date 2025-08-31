import {
  CoerceURI,
  exception2Result,
  pathOps,
  Result,
  runtimeFn,
  URI,
} from "@adviser/cement";

function needLocalLlmPath(localPath: string): string {
  const dirPart = pathOps.dirname(localPath).replace(/^[./]+/, "");
  if (dirPart.startsWith("llms")) {
    return localPath;
  }
  return "./llms";
}

export async function loadAsset(
  localPath: string,
  ifallBack: CoerceURI,
): Promise<Result<string>> {
  const fallBack = URI.from(ifallBack).asURL();
  let url = { url: fallBack, fallBack: true };
  if (import.meta.url) {
    const urlO = new URL(import.meta.url);
    urlO.pathname = pathOps.dirname(urlO.pathname);
    url = { url: urlO, fallBack: false };

    if (url.url.protocol.startsWith("file")) {
      if (runtimeFn().isNodeIsh) {
        try {
          const fs = await import("fs");
          const fname = pathOps.join(
            url.url.pathname,
            needLocalLlmPath(localPath),
            pathOps.basename(localPath),
          );
          const out = await fs.promises.readFile(fname);
          const txt = new TextDecoder().decode(out);
          return Result.Ok(txt);
        } catch (e) {
          console.warn("fs direct access failed:", url.url.pathname, e);
        }
      }
      url = { url: fallBack, fallBack: true };
    }
  }
  if (url.fallBack) {
    const p = pathOps.basename(localPath);
    url.url.pathname = pathOps.join(url.url.pathname, p);
  } else {
    url.url.pathname = pathOps.join(
      url.url.pathname,
      needLocalLlmPath(localPath),
      localPath,
    );
  }
  // console.log("url", url.url)
  const rRes = await exception2Result(() => fetch(url.url));
  if (rRes.isErr()) {
    return Result.Err(rRes);
  }
  if (!rRes.Ok().ok) {
    return Result.Err(
      `Fetch failed: ${url.url.toString()} ${rRes.Ok().status} ${rRes.Ok().statusText}`,
    );
  }
  return Result.Ok(await rRes.Ok().text());
}
