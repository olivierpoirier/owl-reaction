import React, { useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";

export default function App() {
  const [tokens, setTokens] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = OBR.onReady(() => {
      const storage = OBR.storage;
      storage.get("customTokens").then((data) => {
        setTokens(data || []);
        console.log(data);
      });

      const unsubscribeStorage = storage.onChange("customTokens", (data) => {
        setTokens(data || []);
      });

      return () => {
        unsubscribeStorage();
      };
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">📦 Tokens stockés</h1>
      {error && <p className="text-red-600">{error}</p>}
      {tokens.length === 0 && !error ? (
        <p>Aucun token sauvegardé</p>
      ) : (
        <ul>
          {tokens.map((token) => (
            <li key={token.id}>
              <strong>{token.name}</strong> – PV: {token.hp}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
