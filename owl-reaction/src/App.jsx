import React, { useEffect, useState } from "react"
import OBR from "@owlbear-rodeo/sdk"

const BROADCAST_EVENT = "owl-reaction-show"

export default function App() {
  const [items, setItems] = useState([])
  const [noScene, setNoScene] = useState(false)
  const [soundUrl, setSoundUrl] = useState("")
  const [showImage, setShowImage] = useState(null)
  const [audio, setAudio] = useState(null)

  // Initialisation Owlbear + écoute du broadcast
  useEffect(() => {
    const handleMessage = (message) => {
      if (message?.type !== BROADCAST_EVENT) return
      const { imageUrl } = message.data || {}
      if (typeof imageUrl === "string") {
        triggerImagePopup(imageUrl)
      }
    }

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
            const updatedTokens = updatedItems.filter(
              (item) => item.type === "IMAGE" || item.type === "TEXT"
            )
            setItems(updatedTokens)
          })

          OBR.broadcast.onMessage(handleMessage)

          return () => {
            unsubChange()
            OBR.broadcast.offMessage(handleMessage)
          }
        } catch (err) {
          console.error("❌ Erreur lors du chargement de la scène :", err)
          setNoScene(true)
        }
      }

      checkScene()
    })

    return () => unsubscribe()
  }, [])

  // Fonction centrale pour afficher une image
  const triggerImagePopup = (imageUrl) => {
    setShowImage(imageUrl)
    setTimeout(() => setShowImage(null), 3000)
  }

  // Lorsqu'on clique sur une image
  const handleClickToken = async (imageUrl) => {
    // Envoie à tous
    await OBR.broadcast.sendMessage(BROADCAST_EVENT, { imageUrl })

    // Affiche localement aussi
    triggerImagePopup(imageUrl)

    // Joue le son localement
    if (audio) {
      audio.currentTime = 0
      audio.play().catch(console.warn)
    }
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
        {soundUrl && <p className="text-xs text-green-600">✅ Son prêt</p>}
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

      {/* Popup image plein écran */}
      {showImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <img src={showImage} alt="Token" className="max-h-[90%] max-w-[90%] rounded-lg shadow-lg" />
        </div>
      )}
    </div>
  )
}
