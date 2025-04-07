import OBR from "@owlbear-rodeo/sdk";

async function pickImages() {
  const images = await OBR.assets.downloadImages(true)
  console.log(images)
}

document.getElementById("pick").addEventListener("click", pickImages)


