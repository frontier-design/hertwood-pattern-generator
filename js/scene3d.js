// 3D scene setup — renderer, camera, controls, resize
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

var Scene3D = {
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    ringGroup: null,
    canvas3d: null,
    initialized: false,
    animating: false,

    init: function () {
        if (this.initialized) return;

        this.canvas3d = document.getElementById('canvas3d');

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas3d,
            antialias: true,
            preserveDrawingBuffer: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.position.set(0, 300, 500);
        this.camera.lookAt(0, 0, 0);

        this.controls = new OrbitControls(this.camera, this.canvas3d);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;

        this.ringGroup = new THREE.Group();
        this.scene.add(this.ringGroup);

        var self = this;
        window.addEventListener('resize', function () {
            if (window.viewMode !== '3d') return;
            self.camera.aspect = window.innerWidth / window.innerHeight;
            self.camera.updateProjectionMatrix();
            self.renderer.setSize(window.innerWidth, window.innerHeight);
            if (typeof window.draw3d === 'function') window.draw3d();
        });

        // Sync camera back to sliders when user orbits
        this.controls.addEventListener('change', function () {
            self.syncCameraToParams();
        });

        this.initialized = true;
    },

    syncCameraToParams: function () {
        var spherical = new THREE.Spherical().setFromVector3(this.camera.position);
        var params = Controls.params;
        // Convert to degrees and update params (don't trigger onChange)
        params.camTheta = Math.round(THREE.MathUtils.radToDeg(spherical.theta));
        params.camPhi = Math.round(THREE.MathUtils.radToDeg(spherical.phi));
        params.camZoom = Math.round(spherical.radius);

        // Update slider DOM silently
        var thetaSlider = document.getElementById('camTheta');
        var phiSlider = document.getElementById('camPhi');
        var zoomSlider = document.getElementById('camZoom');
        if (thetaSlider) thetaSlider.value = params.camTheta;
        if (phiSlider) phiSlider.value = params.camPhi;
        if (zoomSlider) zoomSlider.value = params.camZoom;

        var thetaLabel = document.getElementById('camThetaVal');
        var phiLabel = document.getElementById('camPhiVal');
        var zoomLabel = document.getElementById('camZoomVal');
        if (thetaLabel) thetaLabel.textContent = params.camTheta;
        if (phiLabel) phiLabel.textContent = params.camPhi;
        if (zoomLabel) zoomLabel.textContent = params.camZoom;
    },

    applyCameraFromParams: function () {
        var params = Controls.params;
        var spherical = new THREE.Spherical(
            params.camZoom,
            THREE.MathUtils.degToRad(params.camPhi),
            THREE.MathUtils.degToRad(params.camTheta)
        );
        this.camera.position.setFromSpherical(spherical);
        this.camera.lookAt(0, 0, 0);
        this.controls.update();
    },

    render: function () {
        if (!this.initialized) return;
        this.renderer.render(this.scene, this.camera);
    },

    startAnimate: function () {
        if (this.animating) return;
        this.animating = true;
        var self = this;
        (function loop() {
            if (!self.animating) return;
            requestAnimationFrame(loop);
            self.controls.update();
            self.renderer.render(self.scene, self.camera);
            if (typeof window.updateViewCube === 'function') window.updateViewCube();
        })();
    },

    stopAnimate: function () {
        this.animating = false;
    }
};

export { Scene3D, THREE };
