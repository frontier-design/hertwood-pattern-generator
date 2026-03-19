// View cube — orientation indicator with drag-to-orbit and click-to-snap
import { Scene3D, THREE } from './scene3d.js';

var ViewCube = {
    renderer: null,
    scene: null,
    camera: null,
    group: null,
    canvas: null,
    faces: [],
    raycaster: new THREE.Raycaster(),

    init: function () {
        this.canvas = document.getElementById('view-cube');
        if (!this.canvas) return;

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(120, 120);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        this.camera.position.set(0, 0, 3.5);

        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.buildCube();
        this.bindEvents();
    },

    buildCube: function () {
        var faceData = [
            { dir: new THREE.Vector3(0, 0, 1),  label: 'Front',  color: 0xf0f0f0 },
            { dir: new THREE.Vector3(0, 0, -1), label: 'Back',   color: 0xe8e8e8 },
            { dir: new THREE.Vector3(0, 1, 0),  label: 'Top',    color: 0xf5f5f5 },
            { dir: new THREE.Vector3(0, -1, 0), label: 'Bottom', color: 0xe0e0e0 },
            { dir: new THREE.Vector3(1, 0, 0),  label: 'Right',  color: 0xebebeb },
            { dir: new THREE.Vector3(-1, 0, 0), label: 'Left',   color: 0xe5e5e5 }
        ];

        var size = 0.9;
        var self = this;
        self.faces = [];

        faceData.forEach(function (face) {
            var geo = new THREE.PlaneGeometry(size * 2, size * 2);
            var mat = new THREE.MeshBasicMaterial({
                color: face.color, side: THREE.DoubleSide,
                transparent: true, opacity: 0.9
            });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(face.dir.clone().multiplyScalar(size));
            mesh.lookAt(face.dir.clone().multiplyScalar(size * 2));
            mesh.userData = { direction: face.dir, label: face.label };
            self.faces.push(mesh);
            self.group.add(mesh);

            // Text label
            var c = document.createElement('canvas');
            c.width = 128; c.height = 128;
            var ctx = c.getContext('2d');
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.font = '500 24px -apple-system, Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(face.label, 64, 64);

            var tex = new THREE.CanvasTexture(c);
            var lGeo = new THREE.PlaneGeometry(size * 1.8, size * 1.8);
            var lMat = new THREE.MeshBasicMaterial({
                map: tex, transparent: true, side: THREE.DoubleSide, depthTest: false
            });
            var lMesh = new THREE.Mesh(lGeo, lMat);
            lMesh.position.copy(face.dir.clone().multiplyScalar(size + 0.01));
            lMesh.lookAt(face.dir.clone().multiplyScalar(size * 2 + 0.01));
            self.group.add(lMesh);
        });

        // Edges
        var edgesGeo = new THREE.BoxGeometry(size * 2, size * 2, size * 2);
        var edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(edgesGeo),
            new THREE.LineBasicMaterial({ color: 0xcccccc })
        );
        this.group.add(edges);
    },

    bindEvents: function () {
        var self = this;
        var isDragging = false;
        var dragStart = { x: 0, y: 0 };
        var dragMoved = false;

        this.canvas.addEventListener('mousedown', function (e) {
            isDragging = true;
            dragMoved = false;
            dragStart.x = e.clientX;
            dragStart.y = e.clientY;
            e.preventDefault();
        });

        window.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            var dx = e.clientX - dragStart.x;
            var dy = e.clientY - dragStart.y;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true;
            if (!dragMoved) return;

            var speed = 0.01;
            var cam = Scene3D.camera;
            var spherical = new THREE.Spherical().setFromVector3(cam.position);
            spherical.theta -= dx * speed;
            spherical.phi -= dy * speed;
            spherical.phi = Math.max(0.05, Math.min(Math.PI - 0.05, spherical.phi));
            cam.position.setFromSpherical(spherical);
            cam.lookAt(0, 0, 0);
            Scene3D.controls.update();
            Scene3D.render();
            Scene3D.syncCameraToParams();
            self.update();

            dragStart.x = e.clientX;
            dragStart.y = e.clientY;
        });

        window.addEventListener('mouseup', function (e) {
            if (!isDragging) return;
            isDragging = false;
            if (!dragMoved) {
                var rect = self.canvas.getBoundingClientRect();
                var mouse = new THREE.Vector2(
                    ((e.clientX - rect.left) / rect.width) * 2 - 1,
                    -((e.clientY - rect.top) / rect.height) * 2 + 1
                );
                self.raycaster.setFromCamera(mouse, self.camera);
                var hits = self.raycaster.intersectObjects(self.faces);
                if (hits.length > 0) {
                    var dir = hits[0].object.userData.direction;
                    if (dir) self.snapTo(dir);
                }
            }
        });

        this.canvas.style.cursor = 'grab';
    },

    snapTo: function (direction) {
        var cam = Scene3D.camera;
        var dist = cam.position.length();
        var target = direction.clone().multiplyScalar(dist);
        var startPos = cam.position.clone();
        var startTime = performance.now();
        var self = this;

        (function tween(now) {
            var t = Math.min(1, (now - startTime) / 400);
            var ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            cam.position.lerpVectors(startPos, target, ease);
            cam.lookAt(0, 0, 0);
            Scene3D.controls.update();
            Scene3D.render();
            Scene3D.syncCameraToParams();
            self.update();
            if (t < 1) requestAnimationFrame(tween);
        })(performance.now());
    },

    update: function () {
        if (!this.group || !Scene3D.camera) return;
        this.group.quaternion.copy(Scene3D.camera.quaternion).invert();
        this.renderer.render(this.scene, this.camera);
    }
};

export { ViewCube };
