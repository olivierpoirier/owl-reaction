import React, { useEffect, useState } from "react"
import OBR from "@owlbear-rodeo/sdk"

const SETTINGS_KEY = "allowPlayerResize"

export default function App() {
  const [items, setItems] = useState([])
  const [noScene, setNoScene] = useState(false)
  const [canResize, setCanResize] = useState(false)
  const [isGM, setIsGM] = useState(false)

  // 🔁 Initialisation (rôle + métadonnées)
  useEffect(() => {
    OBR.onReady(async () => {
      const role = await OBR.player.getRole()
      setIsGM(role === "GM")

      const metadata = await OBR.scene.getMetadata()
      setCanResize(Boolean(metadata[SETTINGS_KEY]))

      OBR.scene.onMetadataChange((newMeta) => {
        setCanResize(Boolean(newMeta[SETTINGS_KEY]))
      })
    })
  }, [])

  // 📦 Chargement et suivi des items
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
            (item) => item.type === "IMAGE" || item.type === "TEXT"
          )
          setItems(filtered)

          const unsubChange = OBR.scene.items.onChange((updatedItems) => {
            const filteredUpdated = updatedItems.filter(
              (item) => item.type === "IMAGE" || item.type === "TEXT"
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

  // 🔘 Toggle MJ
  const toggleResizePermission = async () => {
    const newValue = !canResize
    await OBR.scene.setMetadata({ [SETTINGS_KEY]: newValue })
    setCanResize(newValue)
  }

  // 💥 Agrandir temporairement
  const enlargeTemporarily = async (item) => {
    const originalScale = item.scale || { x: 1, y: 1 }

    await OBR.scene.items.updateItems([
      {
        id: item.id,
        scale: {
          x: originalScale.x * 4,
          y: originalScale.y * 4,
        },
      }
    ])

    setTimeout(async () => {
      await OBR.scene.items.updateItems([
        {
          id: item.id,
          scale: originalScale,
        }
      ])
    }, 1000)
  }

  // 🖱️ Clic image
  const handleClick = async (item) => {
    if (item.type !== "IMAGE") return

    if (canResize) {
      await enlargeTemporarily(item)
    } else {
      alert("🚫 Le MJ a désactivé le redimensionnement d’image.")
    }
  }

  return (
    <div className="p-4 max-w-[500px] mx-auto">
      <h1 className="text-lg font-bold mb-4 text-center">
        🧾 TEXT & 🖼️ IMAGE Items
      </h1>

      {isGM && (
        <div className="flex items-center justify-between mb-4 p-2 bg-gray-100 rounded shadow">
          <span className="font-medium">🎛️ Autoriser redimensionnement joueurs</span>
          <button
            onClick={toggleResizePermission}
            className={`px-4 py-1 rounded text-white font-semibold ${
              canResize ? "bg-green-600" : "bg-red-500"
            }`}
          >
            {canResize ? "Activé" : "Désactivé"}
          </button>
        </div>
      )}

      {noScene ? (
        <p className="text-sm text-red-500 text-center">
          🚫 Aucune scène active détectée.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm italic text-center">
          Aucun élément TEXT ou IMAGE trouvé
        </p>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {items
            .filter((item) => item.type === "IMAGE" && item.image?.url)
            .map((item) => (
              <div key={item.id} className="aspect-square">
                <img
                  src={item.image?.url || ""}
                  alt={item.name || "Image"}
                  className="w-full h-full object-contain rounded shadow cursor-pointer hover:scale-105 transition"
                  onClick={() => handleClick(item)}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
