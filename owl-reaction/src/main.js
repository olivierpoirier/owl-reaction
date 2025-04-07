import { useStorage } from "@owlbear-rodeo/sdk"

const storage = useStorage()
const tokenList = document.getElementById("token-list")

// Fonction pour afficher les tokens dans le HTML
function renderTokens(tokens) {
  tokenList.innerHTML = "" // Vide la liste
  if (!tokens || tokens.length === 0) {
    tokenList.innerHTML = "<li>Aucun token sauvegardé</li>"
    return
  }

  tokens.forEach((token) => {
    const li = document.createElement("li")
    li.style.border = "1px solid #ccc"
    li.style.padding = "8px"
    li.style.marginBottom = "4px"
    li.style.borderRadius = "6px"
    li.innerHTML = `
      <strong>${token.name}</strong><br />
      HP : ${token.hp}<br />
      ${token.note ? `<em>${token.note}</em>` : ""}
    `
    tokenList.appendChild(li)
  })
}

// Charger les tokens au lancement
storage.get("customTokens").then((data) => {
  renderTokens(data || [])
})

// Écouter les changements en direct
storage.onChange("customTokens", (data) => {
  renderTokens(data || [])
})
