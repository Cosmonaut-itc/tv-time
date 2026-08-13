"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

const urlConvex = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = urlConvex ? new ConvexReactClient(urlConvex) : null;

export default function ProveedorConvex({ children }: { children: ReactNode }) {
  if (!convex) {
    return (
      <main className="sala">
        <section className="entrada" aria-live="polite">
          <p className="estado-entrada">La taquilla no está disponible en este momento.</p>
        </section>
      </main>
    );
  }
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
