import React, { useEffect, useState } from "react"
import OBR from "@owlbear-rodeo/sdk"

export default function App() {
  const [items, setItems] = useState([])
  const [noScene, setNoScene] = useState(false)

  // Chargement et suivi des items
  useEffect(() => {
    let cleanup = () => {}

    OBR.onReady(async () => {
      const checkScene = async () => {
        try {
          const isSceneReady = await OBR.scene.isReady()
          if (!isSceneReady) {
            setTimeout(checkScene, 500)
            return
          }

          const sceneItems = await OBR.scene.items.getItems()
          const filtered = sceneItems.filter(
            (item) => item.type === "IMAGE" && item.image?.url
          )
          setItems(filtered)

          const unsubChange = OBR.scene.items.onChange((updatedItems) => {
            const filteredUpdated = updatedItems.filter(
              (item) => item.type === "IMAGE" && item.image?.url
            )
            setItems(filteredUpdated)
          })

          cleanup = unsubChange
        } catch (err) {
          console.error("❌ Erreur lors du chargement de la scène :", err)
          setNoScene(true)
        }
      }

      checkScene()
    })

    return () => {
      cleanup()
    }
  }, [])

  // 💥 Agrandir temporairement
  const enlargeTemporarily = async (item) => {
    const scaleX = Number(item.scale?.x) || 1
    const scaleY = Number(item.scale?.y) || 1

    await OBR.scene.items.updateItems([
      {
        id: item.id,
        scale: {
          x: scaleX * 4,
          y: scaleY * 4,
        },
      },
    ])

    setTimeout(async () => {
      await OBR.scene.items.updateItems([
        {
          id: item.id,
          scale: {
            x: scaleX,
            y: scaleY,
          },
        },
      ])
    }, 1000)
  }

  return (
    <div className="p-4 max-w-[500px] mx-auto">
      <h1 className="text-lg font-bold mb-4 text-center">🖼️ Images de la scène</h1>

      {noScene ? (
        <p className="text-sm text-red-500 text-center">🚫 Aucune scène active détectée.</p>
      ) : items.length === 0 ? (
        <p className="text-sm italic text-center">Aucune image trouvée</p>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {items.map((item) => (
            <div key={item.id} className="aspect-square">
              <img
                src={item.image?.url || ""}
                alt={item.name || "Image"}
                className="w-full h-full object-contain rounded shadow cursor-pointer hover:scale-105 transition"
                onClick={() => enlargeTemporarily(item)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
