import React, { useEffect, useState } from "react"
import OBR from "@owlbear-rodeo/sdk"

export default function App() {
  const [items, setItems] = useState([])
  const [noScene, setNoScene] = useState(false)

  useEffect(() => {
    console.log("🔄 useEffect déclenché, en attente de OBR...")

    const unsubscribe = OBR.onReady(async () => {
      console.log("✅ OBR prêt. En attente de la scène...")

      const checkScene = async () => {
        try {
          const isSceneReady = await OBR.scene.isReady()
          if (!isSceneReady) {
            console.log("🕓 Scène pas encore prête, nouvelle tentative dans 500ms")
            setTimeout(checkScene, 500)
            return
          }

          console.log("✅ Scène active détectée")

          const sceneItems = await OBR.scene.items.getItems()
          console.log("📦 Tous les items de la scène :", sceneItems)

          const filtered = sceneItems.filter(
            (item) => item.type === "IMAGE" || item.type === "TEXT"
          )

          console.log("🎯 Items filtrés :", filtered)
          setItems(filtered)

          const unsubChange = OBR.scene.items.onChange((updatedItems) => {
            const filteredUpdated = updatedItems.filter(
              (item) => item.type === "IMAGE" || item.type === "TEXT"
            )
            console.log("🔁 Mise à jour des items :", filteredUpdated)
            setItems(filteredUpdated)
          })

          return () => unsubChange()
        } catch (err) {
          console.error("❌ Erreur lors du chargement de la scène :", err)
          setNoScene(true)
        }
      }

      checkScene()
    })

    return () => {
      console.log("🧹 Nettoyage de OBR.onReady")
      unsubscribe()
    }
  }, [])

  return (
    <div className="p-4 max-w-[500px]">
      <h1 className="text-lg font-bold mb-4 text-center">🧾 TEXT & 🖼️ IMAGE Items</h1>

      {noScene ? (
        <p className="text-sm text-red-500 text-center">🚫 Aucune scène active détectée.</p>
      ) : items.length === 0 ? (
        <p className="text-sm italic text-center">Aucun élément TEXT ou IMAGE trouvé</p>
      ) : (
        <div className="grid grid-cols-5 gap-2">
        {items
            .filter((item) => item.type === "IMAGE" && item.image?.url)
            .map((item) => (
            <div key={item.id} className="aspect-square">
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
