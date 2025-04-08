import React, { useEffect, useState } from "react"
import OBR from "@owlbear-rodeo/sdk"

const BROADCAST_EVENT = "owl-reaction-play"

export default function App() {
  const [items, setItems] = useState([])
  const [soundUrl, setSoundUrl] = useState(null)

  useEffect(() => {
    const handleMessage = (message) => {
      if (message?.type !== BROADCAST_EVENT) return
      const { imageUrl } = message.data
      if (typeof imageUrl === "string") {
        displayImagePopup(imageUrl)
      } else {
        console.warn("❌ imageUrl non valide dans le broadcast :", message)
      }
    }

    OBR.onReady(async () => {
      if (await OBR.scene.isReady()) {
        const allItems = await OBR.scene.items.getItems()
        const filtered = allItems.filter(
          (item) => item.type === "IMAGE" && item.image?.url
        )
        setItems(filtered)

        OBR.scene.items.onChange((updated) => {
          const updatedFiltered = updated.filter(
            (item) => item.type === "IMAGE" && item.image?.url
          )
          setItems(updatedFiltered)
        })

        OBR.broadcast.onMessage(handleMessage)
      }
    })
  }, []) // ✅ pas de dépendance à soundUrl

  const displayImagePopup = async (imageUrl) => {
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

    // ✅ Seul l'utilisateur local joue le son (si présent)
    if (soundUrl) {
      const audio = new Audio(soundUrl)
      audio.play().catch(() => {})
    }
  }

  const handleSoundUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSoundUrl(URL.createObjectURL(file))
    }
  }

  const handleClickImage = async (imageUrl) => {
    const data = { imageUrl }

    // Vérifie que l'image est bien sérialisable
    try {
      await OBR.broadcast.sendMessage(BROADCAST_EVENT, data)
      // ✅ Et aussi localement pour l’émetteur (car il ne reçoit pas son propre broadcast)
      await displayImagePopup(imageUrl)
    } catch (e) {
      console.warn("❌ Erreur lors du broadcast :", e)
    }
  }

  return (
    <div className="p-4 max-w-[500px]">
      <h1 className="text-lg font-bold mb-4 text-center">🦉 Owl Reaction</h1>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">🎵 Dépose un son (optionnel) :</label>
        <input
          type="file"
          accept="audio/*"
          onChange={handleSoundUpload}
          className="block w-full"
        />
        {soundUrl && <p className="text-xs text-green-600 mt-1">✅ Son chargé</p>}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="aspect-square cursor-pointer"
            onClick={() => handleClickImage(item.image.url)}
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
