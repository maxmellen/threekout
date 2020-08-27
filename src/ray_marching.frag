uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D tAudioData;

const int MAX_MARCHING_STEPS = 255;
const float MIN_DIST = 0.0;
const float MAX_DIST = 100.0;
const float EPSILON = 0.0001;

float sphereSDF(vec3 samplePoint) {
  return length(samplePoint) - 1.0;
}

float sceneSDF(vec3 samplePoint) {
  return sphereSDF(samplePoint);
}

float shortestDistanceToSurface(vec3 eye, vec3 marchingDirection, float start, float end) {
  float depth = start;
  for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
    float dist = sceneSDF(eye + depth * marchingDirection);
    if (dist < EPSILON) return depth;
    depth += dist;
    if (depth >= end) return end;
  }
  return end;
}

vec3 rayDirection(float fieldOfView, vec2 size, vec2 fragCoord) {
  vec2 xy = fragCoord - size / 2.0;
  float z = size.y / tan(radians(fieldOfView) / 2.0);
  return normalize(vec3(xy, -z));
}

vec3 estimateNormal(vec3 p) {
  return normalize(vec3(
    sceneSDF(vec3(p.x + EPSILON, p.y, p.z)) - sceneSDF(vec3(p.x - EPSILON, p.y, p.z)),
    sceneSDF(vec3(p.x, p.y + EPSILON, p.z)) - sceneSDF(vec3(p.x, p.y - EPSILON, p.z)),
    sceneSDF(vec3(p.x, p.y, p.z + EPSILON)) - sceneSDF(vec3(p.x, p.y, p.z - EPSILON))
  ));
}

vec3 phongContribForLight(vec3 kD, vec3 kS, float alpha, vec3 p, vec3 eye, vec3 lightPos, vec3 lightIntensity) {
  vec3 N = estimateNormal(p);
  vec3 L = normalize(lightPos - p);
  vec3 V = normalize(eye - p);
  vec3 R = normalize(reflect(-L, N));

  float dotLN = dot(L, N);
  float dotRV = dot(R, V);

  if (dotLN < 0.0) {
    return vec3(0.0);
  }

  if (dotRV < 0.0) {
    return lightIntensity * (kD * dotLN);
  }

  return lightIntensity * (kD * dotLN + kS * pow(dotRV, alpha));
}

vec3 phongIllumination(vec3 kA, vec3 kD, vec3 kS, float alpha, vec3 p, vec3 eye) {
  const vec3 ambientLight = vec3(0.5);

  vec3 color = ambientLight * kA;

  vec3 light1Pos = vec3(4.0 * sin(u_time), 2.0, 4.0 * cos(u_time));
  vec3 light1Intensity = vec3(0.4);

  vec3 light2Pos = vec3(2.0 * sin(0.37 * u_time), 2.0 * cos(0.37 * u_time), 2.0);
  vec3 light2Intensity = vec3(0.4);

  color += phongContribForLight(kD, kS, alpha, p, eye, light1Pos, light1Intensity);
  color += phongContribForLight(kD, kS, alpha, p, eye, light2Pos, light2Intensity);

  return color;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec3 dir = rayDirection(45.0, u_resolution.xy, fragCoord);
  vec3 eye = vec3(0.0, 0.0, 5.0);
  float dist = shortestDistanceToSurface(eye, dir, MIN_DIST, MAX_DIST);

  if (dist > MAX_DIST - EPSILON) {
    fragColor = vec4(vec3(0.0), 1.0);
    return;
  }

  vec3 p = eye + dist * dir;

  vec3 kA = vec3(0.1, 0.0, 0.3);
  vec3 kD = vec3(0.0, 0.5, 1.0);
  vec3 kS = vec3(1.0, 0.7, 0.9);
  float alpha = 100.0;

  vec3 color = phongIllumination(kA, kD, kS, alpha, p, eye);

  fragColor = vec4(color, 1.0);
}

void main()	{
  mainImage(gl_FragColor, gl_FragCoord.xy / 2.0);
}
