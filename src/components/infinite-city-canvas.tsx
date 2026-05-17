"use client";

import { useEffect, useRef } from "react";

type InfiniteCityCanvasProps = {
  className?: string;
};

const vertexShaderSource = `#version 300 es
precision highp float;
in vec4 position;

void main() {
  gl_Position = position;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform vec2 move;
uniform vec2 wheel;

#define FC gl_FragCoord.xy
#define R resolution
#define T (time+113.)
#define S smoothstep
#define N normalize
#define MN min(R.x,R.y)
#define hue(a) (.5+.5*sin(3.14*(a)+vec3(1,2,3)))
#define LP vec3(1.+1.*sin(-T),2.-2.*cos(T),-3.-4.*sin(sin(T)))

vec3 render(vec2 uv);

void main() {
  O = vec4(render((FC-.5*R)/MN), 1.0);
}

float smin(float a, float b, float k) {
  k *= log(2.0);
  float x = b - a;
  return a + x / (1.0 - exp2(x / k));
}

float box(vec3 p, vec3 s, float r) {
  p = abs(p) - s + r;
  return length(max(p, 0.0)) + min(0.0, max(max(p.x, p.y), p.z)) - r;
}

float glow;

float map(vec3 p, bool g) {
  float d = length(p - LP) - 0.02;
  if (g) {
    glow += 0.05 / (0.05 + d * d * 80.0);
  }

  p.z -= T * 3.5 + 0.2 * (wheel.y / 80.0);
  p = fract(p) - 0.5;

  vec4 k = vec4(1.0, 0.05, 0.03, 0.1);
  float r = 1e-2;
  return min(
    d,
    smin(
      box(p, k.www, r),
      min(box(p, k.zxz, r), min(box(p, k.xyz, r), box(p, k.yzx, r))),
      0.01
    )
  );
}

vec3 norm(vec3 p) {
  float h = 1e-3;
  vec2 k = vec2(-1.0, 1.0);
  return N(
    k.xyy * map(p + k.xyy * h, false) +
    k.yxy * map(p + k.yxy * h, false) +
    k.yyx * map(p + k.yyx * h, false) +
    k.xxx * map(p + k.xxx * h, false)
  );
}

bool march(inout vec3 p, vec3 rd, out float dd, out float at) {
  for (float i = 0.0; i++ < 400.0;) {
    float d = map(p, true);
    if (abs(d) < 1e-3) {
      return true;
    }
    if (d > 100.0) {
      return false;
    }
    p += rd * d;
    dd += d;
    at += 0.05 * (0.05 / dd);
  }
  return false;
}

vec3 dir(vec2 uv, vec3 p, vec3 t, float z) {
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 f = N(t - p);
  vec3 r = N(cross(up, f));
  vec3 u = N(cross(f, r));
  return mat3(r, u, f) * N(vec3(uv, z));
}

mat3 rotX(float a) {
  float s = sin(a), c = cos(a);
  return mat3(vec3(1.0,0.0,0.0), vec3(0.0,c,-s), vec3(0.0,s,c));
}

mat3 rotY(float a) {
  float s = sin(a), c = cos(a);
  return mat3(vec3(c,0.0,s), vec3(0.0,1.0,0.0), vec3(-s,0.0,c));
}

float rnd(float a) {
  vec2 p = fract(a * vec2(12.9898, 78.233));
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

float curve(float t, float e) {
  t /= e;
  return mix(rnd(floor(t)), rnd(floor(t) + 1.0), pow(S(0.0, 1.0, fract(t)), 10.0));
}

vec3 org() {
  float k = -0.2 * sin(sin(T));
  float drama = 3.14 * curve(T * 0.2, 2.0);
  vec2 m = move / R;
  vec3 ro = vec3(0.0, 0.0, 0.1);
  ro *= rotX(m.y * 6.3 - k - 0.1 + drama / 12.0) *
        rotY(m.x * 6.3 - 0.45 - sin(cos(T * 0.2 - k + drama)));
  return ro;
}

float shadow(vec3 p, vec3 lp) {
  float shd = 1.0;
  float maxd = length(lp - p);
  vec3 l = N(lp - p);
  for (float i = 1e-3; i < maxd;) {
    float d = map(p + l * i, false);
    if (abs(d) < 1e-3) {
      shd = 0.0;
      break;
    }
    shd = min(shd, 64.0 * d / i);
    i += d;
  }
  return shd;
}

float calcAO(vec3 p, vec3 n) {
  float occ = 0.0;
  float sca = 1.0;
  for (float i = 0.0; i < 5.0; i++) {
    float h = 0.01 + i * 0.09;
    float d = map(p + h * n, false);
    occ += (h - d) * sca;
    sca *= 0.55;
    if (occ > 0.35) {
      break;
    }
  }
  return clamp(1.0 - 3.0 * occ, 0.0, 1.0) * (0.5 + 0.5 * n.y);
}

vec3 render(vec2 uv) {
  glow = 0.0;
  vec3 col = vec3(0.0);
  vec3 p = org();
  vec3 ro = p;
  vec3 rd = dir(uv, p, vec3(0.0), 1.0);
  float dd = 0.0;
  float at = 0.0;

  if (march(p, rd, dd, at)) {
    vec3 n = norm(p);
    vec3 lp = LP;
    vec3 l = N(lp - p);
    vec3 e = N(ro - p);
    vec3 r = reflect(-l, n);
    float ld = distance(lp, p);
    float atten = 1.0 / (1.0 + ld * 0.25 + ld * ld * 0.125);
    float ao = calcAO(p, n);
    float shd = shadow(p + n * 5e-2, lp - n * 5e-1);
    col += shd * atten * vec3(0.1, 0.095, 0.09) + clamp(dot(l, n), 0.0, 1.0) * atten * ao * shd;
    col += pow(max(0.0, dot(r, e)), 8.0) * atten * ao * shd;
    col += clamp(dot(-rd, l), 0.0, 1.0) * ao * atten * 1.2;
  }

  float k = mix(max(0.2, 1.0 - distance(LP, ro)), 0.25, fract(sin(dot(ro, vec3(12.9898,78.233,156.345))) * 345678.0));
  float f = S(1.0, 0.0, clamp(dd / 200.0, 0.0, 1.0));
  vec3 tint = vec3(1.2, 0.95, 0.9);
  col += tint * at * k;
  col += hue(3.14 * k + f * f * f) * k * k;
  col = mix(col, vec3(1.0, 0.95, 0.9), S(0.0, 50.0, distance(p, ro)));
  col = tanh(col * col);
  col = sqrt(col);
  col = mix(sqrt(col) * 1.2, col, clamp(S(-0.1, 0.2, dot(uv, uv)), 0.0, 1.0));
  col += tanh(tint * glow);
  vec2 c = FC / R;
  c *= 1.0 - c.yx;
  float vig = c.x * c.y * 25.0;
  vig = pow(vig, 0.25);
  col *= vig;
  return col;
}
`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
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
  const pointerRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const wheelRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
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

    const positionLocation = gl.getAttribLocation(program, "position");
    const timeLocation = gl.getUniformLocation(program, "time");
    const resolutionLocation = gl.getUniformLocation(program, "resolution");
    const moveLocation = gl.getUniformLocation(program, "move");
    const wheelLocation = gl.getUniformLocation(program, "wheel");
    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]),
      gl.STATIC_DRAW,
    );

    let frame = 0;
    const start = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 1.2) * 0.82);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      pointerRef.current.x = canvas.width * 0.5;
      pointerRef.current.y = canvas.height * 0.5;
      pointerRef.current.tx = pointerRef.current.x;
      pointerRef.current.ty = pointerRef.current.y;
    };

    const movePointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = canvas.width / Math.max(rect.width, 1);
      const sy = canvas.height / Math.max(rect.height, 1);
      pointerRef.current.tx = (event.clientX - rect.left) * sx;
      pointerRef.current.ty = (event.clientY - rect.top) * sy;
    };

    const handleWheel = (event: WheelEvent) => {
      wheelRef.current.x += event.deltaX;
      wheelRef.current.y += event.deltaY;
    };

    const render = () => {
      frame = requestAnimationFrame(render);
      pointerRef.current.x += (pointerRef.current.tx - pointerRef.current.x) * 0.04;
      pointerRef.current.y += (pointerRef.current.ty - pointerRef.current.y) * 0.04;

      gl.useProgram(program);
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(timeLocation, (performance.now() - start) * 0.001);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform2f(moveLocation, pointerRef.current.x, pointerRef.current.y);
      gl.uniform2f(wheelLocation, wheelRef.current.x, wheelRef.current.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", movePointer, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    frame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", movePointer);
      window.removeEventListener("wheel", handleWheel);
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
