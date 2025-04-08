import React, { useEffect, useState } from "react"
import OBR from "@owlbear-rodeo/sdk"

const BROADCAST_EVENT = "owl-reaction-play"

export default function App() {
  const [items, setItems] = useState([])
  const [soundUrl, setSoundUrl] = useState(null)

  useEffect(() => {
    OBR.onReady(async () => {
      // Récupérer les items dès que la scène est prête
      if (await OBR.scene.isReady()) {
        const allItems = await OBR.scene.items.getItems()
        const filtered = allItems.filter(item => item.type === "IMAGE" && item.image?.url)
        setItems(filtered)

        OBR.scene.items.onChange((updated) => {
          const updatedFiltered = updated.filter(item => item.type === "IMAGE" && item.image?.url)
          setItems(updatedFiltered)
        })
      }

      // 🔊 Écouter les broadcasts entrants
      OBR.broadcast.onMessage(async (message) => {
        if (message?.type !== BROADCAST_EVENT) return
        const { imageUrl } = message.data
        if (!imageUrl) return

        const camera = await OBR.viewport.getCamera()
        const position = camera.position
        const id = `popup-${Date.now()}`

        const imageItem = {
          type: "IMAGE",
          id,
          image: { url: imageUrl },
          position,
          scale: { x: 4, y: 4 },
          layer: "ATTACHMENT",
          locked: true,
          disabled: true,
          visible: true,
        }

        await OBR.scene.items.addItems([imageItem])
        setTimeout(() => {
          OBR.scene.items.deleteItems([id])
        }, 3000)

        // Ne joue le son que localement
        if (soundUrl) {
          const audio = new Audio(soundUrl)
          audio.play().catch(() => {})
        }
      })
    })
  }, [soundUrl])

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSoundUrl(URL.createObjectURL(file))
    }
  }

  const handleClickToken = (imageUrl) => {
    OBR.broadcast.sendMessage(BROADCAST_EVENT, { imageUrl })
  }

  return (
    <div className="p-4 max-w-[500px]">
      <h1 className="text-lg font-bold mb-4 text-center">🦉 Owl Reaction</h1>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Dépose un son :</label>
        <input type="file" accept="audio/*" onChange={handleFileUpload} className="block w-full" />
        {soundUrl && <p className="text-xs text-green-600 mt-1">✅ Son chargé</p>}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {items.map((item) => (
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
    </div>
  )
}
