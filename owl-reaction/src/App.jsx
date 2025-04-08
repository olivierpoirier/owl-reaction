import React, { useEffect, useState } from "react"
import OBR from "@owlbear-rodeo/sdk"

const BROADCAST_EVENT = "owl-reaction-show"

export default function App() {
  const [items, setItems] = useState([])
  const [noScene, setNoScene] = useState(false)
  const [showImage, setShowImage] = useState(null)

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
          const filtered = sceneItems.filter((item) => item.type === "IMAGE" && item.image?.url)
          setItems(filtered)

          const unsubChange = OBR.scene.items.onChange((updatedItems) => {
            const updatedTokens = updatedItems.filter((item) => item.type === "IMAGE" && item.image?.url)
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

  // Affiche une image en grand
  const triggerImagePopup = (imageUrl) => {
    setShowImage(imageUrl)
    setTimeout(() => setShowImage(null), 3000)
  }

  // Quand on clique : broadcast + local
  const handleClickToken = async (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== "string" || imageUrl.startsWith("blob:")) return

    await OBR.broadcast.sendMessage(BROADCAST_EVENT, { imageUrl })
    triggerImagePopup(imageUrl)
  }

  return (
    <div className="p-4 max-w-[500px]">
      <h1 className="text-lg font-bold mb-4 text-center">🖼️ Owlbear Tokens</h1>

      {noScene ? (
        <p className="text-sm text-red-500 text-center">🚫 Aucune scène active détectée.</p>
      ) : items.length === 0 ? (
        <p className="text-sm italic text-center">Aucune image trouvée</p>
      ) : (
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
      )}

      {showImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <img src={showImage} alt="Token" className="max-h-[90%] max-w-[90%] rounded-lg shadow-lg" />
        </div>
      )}
    </div>
  )
}
