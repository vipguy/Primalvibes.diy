import { VibeIframeContainerComponent } from "./vibe";
import { FIREHOSE_SLUG } from "../config/firehose";

export default function FirehoseRoute() {
  return <VibeIframeContainerComponent vibeSlug={FIREHOSE_SLUG} />;
}
