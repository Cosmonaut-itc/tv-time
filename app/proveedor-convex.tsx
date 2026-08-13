"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

const urlConvex = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!urlConvex) throw new Error("Falta NEXT_PUBLIC_CONVEX_URL.");

const convex = new ConvexReactClient(urlConvex);

export default function ProveedorConvex({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
