"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAction } from "convex/react";
import { useEffect, useState } from "react";

export type ProveedorDisponibilidad = { nombre: string; logoPath: string };
export type EstadoDisponibilidad =
  | { estado: "buscando" }
  | { estado: "sin tmdb" }
  | { estado: "sin datos" }
  | {
      estado: "datos";
      flatrate: ProveedorDisponibilidad[];
      renta: ProveedorDisponibilidad[];
      compra: ProveedorDisponibilidad[];
    };

export type ChipDisponibilidad = {
  proveedor: ProveedorDisponibilidad;
  prefijo?: "Renta" | "Compra";
};

export function normalizarProveedor(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function colorDeProveedor(nombre: string): string {
  const normalizado = normalizarProveedor(nombre);
  if (normalizado.includes("netflix")) return "#E50914";
  if (normalizado.includes("prime")) return "#00A8E1";
  if (normalizado.includes("disney")) return "#1F6FEB";
  if (normalizado.includes("hbo max") || normalizado === "max") return "#8A2BE2";
  if (normalizado.includes("apple tv")) return "#C9C9C9";
  return "var(--laton)";
}

export function chipsDe(
  disponibilidad: EstadoDisponibilidad | null,
): ChipDisponibilidad[] {
  if (disponibilidad?.estado !== "datos") return [];
  if (disponibilidad.flatrate.length > 0) {
    return disponibilidad.flatrate.map((proveedor) => ({ proveedor }));
  }
  if (disponibilidad.renta.length > 0) {
    return disponibilidad.renta
      .slice(0, 3)
      .map((proveedor) => ({ proveedor, prefijo: "Renta" }));
  }
  return disponibilidad.compra
    .slice(0, 3)
    .map((proveedor) => ({ proveedor, prefijo: "Compra" }));
}

export default function ChipsDisponibilidad({
  salaId,
  tituloId,
}: {
  salaId: Id<"salas">;
  tituloId: Id<"titulos">;
}) {
  const buscarDisponibilidad = useAction(api.disponibilidad.deTitulo);
  const [disponibilidad, setDisponibilidad] =
    useState<EstadoDisponibilidad | null>({ estado: "buscando" });

  useEffect(() => {
    let vigente = true;
    void buscarDisponibilidad({ salaId, tituloId })
      .then((resultado) => {
        if (vigente) setDisponibilidad(resultado);
      })
      .catch(() => {
        if (vigente) setDisponibilidad({ estado: "sin datos" });
      });
    return () => {
      vigente = false;
    };
  }, [buscarDisponibilidad, salaId, tituloId]);

  const chipsDisponibles = chipsDe(disponibilidad);
  const sinProveedoresEnMexico =
    disponibilidad?.estado === "datos" && chipsDisponibles.length === 0;

  return (
    <>
      {chipsDisponibles.length > 0 && (
        <>
          <div className="servicios">
            {chipsDisponibles.map(({ proveedor, prefijo }) => (
              <span
                className={`chip${prefijo ? " renta" : ""}`}
                key={`${prefijo ?? "suscripción"}-${proveedor.nombre}`}
              >
                <i
                  className="punto"
                  style={{ background: colorDeProveedor(proveedor.nombre) }}
                />
                {prefijo ? `${prefijo} · ` : ""}
                {proveedor.nombre}
              </span>
            ))}
          </div>
          <p className="fuente">Disponibilidad · JustWatch</p>
        </>
      )}
      {disponibilidad?.estado === "buscando" && (
        <p className="fuente">buscando disponibilidad…</p>
      )}
      {sinProveedoresEnMexico && (
        <p className="fuente">sin disponibilidad en México</p>
      )}
      {(disponibilidad?.estado === "sin datos" ||
        disponibilidad?.estado === "sin tmdb") && (
        <p className="fuente">sin datos de disponibilidad</p>
      )}
    </>
  );
}
