import React, { useEffect, useState } from "react"
import OBR from "@owlbear-rodeo/sdk"

export default function App() {
  const [tokens, setTokens] = useState([])

  useEffect(() => {
    console.log(tokens)
    console.log("je suis dans le use effect")
    const unsubscribe = OBR.onReady(async () => {
      const items = await OBR.scene.items.getItems()
      const tokenItems = items.filter((item) => item.type === "token")

      setTokens(tokenItems)

      const unsubChange = OBR.scene.items.onChange((updatedItems) => {
        const updatedTokens = updatedItems.filter((item) => item.type === "token")
        setTokens(updatedTokens)
      })

      return () => unsubChange()
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-2">🖼️ Tokens avec image</h1>
      {tokens.length === 0 ? (
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
