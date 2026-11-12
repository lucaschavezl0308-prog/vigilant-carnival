import React, { createContext, useContext } from "react";

/**
 * Estilo visual de los personajes y la habitación.
 * - "lowpoly": facetado (el look original de la serie).
 * - "suave": sombreado liso, más segmentos y formas redondeadas.
 */
export type VisualStyle = "lowpoly" | "suave";

const StyleContext = createContext<VisualStyle>("lowpoly");

export const StyleProvider: React.FC<{ style: VisualStyle; children: React.ReactNode }> = ({ style, children }) => (
  <StyleContext.Provider value={style}>{children}</StyleContext.Provider>
);

/** true si el video usa el estilo suave */
export const useSmooth = () => useContext(StyleContext) === "suave";

/** Cantidad de segmentos según el estilo: `lo` en low-poly, `hi` en suave. */
export const useSeg = () => {
  const smooth = useSmooth();
  return (lo: number, hi: number) => (smooth ? hi : lo);
};
