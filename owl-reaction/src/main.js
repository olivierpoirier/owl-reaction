import OBR, { buildImageUpload, downloadImages } from "@owlbear-rodeo/sdk";

const object = await OBR.assets.uploadScenes([scene]);
console.log("obj");
console.log(object)