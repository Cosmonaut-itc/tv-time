import * as THREE from "three";
import { destruirGrupo } from "./recursos.ts";
import { TEX_HALO } from "./texturas.ts";
import type { ModoDeFocos } from "./tipos.ts";

export function crearMarquesina(grupo: THREE.Group) {
    const haloTextura = TEX_HALO();
    const bombillas: { raiz: THREE.Group; vidrio: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>; filamento: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>; halo: THREE.Sprite; brillo: number; objetivo: number }[] = [];
    const geoVidrio = new THREE.CircleGeometry(4.6, 16);
    const geoFilamento = new THREE.CircleGeometry(2.4, 12);

    function armar(cuantas: number) {
      bombillas.forEach((b) => {
        b.vidrio.material.dispose(); b.filamento.material.dispose(); b.halo.material.dispose();
        grupo.remove(b.raiz);
      });
      bombillas.length = 0;
      for (let i = 0; i < cuantas; i += 1) {
        const raiz = new THREE.Group();
        const vidrio = new THREE.Mesh(geoVidrio, new THREE.MeshBasicMaterial({
          color: new THREE.Color(0.32, 0.26, 0.09), transparent: true, opacity: 0.9,
        }));
        const filamento = new THREE.Mesh(geoFilamento, new THREE.MeshBasicMaterial({
          color: new THREE.Color(0.54, 0.44, 0.11),
        }));
        filamento.position.z = 0.1;
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({
          map: haloTextura, blending: THREE.AdditiveBlending,
          depthTest: false, depthWrite: false, transparent: true, opacity: 0,
        }));
        halo.scale.setScalar(30);
        halo.position.z = 0.2;
        raiz.add(vidrio, filamento, halo);
        grupo.add(raiz);
        bombillas.push({ raiz, vidrio, filamento, halo, brillo: 0, objetivo: 0 });
      }
    }

    return {
      grupo,
      destruir() {
        // Las geometrías y el halo existen incluso si todavía no hay focos.
        if (!bombillas.length) { geoVidrio.dispose(); geoFilamento.dispose(); }
        destruirGrupo(grupo, [haloTextura]);
        bombillas.length = 0;
      },
      /* Las bombillas se colocan sobre las mismas coordenadas que ocupan los
         `div.foco` del DOM: la marquesina 3D cae exactamente donde caía. */
      colocar(puntos: readonly { x: number; y: number }[]) {
        if (puntos.length !== bombillas.length) armar(puntos.length);
        puntos.forEach(({ x, y }, i) => bombillas[i].raiz.position.set(x, y, 0));
      },
      setPatron(paso: number, modo: ModoDeFocos) {
        bombillas.forEach((b, indice) => {
          b.objetivo = modo === 'todo' ? 1
            : modo === 'fiesta' ? (paso % 2 === 0 ? 1 : 0)
            : ((indice + paso) % (modo === 'girando' ? 3 : 4) === 0 ? 1 : 0);
        });
      },
      update(t: number, dt: number) {
        const k = Math.min(1, dt * 14);
        bombillas.forEach((b) => {
          b.brillo += (b.objetivo - b.brillo) * k;
          const v = b.brillo;
          b.vidrio.material.color.setRGB(0.32 + 0.68 * v, 0.26 + 0.65 * v, 0.09 + 0.57 * v);
          b.filamento.material.color.setRGB(0.54 + 0.46 * v, 0.44 + 0.52 * v, 0.11 + 0.61 * v);
          b.halo.material.opacity = v * 0.8;
          b.halo.scale.setScalar(22 + 12 * v);
        });
      },
    };
  }
