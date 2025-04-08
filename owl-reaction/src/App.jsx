import React, { useEffect, useState } from "react"
import OBR from "@owlbear-rodeo/sdk"

const BROADCAST_EVENT = "owl-reaction-play"

export default function App() {
  const [items, setItems] = useState([])
  const [noScene, setNoScene] = useState(false)
  const [soundUrl, setSoundUrl] = useState("")
  const [audio, setAudio] = useState(null)
  const [showImage, setShowImage] = useState(null)

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

      // 🔊 Réception des messages broadcast
      OBR.broadcast.onMessage((message) => {
        if (message.key === BROADCAST_EVENT) {
          const { imageUrl, sound } = message.data
          console.log("📡 Reçu :", message.data)
          if (sound) {
            const sfx = new Audio(sound)
            sfx.play().catch(console.warn)
          }
          if (imageUrl) {
            setShowImage(imageUrl)
            setTimeout(() => setShowImage(null), 3000)
          }
        }
      })
    })

    return () => unsubscribe()
  }, [])

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

  const handleClickToken = (imageUrl) => {
    // ✉️ Envoi d’un message à tous les clients de la room
    OBR.broadcast.sendMessage({
      key: BROADCAST_EVENT,
      data: {
        imageUrl,
        sound: soundUrl,
      },
    })

    // Joue aussi localement immédiatement (pour celui qui a cliqué)
    if (audio) {
      audio.currentTime = 0
      audio.play().catch(console.warn)
    }
    setShowImage(imageUrl)
    setTimeout(() => setShowImage(null), 3000)
  }

  return (
    <div className="p-4 max-w-[500px]">
      <h1 className="text-lg font-bold mb-4 text-center">🧾 TEXT & 🖼️ IMAGE Items</h1>

      {/* Zone de son */}
      <div className="mb-4 space-y-2">
        <label className="block text-sm font-semibold">🎧 Dépose un son :</label>
        <input type="file" accept="audio/*" onChange={handleFileUpload} className="block w-full" />
        <input
          type="text"
          placeholder="Ou colle un lien vers un son..."
          className="w-full border rounded px-2 py-1 text-sm"
          onBlur={handleSoundLink}
        />
        {soundUrl && <p className="text-xs text-green-600">✅ Son prêt à être diffusé</p>}
      </div>

      {noScene ? (
        <p className="text-sm text-red-500 text-center">🚫 Aucune scène active détectée.</p>
      ) : items.length === 0 ? (
        <p className="text-sm italic text-center">Aucun élément TEXT ou IMAGE trouvé</p>
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

      {/* 📸 Image plein écran */}
      {showImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <img
            src={showImage}
            alt="Token"
            className="max-h-[90%] max-w-[90%] rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  )
}
