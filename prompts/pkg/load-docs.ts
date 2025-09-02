import { CoerceURI, pathOps, Result, loadAsset } from "@adviser/cement";

function needLocalLlmPath(localPath: string): string {
  const dirPart = pathOps.dirname(localPath).replace(/^[./]+/, "");
  if (dirPart.startsWith("llms")) {
    return localPath;
  }
  return "./llms";
}

export async function loadDocs(
  localPath: string,
  fallBackUrl: CoerceURI,
): Promise<Result<string>> {
  return loadAsset(localPath, {
    fallBackUrl,
    basePath: () => import.meta.url,
    pathCleaner: (base, localPath, mode) => {
      switch (mode) {
        case "normal":
          return pathOps.join(base, needLocalLlmPath(localPath), localPath);
        case "fallback":
          return pathOps.join(base, localPath);
      }
    },
  });
}
