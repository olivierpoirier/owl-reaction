import React, { useEffect, useState } from "react"
import OBR from "@owlbear-rodeo/sdk"
import { motion, AnimatePresence } from "framer-motion"

export default function App() {
  const [items, setItems] = useState([])
  const [noScene, setNoScene] = useState(false)
  const [audioUrl, setAudioUrl] = useState("")
  const [audioList, setAudioList] = useState([])
  const [helpOpen, setHelpOpen] = useState(false)
  const [notification, setNotification] = useState(null)

  const apiUrl = "https://owl-reaction-backend-server.vercel.app/api/dropbox-files" // 🔁 À adapter selon ton déploiement

  function convertDropboxLink(url) {
    if (!url.includes("dropbox.com")) return url

    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const rlkey = urlObj.searchParams.get("rlkey")
    const st = urlObj.searchParams.get("st")

    if (!rlkey || !st) return url

    return `https://www.dropbox.com${pathname}?rlkey=${rlkey}&st=${st}&raw=1`
  }

  // 📡 Écoute des messages audio
  useEffect(() => {
    OBR.onReady(() => {
      console.log("🟢 OBR prêt, écoute de mini-tracks-play...")
      OBR.broadcast.onMessage("mini-tracks-play", (event) => {
        const { url, playAt } = event.data
        const from = event.connectionId

        console.log("📥 Reçu mini-tracks-play depuis", from ?? "❓ inconnu", url)
        setNotification(`🔊 Son déclenché par ${from?.slice(0, 6) ?? "❓ inconnu"}`)
        setTimeout(() => setNotification(null), 3000)

        const wait = Math.max(playAt - Date.now(), 0)

        setTimeout(() => {
          const audio = new Audio(url)
          audio.play()
            .then(() => console.log("🔊 Audio joué avec succès"))
            .catch((e) => console.warn("🔇 Échec de lecture audio :", e))
        }, wait)
      })
    })
  }, [])

  // 🎬 Initialisation de la scène
  useEffect(() => {
    OBR.onReady(async () => {
      const checkScene = async () => {
        try {
          const isSceneReady = await OBR.scene.isReady()
          if (!isSceneReady) {
            setTimeout(checkScene, 500)
            return
          }

          const allItems = await OBR.scene.items.getItems()
          const tokenItems = allItems.filter(
            (item) => item.type === "IMAGE" && item.layer === "CHARACTER" && item.visible === true
          )
          setItems(tokenItems)

          const unsubChange = OBR.scene.items.onChange((updatedItems) => {
            const updatedTokens = updatedItems.filter(
              (item) => item.type === "IMAGE" && item.layer === "CHARACTER" && item.visible === true
            )
            setItems(updatedTokens)
          })

          return () => unsubChange()
        } catch (err) {
          console.error("❌ Erreur scène :", err)
          setNoScene(true)
        }
      }

      checkScene()
    })
  }, [])

  // 🔄 Récupération des sons depuis le backend
  useEffect(() => {
    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        setAudioList(data)
        if (data.length > 0) {
          const first = data[0].path
          const fixedUrl = `https://www.dropbox.com/home${first}?raw=1`.replace("/home", "")
          setAudioUrl(fixedUrl)
        }
      })
      .catch(err => console.error("❌ Erreur chargement des sons :", err))
  }, [])

  function playTrack() {
    const delay = 600
    const playAt = Date.now() + delay

    const message = {
      url: audioUrl,
      playAt
    }

    console.log("📤 Envoi du message mini-tracks-play :", message)
    OBR.broadcast.sendMessage("mini-tracks-play", message)

    setTimeout(() => {
      const audio = new Audio(audioUrl)
      audio.play().catch(e => console.warn("🔇 Audio bloqué localement :", e))
    }, delay)
  }

  function makeItemBigger(item) {
    const normalScalex = item.scale.x
    const normalScaley = item.scale.y

    if (!item.metadata.isAlreadyClicked || item.metadata.isAlreadyClicked === false) {
      OBR.scene.items.updateItems([item.id], (items) => {
        for (let item of items) {
          item.scale.x = 10
          item.scale.y = 10
          item.metadata.isAlreadyClicked = true
        }
      })

      playTrack()

      setTimeout(() => {
        OBR.scene.items.updateItems([item.id], (items) => {
          for (let item of items) {
            item.scale.x = normalScalex
            item.scale.y = normalScaley
            item.metadata.isAlreadyClicked = false
          }
        })
      }, 1000)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <AnimatePresence>
        {notification && (
          <motion.div
            className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-2 rounded shadow-lg z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.h1
        className="text-3xl font-extrabold text-center mb-6 text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        🥸 Owl Reaction 🥸
      </motion.h1>

      <motion.div
        className="mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {audioList.length > 0 && (
          <select
            className="w-full border border-gray-300 rounded px-4 py-2 text-sm mb-2 bg-white"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
          >
            {audioList.map((file) => {
              const url = `https://www.dropbox.com${file.path}?raw=1`
              return (
                <option key={file.name} value={url}>{file.name}</option>
              )
            })}
          </select>
        )}

        <input
          className="w-full border border-gray-300 rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          type="text"
          value={audioUrl}
          onChange={(e) => setAudioUrl(convertDropboxLink(e.target.value))}
          placeholder="Colle ici ton lien audio (Dropbox, etc.)"
        />
        <p className="text-xs text-gray-400 mt-1 break-all">
          🔗 Lien audio actif : <span className="font-mono">{audioUrl}</span>
        </p>
      </motion.div>

      {/* Section Aide */}
      <div className="mb-6">
        <button
          onClick={() => setHelpOpen(!helpOpen)}
          className="flex items-center gap-2 text-sm font-medium text-purple-500 hover:text-purple-700 transition"
        >
          <span>{helpOpen ? "▲" : "▼"}</span>
          ❓ Comment utiliser Owl Reaction ?
        </button>

        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={helpOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="overflow-hidden mt-2 bg-purple-50 border border-purple-200 text-sm text-gray-800 rounded p-4"
        >
          <h2 className="font-bold text-purple-700 mb-2">📘 Guide d'utilisation :</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Les <strong>tokens IMAGE</strong> visibles dans le layer <code>CHARACTER</code> sont automatiquement affichés.
            </li>
            <li>
              Chaque token est <strong>cliquable</strong> : il grossit pendant 1 seconde et joue un son.
            </li>
            <li>
              Le son est <strong>diffusé à tous les joueurs</strong> via Owlbear.
            </li>
            <li>
              Tu peux sélectionner un son Dropbox depuis la liste déroulante, ou coller un lien à la main.
            </li>
            <li>
              Pour Dropbox :
              <ul className="list-disc pl-5">
                <li>Upload ton fichier</li>
                <li>Clic droit → Partager → Copier le lien</li>
                <li>Colle-le ici, <strong>le lien sera automatiquement corrigé</strong> 😉</li>
              </ul>
            </li>
            <li>
              Exemple valide:  
              <code className="block mt-1 bg-white text-sm rounded px-2 py-1">
                https://www.dropbox.com/scl/fi/abc123/boom.mp3?rlkey=abc&st=xyz&raw=1
              </code>
            </li>
          </ul>
        </motion.div>
      </div>

      {noScene ? (
        <p className="text-center text-red-500">🚫 Aucune scène active détectée.</p>
      ) : items.length === 0 ? (
        <p className="text-center italic text-gray-500">Aucun token IMAGE trouvé</p>
      ) : (
        <motion.div
          className="grid grid-cols-3 sm:grid-cols-5 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          {items
            .filter((item) => item.type === "IMAGE" && item.image?.url)
            .map((item) => (
              <motion.button
                key={item.id}
                onClick={() => makeItemBigger(item)}
                className="aspect-square rounded-xl hover:scale-105 transition overflow-hidden bg-transparent p-0"
                whileHover={{ rotate: 1 }}
                whileTap={{ scale: 0.95 }}
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1 },
                }}
              >
                <motion.img
                  src={item.image.url}
                  alt={item.name || "Image"}
                  className="w-full h-full object-contain pointer-events-none"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </motion.button>
            ))}
        </motion.div>
      )}
    </div>
  )
}