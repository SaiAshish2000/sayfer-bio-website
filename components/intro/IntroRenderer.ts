/**
 * A minimal WebGL2 renderer for the intro: one full-canvas triangle pair and
 * one fragment shader.
 *
 * Deliberately NOT Three.js/R3F even though both are in the project. The intro
 * runs before the site is revealed, so its code is on the critical path of the
 * first visit, and pulling the whole 3D runtime in to draw a single quad would
 * delay the very thing it is meant to open. This file is a few hundred bytes of
 * plain WebGL with no dependencies; Home's spindle scene is untouched and still
 * owns the Three runtime on its own route.
 */
import { VERT, FRAG } from "./introShader";

export type IntroUniforms = {
  t1: number;
  t2: number;
  twist: number;
  warp: number;
  /** Membrane surface relief. Perturbs the normal only, never the silhouette. */
  fold: number;
  /** Emergence scale: 0 = nothing, 1 = full size. */
  emerge: number;
  /** 0 = pores closed, 1 = fully open. */
  pore: number;
  /** Bloom of the living material; retired as the mark resolves. */
  glow: number;
  /** Canvas-height fraction the colour ramp spans; tracks the form's extent. */
  colorSpan: number;
  fade: number;
};

export type IntroConfig = {
  atlas: TexImageSource;
  atlasWidth: number;
  atlasHeight: number;
  /** canvas box / atlas box — headroom so the glow is not clipped */
  pad: number;
  range: number;
  pow: number;
  ramp: number[][];
};

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`intro shader: ${log}`);
  }
  return sh;
}

export class IntroRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private buffer: WebGLBuffer;
  private texture: WebGLTexture;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private start = performance.now();
  private disposed = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private cfg: IntroConfig,
  ) {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("intro: WebGL2 unavailable");
    this.gl = gl;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const p = gl.createProgram()!;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(p);
      gl.deleteProgram(p);
      throw new Error(`intro program: ${log}`);
    }
    this.program = p;
    gl.useProgram(p);

    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    this.buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(p, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this.texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    // The shader works in a y-up space (screen top is +y), so the atlas has to
    // be uploaded bottom-row-first. Without this the field is sampled
    // vertically mirrored — which the near-symmetric silhouettes hide almost
    // completely, except that the mark's S-channels come out swapped, and the
    // hand-over to the real artwork then reads as the logo flipping into place.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cfg.atlas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    // Linear + clamp: the field must interpolate smoothly and must not wrap.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const names = [
      "uAtlas", "uAtlasSize", "uPad", "uScale", "uRange", "uInvPow",
      "uT1", "uT2", "uTwist", "uWarp", "uFold", "uEmerge", "uPore", "uGlow", "uColorSpan", "uTime", "uFade",
    ];
    for (const n of names) this.u[n] = gl.getUniformLocation(p, n);
    for (let i = 0; i < 6; i++) {
      this.u[`uRamp${i}`] = gl.getUniformLocation(p, `uRamp[${i}]`);
    }

    gl.uniform1i(this.u.uAtlas, 0);
    gl.uniform2f(this.u.uAtlasSize, cfg.atlasWidth, cfg.atlasHeight);
    gl.uniform1f(this.u.uPad, cfg.pad);
    gl.uniform1f(this.u.uRange, cfg.range);
    gl.uniform1f(this.u.uInvPow, 1 / cfg.pow);
    for (let i = 0; i < 6; i++) {
      const c = cfg.ramp[i] ?? [0, 1, 0.5];
      gl.uniform3f(this.u[`uRamp${i}`], c[0], c[1], c[2]);
    }
  }

  /** Sizes the drawing buffer. `cssHeight` drives the atlas-px -> screen-px scale. */
  resize(cssWidth: number, cssHeight: number, dpr: number) {
    if (this.disposed) return;
    const w = Math.max(1, Math.round(cssWidth * dpr));
    const h = Math.max(1, Math.round(cssHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.viewport(0, 0, w, h);
    // One atlas pixel spans this many device pixels once padding is applied.
    this.gl.useProgram(this.program);
    this.gl.uniform1f(this.u.uScale, h / (this.cfg.atlasHeight * this.cfg.pad));
  }

  render(v: IntroUniforms) {
    if (this.disposed) return;
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1f(this.u.uT1, v.t1);
    gl.uniform1f(this.u.uT2, v.t2);
    gl.uniform1f(this.u.uTwist, v.twist);
    gl.uniform1f(this.u.uWarp, v.warp);
    gl.uniform1f(this.u.uFold, v.fold);
    gl.uniform1f(this.u.uEmerge, v.emerge);
    gl.uniform1f(this.u.uPore, v.pore);
    gl.uniform1f(this.u.uGlow, v.glow);
    gl.uniform1f(this.u.uColorSpan, v.colorSpan);
    gl.uniform1f(this.u.uFade, v.fade);
    gl.uniform1f(this.u.uTime, (performance.now() - this.start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    const gl = this.gl;
    gl.deleteTexture(this.texture);
    gl.deleteBuffer(this.buffer);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
    // Release the drawing buffer immediately rather than waiting for GC.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
