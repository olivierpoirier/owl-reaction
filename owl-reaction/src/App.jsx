import React, { useEffect, useState } from "react"
import OBR, { buildImage } from "@owlbear-rodeo/sdk"

const BROADCAST_EVENT = "owl-reaction-play"

export default function App() {
  const [items, setItems] = useState([])
  const [noScene, setNoScene] = useState(false)
  const [soundUrl, setSoundUrl] = useState("")
  const [audio, setAudio] = useState(null)

  useEffect(() => {
    const unsubscribe = OBR.onReady(async () => {
      const checkScene = async () => {
        try {
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

          const unsubChange = OBR.scene.items.onChange((updatedItems) => {
            const filteredUpdated = updatedItems.filter(
              (item) => item.type === "IMAGE" || item.type === "TEXT"
            )
            setItems(filteredUpdated)
          })

          return () => unsubChange()
        } catch (err) {
          console.error("❌ Erreur lors du chargement de la scène :", err)
          setNoScene(true)
        }
      }

      checkScene()

      // 📡 Réception des actions de clic sur token
      OBR.broadcast.onMessage(BROADCAST_EVENT, async ({ imageUrl, soundUrl }) => {
        try {
          // Créer un item image temporaire
          const camera = await OBR.viewport.getCamera()
          const center = camera.position

          const id = `popup-${Date.now()}`
          const popup = buildImage()
            .id(id)
            .url(imageUrl)
            .position(center)
            .scale({ x: 4, y: 4 })
            .layer("ATTACHMENT")
            .locked(true)
            .disableHit(true)
            .visible(true)
            .build()

          await OBR.scene.items.addItems([popup])
          setTimeout(() => {
            OBR.scene.items.deleteItems([id])
          }, 3000)

          // 🎧 Lecture du son localement
          const audio = new Audio(soundUrl)
          audio.play().catch((e) => console.warn("🔇 Son bloqué :", e))
        } catch (e) {
          console.warn("❌ Erreur pendant le broadcast :", e)
        }
      })
    })

    return () => unsubscribe()
  }, [])

  const handleClickToken = async (imageUrl) => {
    if (!soundUrl) return alert("⚠️ Aucun son chargé")
    await OBR.broadcast.sendMessage(BROADCAST_EVENT, {
      imageUrl,
      soundUrl,
    })
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setSoundUrl(url)
      setAudio(new Audio(url))
    }
  }

  const handleSoundLink = (e) => {
    const url = e.target.value
    setSoundUrl(url)
    setAudio(new Audio(url))
  }

  return (
    <div className="p-4 max-w-[500px]">
      <h1 className="text-lg font-bold mb-4 text-center">🎵 Owl Reaction</h1>

      {/* Zone pour déposer un son */}
      <div className="mb-4 space-y-2">
        <label className="block text-sm font-semibold">🎧 Dépose un son :</label>
        <input type="file" accept="audio/*" onChange={handleFileUpload} className="block w-full" />
        <input
          type="text"
          placeholder="Ou colle un lien vers un son..."
          className="w-full border rounded px-2 py-1 text-sm"
          onBlur={handleSoundLink}
        />
        {soundUrl && <p className="text-xs text-green-600">✅ Son prêt</p>}
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
