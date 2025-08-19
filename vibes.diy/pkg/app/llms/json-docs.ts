import callai from "./callai.json?raw";
import d3 from "./d3.json?raw";
import fireproof from "./fireproof.json?raw";
import imageGen from "./image-gen.json?raw";
import threejs from "./three-js.json?raw";
import webAudio from "./web-audio.json?raw";

export default {
  "callai.json": { default: JSON.parse(callai) },
  "d3.json": { default: JSON.parse(d3) },
  "fireproof.json": { default: JSON.parse(fireproof) },
  "imageGen.json": { default: JSON.parse(imageGen) },
  "threejs:.json": { default: JSON.parse(threejs) },
  "webAudio.json": { default: JSON.parse(webAudio) },
};
