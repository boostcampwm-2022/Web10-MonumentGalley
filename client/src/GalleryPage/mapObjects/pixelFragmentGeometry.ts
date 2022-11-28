import { BufferGeometry, Color, Float32BufferAttribute } from "three";

type IColor = Color | string | number;

class PixelFragmentGeometry extends BufferGeometry {
  size: number;
  scatterRadius: number;
  rows: number;
  columns: number;
  cellSize: number;
  width: number;
  height: number;
  constructor(pixels: IColor[][], size = 1, scatterRadius = 3) {
    super();

    this.size = size;
    this.scatterRadius = scatterRadius;

    this.rows = pixels.length ?? 0; // height
    this.columns = pixels[0]?.length ?? 0; // width
    const max = Math.max(this.rows, this.columns);
    this.cellSize = size / max;
    this.width = this.columns * this.cellSize;
    this.height = this.rows * this.cellSize;

    const positions = [];
    const normals = [];
    const uvs = [];
    const trianglePivots = [];
    const localRotationQuaternions = [];
    const globalRotationQuaternions = [];
    const globalScatteredDistances = [];
    const colors = [];

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        const { position, uv, pivot, localRot, globalRot, globalDist } = this.#setAttributes(x, y);

        const normal = [];
        const color = [];
        const { r, g, b } = new Color(pixels[y][x]);
        for (let i = 0; i < 6; i++) {
          normal.push(0, 0, 1);
          color.push(r, g, b);
        }

        positions.push(...position);
        normals.push(...normal);
        uvs.push(...uv);
        trianglePivots.push(...pivot);
        localRotationQuaternions.push(...localRot);
        globalRotationQuaternions.push(...globalRot);
        globalScatteredDistances.push(...globalDist);
        colors.push(...color);
      }
    }

    this.setAttribute("position", new Float32BufferAttribute(positions, 3));
    this.setAttribute("normal", new Float32BufferAttribute(normals, 3));
    this.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
    this.setAttribute("pivot", new Float32BufferAttribute(trianglePivots, 3));
    this.setAttribute("localRotation", new Float32BufferAttribute(localRotationQuaternions, 4));
    this.setAttribute("globalRotation", new Float32BufferAttribute(globalRotationQuaternions, 4));
    this.setAttribute("globalDist", new Float32BufferAttribute(globalScatteredDistances, 1));
    this.setAttribute("color", new Float32BufferAttribute(colors, 3));
  }
  #setVertexAttributes(xIndex: number, yIndex: number, lx: number, ly: number) {
    const xPos = this.cellSize * (xIndex + lx) - this.width / 2;
    const yPos = this.height / 2 - this.cellSize * (yIndex + ly);
    const ux = (xIndex + lx) / this.columns;
    const uy = (yIndex + ly) / this.rows;

    return {
      position: [xPos, yPos, 0],
      uv: [ux, uy],
    };
  }
  #setTriangleAttributes() {
    const localRot = this.#makeRandomAxisAngle();
    const globalRot = this.#makeRandomAxisAngle();
    const globalDist = (Math.random() * 0.8 + 0.2) * this.scatterRadius;

    return {
      localRot: this.#makeTriple<number>(localRot),
      globalRot: this.#makeTriple<number>(globalRot),
      globalDist: [globalDist, globalDist, globalDist],
    };
  }
  #setUpperTriangleAttributes(x: number, y: number) {
    const vert1 = this.#setVertexAttributes(x, y, 0, 0);
    const vert2 = this.#setVertexAttributes(x, y, 0, 1);
    const vert3 = this.#setVertexAttributes(x, y, 1, 1);
    const position = [...vert1.position, ...vert2.position, ...vert3.position];
    const uv = [...vert1.uv, ...vert2.uv, ...vert3.uv];
    const pivot = this.#setVertexAttributes(x, y, 0.25, 0.25).position;

    return {
      position,
      uv,
      pivot: this.#makeTriple<number>(pivot),
      ...this.#setTriangleAttributes(),
    };
  }
  #setLowerTriangleAttributes(x: number, y: number) {
    const vert1 = this.#setVertexAttributes(x, y, 0, 0);
    const vert2 = this.#setVertexAttributes(x, y, 1, 1);
    const vert3 = this.#setVertexAttributes(x, y, 1, 0);
    const position = [...vert1.position, ...vert2.position, ...vert3.position];
    const uv = [...vert1.uv, ...vert2.uv, ...vert3.uv];
    const pivot = this.#setVertexAttributes(x, y, 0.75, 0.75).position;

    return {
      position,
      uv,
      pivot: this.#makeTriple<number>(pivot),
      ...this.#setTriangleAttributes(),
    };
  }
  #makeTriple<T>(arr: T[]) {
    const result = [];
    for (let i = 0; i < 3; i++) {
      result.push(...arr);
    }
    return result;
  }
  #setAttributes(x: number, y: number) {
    // upper-left side
    const upper = this.#setUpperTriangleAttributes(x, y);
    // lower-right side
    const lower = this.#setLowerTriangleAttributes(x, y);

    return {
      position: [...upper.position, ...lower.position],
      uv: [...upper.uv, ...lower.uv],
      pivot: [...upper.pivot, ...lower.pivot],
      localRot: [...upper.localRot, ...lower.localRot],
      globalRot: [...upper.globalRot, ...lower.globalRot],
      globalDist: [...upper.globalDist, ...lower.globalDist],
    };
  }
  #makeRandomAxisAngle() {
    // Derived from https://mathworld.wolfram.com/SpherePointPicking.html
    const u = (Math.random() - 0.5) * 2;
    const t = Math.random() * Math.PI * 2;
    const f = Math.sqrt(1 - u ** 2);

    const x = f * Math.cos(t);
    const y = f * Math.sin(t);
    const z = u;
    const angle = (Math.random() * 2 - 1) * Math.PI;
    return [x, y, z, angle];
  }
}

export default PixelFragmentGeometry;