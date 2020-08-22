import * as THREE from "three";

const FFT_SIZE = 1024;

type UniformNames = "time" | "tAudioData";

let gotUserMedia = false;

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.Camera;
let sound: THREE.Audio;
let analyser: THREE.AudioAnalyser;
let uniforms: Record<UniformNames, THREE.IUniform>;

let vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

let fragmentShader = `
varying vec2 vUv;

uniform float time;
uniform sampler2D tAudioData;

void main()	{
  vec2 p = - 1.0 + 2.0 * vUv;
  float a = time * 40.0;
  float d, e, f, g = 1.0 / 40.0, h, i, r, q;

  float strech = 64.0;
  float offset = 1.0 / 32.0;
  float ratio = 1.0 / 3.0;

  e = 400.0 * ( p.x * 0.5 + 0.5 );
  f = 400.0 * ( p.y * 0.5 + 0.5 );
  i = 200.0 + sin( e * g + a / 150.0 ) * 20.0;
  d = 200.0 + cos( f * g / 2.0 ) * 18.0 + cos( e * g ) * 7.0;
  r = sqrt( pow( abs( i - e ), 2.0 ) + pow( abs( d - f ), 2.0 ) );
  q = f / r;
  e = ( r * cos( q ) ) - a / 2.0;
  f = ( r * sin( q ) ) - a / 2.0;
  d = sin( e * g ) * 176.0 + sin( e * g ) * 164.0 + r;
  h = ( ( f + d ) + a / 2.0 ) * g;
  i = cos( h + r * p.x / 1.3 ) * ( e + e + a ) + cos( q * g * 6.0 ) * ( r + h / 3.0 );
  h = sin( f * g ) * 144.0 - sin( e * g ) * 212.0 * p.x;
  h = ( h + ( f - e ) * q + sin( r - ( a + h ) / 7.0 ) * 10.0 + i / 4.0 ) * g;
  h *= texture2D(tAudioData, vec2(h / strech + offset, 0.0)).r * ratio + (1.0 - ratio);
  i += cos( h * 2.3 * sin( a / 350.0 - q ) ) * 184.0 * sin( q - ( r * 4.3 + a / 12.0 ) * g ) + tan( r * g + h ) * 184.0 * cos( r * g + h );
  i = mod( i / 5.6, 256.0 ) / 64.0;
  if ( i < 0.0 ) i += 4.0;
  if ( i >= 2.0 ) i = 4.0 - i;
  d = r / 350.0;
  d += sin( d * d * 8.0 ) * 0.52;
  f = ( sin( a * g ) + 1.0 ) / 2.0;
  gl_FragColor = vec4( vec3( f * i / 1.6, i / 2.0 + d / 13.0, i ) * d * p.x + vec3( i / 1.3 + d / 8.0, i / 2.0 + d / 18.0, i ) * d * ( 1.0 - p.x ), 1.0 );
}
`;

init();
animate();

function init(): void {
  let container = document.getElementById("main")!;

  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene = new THREE.Scene();

  let listener = new THREE.AudioListener();
  listener.setMasterVolume(0);
  camera.add(listener);

  sound = new THREE.Audio(listener);
  analyser = new THREE.AudioAnalyser(sound, FFT_SIZE);

  let geometry = new THREE.PlaneBufferGeometry(2, 2);

  let audioDataTexture = new THREE.DataTexture(
    analyser.data,
    FFT_SIZE / 2,
    1,
    THREE.LuminanceFormat
  );

  audioDataTexture.minFilter = THREE.LinearFilter;
  audioDataTexture.magFilter = THREE.LinearFilter;

  uniforms = {
    time: { value: 1.0 },
    tAudioData: {
      value: audioDataTexture,
    },
  };

  let material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
  });

  let mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  onWindowResize();

  window.addEventListener("resize", onWindowResize);
  renderer.domElement.addEventListener("click", getUserMedia);
}

function onWindowResize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight);
}

async function getUserMedia(): Promise<void> {
  if (gotUserMedia) return;

  let stream: MediaStream;

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    console.error("Could not get user media:", e);
    return;
  }

  sound.setMediaStreamSource(stream);
  sound.context.resume();

  gotUserMedia = true;
}

function animate(): void {
  requestAnimationFrame(animate);

  analyser.getFrequencyData();
  uniforms.time.value = performance.now() / 1000;
  uniforms.tAudioData.value.needsUpdate = true;

  renderer.render(scene, camera);
}
