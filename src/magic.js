import * as THREE from 'three';

export function createMagic(canvas) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch {
    document.documentElement.classList.add('no-webgl');
    return { burst() {}, sweep() {}, dispose() {} };
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.z = 12;
  const count = 140;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [new THREE.Color('#e7c994'), new THREE.Color('#c4a5f5'), new THREE.Color('#f9e8d4')];
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - .5) * 23;
    positions[i * 3 + 1] = (Math.random() - .5) * 14;
    positions[i * 3 + 2] = (Math.random() - .5) * 5;
    const color = palette[i % palette.length];
    colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const particles = new THREE.Points(geometry, new THREE.PointsMaterial({ size: .065, vertexColors: true, transparent: true, opacity: .75, depthWrite: false }));
  scene.add(particles);
  const showerGeometry = new THREE.BufferGeometry();
  const showerPositions = new Float32Array(220 * 3);
  for (let i = 0; i < 220; i++) {
    showerPositions[i * 3] = (Math.random() - .5) * 12;
    showerPositions[i * 3 + 1] = (Math.random() - .5) * 1.4;
    showerPositions[i * 3 + 2] = Math.random() * 2;
  }
  showerGeometry.setAttribute('position', new THREE.BufferAttribute(showerPositions, 3));
  const shower = new THREE.Points(showerGeometry, new THREE.PointsMaterial({ size: .16, color: '#ead0a6', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(shower);
  let sweepStart = 0, burstStart = 0, frame;
  const resize = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    // The original world-space spread was too wide for a portrait viewport.
    const visibleWidth = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
    for (let i = 0; i < 220; i++) showerPositions[i * 3] = (Math.random() - .5) * visibleWidth * .95;
    showerGeometry.attributes.position.needsUpdate = true;
  };
  resize();
  window.addEventListener('resize', resize);
  const clock = new THREE.Clock();
  const animate = () => {
    frame = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    particles.rotation.z = reduceMotion.matches ? 0 : Math.sin(t * .11) * .07;
    particles.position.y = reduceMotion.matches ? 0 : Math.sin(t * .36) * .15;
    if (!reduceMotion.matches && sweepStart) {
      const progress = (performance.now() - sweepStart) / 900;
      shower.position.y = 5 - progress * 10;
      shower.material.opacity = progress < 1 ? Math.sin(progress * Math.PI) * .95 : 0;
      if (progress >= 1) sweepStart = 0;
    }
    if (burstStart) {
      const progress = (performance.now() - burstStart) / 1000;
      particles.material.opacity = progress < 1 ? .75 + .25 * Math.sin(progress * Math.PI) : .75;
      if (progress >= 1) burstStart = 0;
    }
    renderer.render(scene, camera);
  };
  animate();
  return {
    burst() { if (!reduceMotion.matches) burstStart = performance.now(); },
    sweep() { if (!reduceMotion.matches) sweepStart = performance.now(); },
    dispose() { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); geometry.dispose(); showerGeometry.dispose(); particles.material.dispose(); shower.material.dispose(); renderer.dispose(); }
  };
}
