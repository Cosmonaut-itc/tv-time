import * as THREE from "three";

/** Libera una rama una sola vez, también los mapas guardados en uniforms. */
export function destruirGrupo(grupo: THREE.Group, texturasExtra: readonly THREE.Texture[] = []): void {
  const geometrias = new Set<THREE.BufferGeometry>();
  const materiales = new Set<THREE.Material>();
  const texturas = new Set<THREE.Texture>(texturasExtra);
  grupo.traverse((objeto) => {
    if (objeto instanceof THREE.Mesh || objeto instanceof THREE.Points || objeto instanceof THREE.Sprite) {
      if (!(objeto instanceof THREE.Sprite)) geometrias.add(objeto.geometry);
      const lista = Array.isArray(objeto.material) ? objeto.material : [objeto.material];
      lista.forEach((material: THREE.Material) => materiales.add(material));
    }
  });
  materiales.forEach((material) => {
    Object.values(material).forEach((valor: unknown) => {
      if (valor instanceof THREE.Texture) texturas.add(valor);
    });
    if (material instanceof THREE.ShaderMaterial) {
      Object.values(material.uniforms).forEach((uniforme: THREE.IUniform<unknown>) => {
        if (uniforme.value instanceof THREE.Texture) texturas.add(uniforme.value);
      });
    }
  });
  geometrias.forEach((geometria) => geometria.dispose());
  materiales.forEach((material) => material.dispose());
  texturas.forEach((textura) => textura.dispose());
  grupo.clear();
}
