import React, { useEffect, useState } from "react"
import OBR from "@owlbear-rodeo/sdk"

export default function App() {
  const [tokens, setTokens] = useState([])

  useEffect(() => {
    console.log("🔄 useEffect déclenché, en attente que OBR soit prêt...")

    const unsubscribe = OBR.onReady(async () => {
      console.log("✅ OBR est prêt")

      try {
        const items = await OBR.scene.items.getItems()
        console.log("📦 Tous les objets de la scène :", items)

        const tokenItems = items.filter((item) => item.type === "token")
        console.log("🧩 Tokens détectés :", tokenItems)

        setTokens(tokenItems)

        const unsubChange = OBR.scene.items.onChange((updatedItems) => {
          console.log("🔁 Mise à jour de la scène détectée")
          const updatedTokens = updatedItems.filter((item) => item.type === "token")
          console.log("🧩 Tokens mis à jour :", updatedTokens)
          setTokens(updatedTokens)
        })

        return () => {
          console.log("🧹 Nettoyage de l'écouteur de scène")
          unsubChange()
        }
      } catch (err) {
        console.error("❌ Erreur en récupérant les items de la scène :", err)
      }
    })

    return () => {
      console.log("🧹 Nettoyage du useEffect principal")
      unsubscribe()
    }
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-2">🖼️ Tokens avec image</h1>
      {tokens.length === 0 ? (
        <p className="text-sm italic">Aucun token trouvé sur la scène</p>
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
