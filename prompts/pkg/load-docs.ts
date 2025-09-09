import { CoerceURI, pathOps, Result, loadAsset } from "@adviser/cement";

function needLocalLlmPath(localPath: string, pathOpsRef = pathOps): string {
  const dirPart = pathOpsRef.dirname(localPath).replace(/^[./]+/, "");
  if (dirPart.startsWith("llms") || localPath.startsWith("llms/")) {
    return "";
  }
  return "llms";
}

export async function loadDocs(
  localPath: string,
  fallBackUrl: CoerceURI,
  deps = { pathOps, loadAsset },
): Promise<Result<string>> {
  return deps.loadAsset(localPath, {
    fallBackUrl,
    basePath: () => import.meta.url,
    pathCleaner: (base, localPath, mode) => {
      switch (mode) {
        case "normal": {
          const llmPath = needLocalLlmPath(localPath, deps.pathOps);
          if (llmPath === "") {
            // Path already contains llms, use it directly
            return deps.pathOps.join(base, localPath);
          }
          return deps.pathOps.join(base, llmPath, localPath);
        }
        case "fallback":
          return localPath;
      }
    },
  });
}
