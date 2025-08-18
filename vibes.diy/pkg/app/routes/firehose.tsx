import { VibeIframeContainerComponent } from "./vibe.js";
import React from "react";
import { FIREHOSE_SLUG } from "../config/firehose.js";

export default function FirehoseRoute() {
  return <VibeIframeContainerComponent vibeSlug={FIREHOSE_SLUG} />;
}
