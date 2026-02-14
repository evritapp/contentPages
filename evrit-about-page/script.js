import * as THREE from 'three';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import * as CANNON from 'cannon-es';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Night Mode Toggle
    document.body.addEventListener('dblclick', () => {
       // document.body.classList.toggle('night-mode');
    });

    // 2. Scroll Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target); 
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el));

    // 3. Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({ top: targetElement.offsetTop - 80, behavior: 'smooth' });
            }
        });
    });

    // 4. Stats Counter
    const statsSection = document.querySelector('.stats-row');
    let counted = false;
    const statsObserver = new IntersectionObserver((entries) => {
        if(entries[0].isIntersecting && !counted) {
            counted = true;
            document.querySelectorAll('.stat-number').forEach(stat => {
                const target = stat.innerText;
                if(target.includes('K+')) animateValue(stat, 0, parseInt(target), 2000, 'K+');
                else if (target.includes('.')) animateValueFloat(stat, 0, parseFloat(target), 2000);
            });
        }
    });
    if(statsSection) statsObserver.observe(statsSection);

    function animateValue(obj, start, end, duration, suffix) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start) + suffix;
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }

    function animateValueFloat(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = (progress * (end - start) + start).toFixed(1);
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }

    // 5. Last Word Typography
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
        const walk = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT, null, false);
        let textNodes = [], n;
        while(n = walk.nextNode()) textNodes.push(n);
        for (let i = textNodes.length - 1; i >= 0; i--) {
            const node = textNodes[i], text = node.textContent, match = text.match(/(\S+)\s*$/);
            if (match && match[1]) {
                const lastWord = match[1], lastWordIndex = text.lastIndexOf(lastWord);
                const before = text.substring(0, lastWordIndex), after = text.substring(lastWordIndex + lastWord.length);
                const span = document.createElement('span');
                span.className = 'evrit-last-word';
                span.textContent = lastWord;
                node.textContent = before;
                node.parentNode.insertBefore(span, node.nextSibling);
                if (after) span.parentNode.insertBefore(document.createTextNode(after), span.nextSibling);
                break;
            }
        }
    });

    // 6. Init 3D Alphabet
    initThreeJSAlphabet();
});

