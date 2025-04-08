import React, { useEffect, useState } from "react"
import OBR, { Image, buildImage } from "@owlbear-rodeo/sdk"

const BROADCAST_EVENT = "owl-reaction-play"

export default function App() {
  const [items, setItems] = useState([])
  const [noScene, setNoScene] = useState(false)
  const [soundUrl, setSoundUrl] = useState(null)

  useEffect(() => {
    OBR.onReady(async () => {
      const checkScene = async () => {
        const isSceneReady = await OBR.scene.isReady()
        if (!isSceneReady) {
          setTimeout(checkScene, 500)
          return
        }

        const sceneItems = await OBR.scene.items.getItems()
        const filtered = sceneItems.filter(
          (item) => item.type === "IMAGE" || item.type === "TEXT"
        )
        setItems(filtered)

        OBR.scene.items.onChange((updatedItems) => {
          const updatedFiltered = updatedItems.filter(
            (item) => item.type === "IMAGE" || item.type === "TEXT"
          )
          setItems(updatedFiltered)
        })
      }

      checkScene()
    })

    // 🔊 Écoute des broadcasts (SDK v3)
    const handleMessage = async (message) => {
      if (message && message.type === BROADCAST_EVENT && message.data?.imageUrl) {
        const { imageUrl } = message.data

        const camera = await OBR.viewport.getCamera()
        const center = camera.position
        const id = `popup-${Date.now()}`

        const popup = {
          type: "IMAGE",
          id,
          image: { url: imageUrl },
          position: center,
          scale: { x: 4, y: 4 },
          layer: "ATTACHMENT",
          locked: true,
          disabled: true,
          visible: true,
        }

        await OBR.scene.items.addItems([popup])
        setTimeout(() => {
          OBR.scene.items.deleteItems([id])
        }, 3000)

        if (soundUrl) {
          const audio = new Audio(soundUrl)
          audio.play().catch((e) => console.warn("🔇 Son bloqué :", e))
        }
      }
    }

    OBR.broadcast.onMessage(handleMessage)
    return () => {
      OBR.broadcast.offMessage(handleMessage)
    }
  }, [soundUrl])

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setSoundUrl(url)
    }
  }

  const handleClickToken = async (imageUrl) => {
    if (!soundUrl) {
      alert("⚠️ Tu dois déposer un son d'abord")
      return
    }

    await OBR.broadcast.sendMessage(BROADCAST_EVENT, { imageUrl })
  }

  return (
    <div className="p-4 max-w-[500px]">
      <h1 className="text-lg font-bold mb-4 text-center">🎵 Owl Reaction</h1>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Dépose un son :</label>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="block w-full"
        />
        {soundUrl && <p className="text-xs text-green-600 mt-1">✅ Son chargé</p>}
      </div>

      {noScene ? (
        <p className="text-sm text-red-500 text-center">🚫 Aucune scène active détectée.</p>
      ) : items.length === 0 ? (
        <p className="text-sm italic text-center">Aucun élément IMAGE trouvé</p>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {items
            .filter((item) => item.type === "IMAGE" && item.image?.url)
            .map((item) => (
              <div
                key={item.id}
                className="aspect-square cursor-pointer"
                onClick={() => handleClickToken(item.image.url)}
              >
                <img
                  src={item.image.url}
                  alt={item.name || "Image"}
                  className="w-full h-full object-contain rounded shadow"
                />
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
