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
    <div className="p-4">
      <h1 className="text-lg font-bold mb-2">🧾 TEXT & 🖼️ IMAGE Items</h1>

      {noScene ? (
        <p className="text-sm text-red-500">🚫 Aucune scène active détectée.</p>
      ) : items.length === 0 ? (
        <p className="text-sm italic">Aucun élément TEXT ou IMAGE trouvé</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => (
            <div key={item.id} className="border rounded p-2 bg-white shadow">
              <p className="text-xs text-gray-500 mb-1">Type: {item.type}</p>

              {item.type === "IMAGE" && item.image?.url && (
                <img
                  src={item.image.url}
                  alt={item.name || "Image"}
                  className="w-full h-auto rounded"
                />
              )}

              {item.type === "TEXT" && (
                <div className="text-sm font-medium text-center text-blue-700">
                  {item.text?.plainText || "(Texte vide)"}
                </div>
              )}

              <p className="text-xs mt-2 text-center text-gray-800 font-semibold">
                {item.name || "Sans nom"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