function initThreeJSAlphabet() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const params = {
        fontSize: 4,
        fontHeight: 0.4,
        bevelThickness: 0.40,
        bevelSize: 0.15,
        ambientIntensity: 1.0,
        sunIntensity: 1.5,
        linearDamping: 0.99,
        angularDamping: 0.99,
        springForce: 1.5,
        hideForce: 1.0,
        impulseForce: 10,
        centeringForce: 0.001,
        maxVelocity: 15,
        maxAngularVelocity: 2
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);


  
const ambientLight = new THREE.AmbientLight(0xffffff, params.ambientIntensity);
scene.add(ambientLight); 
const sunLight = new THREE.DirectionalLight(0xffffff, params.sunIntensity); 
sunLight.position.set(5, 10, 7.5); 
scene.add(sunLight);                                                                                           

    const world = new CANNON.World();
    world.gravity.set(0, 0, 0);

    const ttfLoader = new TTFLoader();
    const fontLoader = new FontLoader();
    const characters = 'עעעעעעעעעעעעעעעעעעע'.split('');
    const meshes = [], bodies = [];
    const colors = [0xFFBDD3, 0x3DB5FF, 0x0E469A, 0xF75F8A, 0x146EFF, 0xFEFAAE];
    let loadedFont = null;

    let isAtBottom = false;

    ttfLoader.load('evrit-headings.ttf', (json) => {
        try {
            loadedFont = fontLoader.parse(json);
            characters.forEach((char, i) => {
                const geometry = new TextGeometry(char, {
                    font: loadedFont, size: params.fontSize, height: params.fontHeight, curveSegments: 16,
                    bevelEnabled: true, bevelThickness: params.bevelThickness, bevelSize: params.bevelSize, bevelOffset: 0, bevelSegments: 8
                });
                geometry.center();

                const material = new THREE.MeshPhysicalMaterial({
                    color: colors[i % colors.length],
                    roughness: 1.0,
                    metalness: 0.0
                });
                
                const mesh = new THREE.Mesh(geometry, material);
                
                const x = (Math.random() - 0.5) * 30;
                const y = -15 - (Math.random() * 10);
                const z = (Math.random() - 0.5) * 10;
                
                mesh.position.set(x, y, z);
                mesh.userData.isFree = false;
                scene.add(mesh);
                meshes.push(mesh);

                const box = new THREE.Box3().setFromObject(mesh);
                const size = new THREE.Vector3();
                box.getSize(size);
                const body = new CANNON.Body({
                    mass: 1, shape: new CANNON.Box(new CANNON.Vec3(size.x/2, size.y/2, size.z/2)),
                    linearDamping: params.linearDamping,
                    angularDamping: params.angularDamping
                });
                body.position.set(x, y, z);
                world.addBody(body);
                bodies.push(body);
            });
        } catch (e) { console.error("Font error:", e); }
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let draggedBody = null;
    let dragMesh = null;
    let lastMousePos = new THREE.Vector3();
    let mouseDownTime = 0;
    let isDragging = false;

    const handleDown = (event) => {
        const clientX = (event.touches && event.touches[0]) ? event.touches[0].clientX : event.clientX;
        const clientY = (event.touches && event.touches[0]) ? event.touches[0].clientY : event.clientY;
        if (clientX === undefined || clientY === undefined) return;
        
        mouseDownTime = Date.now();
        isDragging = false;
        
        mouse.x = (clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(meshes);
        if (intersects.length > 0) {
            dragMesh = intersects[0].object;
            const idx = meshes.indexOf(dragMesh);
            if (idx !== -1) {
                draggedBody = bodies[idx];
                dragMesh.userData.isFree = true;
                
                // Track initial position for throw calculation
                const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
                vector.unproject(camera);
                const dir = vector.sub(camera.position).normalize();
                const distance = -camera.position.z / dir.z;
                lastMousePos.copy(camera.position.clone().add(dir.multiplyScalar(distance)));

                window.addEventListener('mousemove', handleMove);
                window.addEventListener('mouseup', handleUp);
                window.addEventListener('touchmove', handleMove, { passive: false });
                window.addEventListener('touchend', handleUp);
            }
        }
    };

    const handleMove = (event) => {
        if (!draggedBody) return;
        isDragging = true;
        event.preventDefault(); // Stop scroll while dragging

        const clientX = (event.touches && event.touches[0]) ? event.touches[0].clientX : event.clientX;
        const clientY = (event.touches && event.touches[0]) ? event.touches[0].clientY : event.clientY;
        
        mouse.x = (clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(clientY / window.innerHeight) * 2 + 1;

        // Project mouse to world coordinates at Z=0
        const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));

        // Calculate velocity for "throwing"
        const delta = pos.clone().sub(lastMousePos);
        draggedBody.position.copy(pos);
        
        // Clamp drag velocity
        const vx = Math.max(-params.maxVelocity, Math.min(params.maxVelocity, delta.x * 60));
        const vy = Math.max(-params.maxVelocity, Math.min(params.maxVelocity, delta.y * 60));
        draggedBody.velocity.set(vx, vy, 0); 
        
        lastMousePos.copy(pos);
    };

    const handleUp = () => {
        const duration = Date.now() - mouseDownTime;
        
        // If it was just a quick click (no significant drag or short time)
        if (!isDragging || duration < 200) {
            if (draggedBody) {
                // Apply a very slow nudge instead of a throw
                const nudgeForce = 5; 
                draggedBody.applyImpulse(
                    new CANNON.Vec3((Math.random()-0.5)*nudgeForce, (Math.random()-0.5)*nudgeForce, 0),
                    new CANNON.Vec3(0,0,0)
                );
            }
        }

        draggedBody = null;
        dragMesh = null;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousedown', handleDown);
    window.addEventListener('touchstart', handleDown, { passive: false });

    const clock = new THREE.Clock();
    
    function getVisibleSize() {
        const h = 2 * Math.tan(camera.fov * Math.PI / 180 / 2) * camera.position.z;
        const w = h * camera.aspect;
        return { w, h };
    }

    function animate() {
        requestAnimationFrame(animate);
        const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
        isAtBottom = scrollPercent > 0.85; 

        const visible = getVisibleSize();
        const bottomY = -visible.h / 2;

        world.step(Math.min(clock.getDelta(), 0.1));
        
        for (let i = 0; i < meshes.length; i++) {
            // ENFORCE SPEED LIMITS
            const vel = bodies[i].velocity;
            const speed = vel.length();
            if (speed > params.maxVelocity) {
                vel.scale(params.maxVelocity / speed, vel);
            }
            const angVel = bodies[i].angularVelocity;
            const angSpeed = angVel.length();
            if (angSpeed > params.maxAngularVelocity) {
                angVel.scale(params.maxAngularVelocity / angSpeed, angVel);
            }

            meshes[i].position.copy(bodies[i].position);
            meshes[i].quaternion.copy(bodies[i].quaternion);

            if (!isAtBottom) {
                // FALL QUICKLY: Reduce damping to let physics take over
                bodies[i].linearDamping = 0.4;
                bodies[i].angularDamping = 0.4;

                const hForce = params.hideForce * 4.0; 
                let targetY = bottomY - 10;
                bodies[i].applyForce(new CANNON.Vec3(
                    (0 - bodies[i].position.x) * 0.1, 
                    (targetY - bodies[i].position.y) * hForce, 
                    (0 - bodies[i].position.z) * 0.1
                ), bodies[i].position);
                meshes[i].userData.isFree = false;
            } else {
                // BE CHILL: Restore playground damping
                bodies[i].linearDamping = params.linearDamping;
                bodies[i].angularDamping = params.angularDamping;

                if (!meshes[i].userData.isFree) {
                    const spreadX = (i / (characters.length - 1) - 0.5) * (visible.w * 0.95);
                    let targetY = bottomY + (params.fontSize * 0.7); 
                    
                    bodies[i].applyForce(new CANNON.Vec3(
                        (spreadX - bodies[i].position.x) * 0.2, 
                        (targetY - bodies[i].position.y) * params.springForce, 
                        (0 - bodies[i].position.z) * 0.1
                    ), bodies[i].position);
                } else {
                    bodies[i].applyForce(new CANNON.Vec3(
                        -bodies[i].position.x * params.centeringForce, 
                        -bodies[i].position.y * params.centeringForce, 
                        -bodies[i].position.z * params.centeringForce
                    ), bodies[i].position);
                }
            }
        }
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
