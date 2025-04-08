import React, { useEffect, useState } from "react"
import OBR from "@owlbear-rodeo/sdk"

export default function App() {
  const [tokens, setTokens] = useState([])
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

          const items = await OBR.scene.items.getItems()
          const tokenItems = items.filter((item) => item.type === "token")
          console.log("🧩 Tokens détectés :", tokenItems)
          setTokens(tokenItems)

          const unsubChange = OBR.scene.items.onChange((updatedItems) => {
            const updatedTokens = updatedItems.filter((item) => item.type === "token")
            setTokens(updatedTokens)
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
      <h1 className="text-lg font-bold mb-2">🖼️ Tokens avec image</h1>

      {noScene ? (
        <p className="text-sm text-red-500">🚫 Aucune scène active détectée.</p>
      ) : tokens.length === 0 ? (
        <p className="text-sm italic">Aucun token trouvé</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {tokens.map((token) => (
            <div key={token.id} className="border rounded p-1 bg-white shadow">
              {token.image?.url ? (
                <img
                  src={token.image.url}
                  alt={token.name || "Token"}
                  className="w-full h-auto rounded"
                />
              ) : (
                <div className="text-xs italic text-gray-500">Pas d’image</div>
              )}
              <p className="text-xs mt-1 text-center">{token.name || "Sans nom"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
