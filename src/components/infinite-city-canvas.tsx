"use client";

import { useEffect, useRef } from "react";

type InfiniteCityCanvasProps = {
  className?: string;
};

const vertexShaderSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

float box(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

float scene(vec3 p) {
  float cell = 3.4;
  float id = floor((p.z + u_time * 5.1) / cell);
  vec3 q = p;
  q.z = mod(p.z + u_time * 5.1, cell) - cell * 0.5;

  float side = sign(p.x);
  q.x = abs(q.x) - 2.35 - hash(id) * 0.72;
  q.y -= 0.15 + hash(id + side * 11.7) * 0.9;
  float towers = box(q, vec3(0.42 + hash(id + 3.1) * 0.36, 1.0 + hash(id + 5.7) * 1.6, 0.8));

  vec3 rib = p;
  rib.z = mod(p.z + u_time * 3.8, 1.05) - 0.525;
  float arch = abs(length(rib.xy * vec2(0.9, 1.35)) - 3.05) - 0.012;
  float floorLine = abs(p.y + 1.18) - 0.018;
  float ceilingLine = abs(p.y - 1.78) - 0.018;

  return min(towers, min(arch, min(floorLine, ceilingLine)));
}

float trace(vec3 ro, vec3 rd, out float glow) {
  float t = 0.0;
  glow = 0.0;
  for (int i = 0; i < 78; i++) {
    vec3 p = ro + rd * t;
    float d = scene(p);
    glow += exp(-18.0 * abs(d)) * 0.012;
    if (d < 0.004 || t > 34.0) {
      break;
    }
    t += d * 0.72;
  }
  return t;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
  vec2 mouse = (u_mouse / max(u_resolution, vec2(1.0)) - 0.5) * 2.0;

  vec3 ro = vec3(0.0, 0.18, -3.2);
  vec3 rd = normalize(vec3(uv, 1.52));
  rd.xz *= rot(mouse.x * 0.18 + sin(u_time * 0.18) * 0.04);
  rd.yz *= rot(-0.16 + mouse.y * 0.12);

  float glow = 0.0;
  float t = trace(ro, rd, glow);
  float fog = exp(-t * 0.055);
  vec3 p = ro + rd * t;

  float pulse = 0.55 + 0.45 * sin(u_time * 1.7 + p.z * 0.9);
  vec3 base = mix(vec3(0.015, 0.025, 0.055), vec3(0.01, 0.12, 0.17), smoothstep(-0.3, 1.0, uv.y));
  vec3 neonA = vec3(0.08, 0.94, 1.0);
  vec3 neonB = vec3(0.55, 0.32, 1.0);
  vec3 color = base;

  color += neonA * glow * 1.45;
  color += neonB * glow * pulse * 0.7;
  color += vec3(0.02, 0.18, 0.22) * fog;
  color *= 1.0 - smoothstep(0.72, 1.65, length(uv)) * 0.42;

  gl_FragColor = vec4(color, 0.92);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export function InfiniteCityCanvas({ className = "" }: InfiniteCityCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });

    if (!gl) {
      return;
    }

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) {
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const mouseLocation = gl.getUniformLocation(program, "u_mouse");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    let width = 0;
    let height = 0;
    let frame = 0;
    const start = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const movePointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.x = event.clientX - rect.left;
      pointerRef.current.y = rect.height - (event.clientY - rect.top);
    };

    const render = () => {
      frame = requestAnimationFrame(render);
      gl.useProgram(program);
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform2f(mouseLocation, pointerRef.current.x, pointerRef.current.y);
      gl.uniform1f(timeLocation, (performance.now() - start) * 0.001);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", movePointer, { passive: true });
    frame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", movePointer);
      cancelAnimationFrame(frame);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      if (positionBuffer) {
        gl.deleteBuffer(positionBuffer);
      }
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
