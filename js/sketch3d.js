// 3D renderer — builds ring geometry and manages mode toggle
import { Scene3D, THREE } from './scene3d.js';
import { ViewCube } from './viewcube.js';

(function () {
    function draw3d() {
        if (!Scene3D.initialized) return;

        var params = Controls.params;
        var w = window.innerWidth;
        var h = window.innerHeight;
        var data = window.computeRings(params, w, h);
        var ringRadii = data.ringRadii;
        var maxRadius = data.maxRadius;
        var segs = data.segs;
        var rotRad = data.rotRad;
        var layerSpread = (params.layerSpread || 0) * maxRadius / 100;

        Scene3D.scene.background = new THREE.Color(params.bgColor);

        // Clear previous geometry
        var group = Scene3D.ringGroup;
        while (group.children.length > 0) {
            var child = group.children[0];
            group.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }

        var strokeColor = new THREE.Color(params.strokeColor);
        var tubeRadius = Math.max(0.3, params.strokeWidth * 0.8);

        // Rings
        for (var i = 0; i < params.ringCount; i++) {
            var curvePoints = [];
            var yPos = i * layerSpread;

            for (var s = 0; s <= segs; s++) {
                var idx = s % segs;
                var angle = (s / segs) * Math.PI * 2 + rotRad;
                var r = ringRadii[i][idx];
                curvePoints.push(new THREE.Vector3(
                    Math.cos(angle) * r, yPos, Math.sin(angle) * r
                ));
            }

            var curve = new THREE.CatmullRomCurve3(curvePoints, true, 'centripetal', 0.5);
            var tubeGeo = new THREE.TubeGeometry(curve, segs * 2, tubeRadius, 6, true);
            var mat = new THREE.MeshBasicMaterial({ color: strokeColor });
            group.add(new THREE.Mesh(tubeGeo, mat));
        }

        // Spokes
        for (var i = 0; i < params.spokeCount; i++) {
            var angle = (360 / params.spokeCount) * i;
            var radians = angle * Math.PI / 180 + rotRad;
            var maxY = (params.ringCount - 1) * layerSpread;
            var spokeGeo = new THREE.BufferGeometry();
            var v = [];
            v.push(
                Math.cos(radians) * maxRadius, 0, Math.sin(radians) * maxRadius,
                Math.cos(radians) * maxRadius, maxY, Math.sin(radians) * maxRadius
            );
            v.push(0, 0, 0, Math.cos(radians) * maxRadius, 0, Math.sin(radians) * maxRadius);
            spokeGeo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
            group.add(new THREE.LineSegments(spokeGeo, new THREE.LineBasicMaterial({ color: strokeColor })));
        }

        // Dots
        if (params.dotSize > 0 && params.spokeCount > 0) {
            var dotGeo = new THREE.SphereGeometry(params.dotSize * 0.8, 6, 6);
            var dotMat = new THREE.MeshBasicMaterial({ color: strokeColor });
            for (var r = 0; r < params.ringCount; r++) {
                var yPos = r * layerSpread;
                for (var s = 0; s < params.spokeCount; s++) {
                    var angle = (360 / params.spokeCount) * s;
                    var radians = angle * Math.PI / 180;
                    var segFloat = (radians / (Math.PI * 2)) * segs;
                    var segA = Math.floor(segFloat) % segs;
                    var segB = (segA + 1) % segs;
                    var t = segFloat - Math.floor(segFloat);
                    var radius = ringRadii[r][segA] * (1 - t) + ringRadii[r][segB] * t;
                    var dotAngle = radians + rotRad;
                    var dot = new THREE.Mesh(dotGeo, dotMat);
                    dot.position.set(Math.cos(dotAngle) * radius, yPos, Math.sin(dotAngle) * radius);
                    group.add(dot);
                }
            }
        }

        // Center vertically
        group.position.y = -((params.ringCount - 1) * layerSpread) / 2;

        // Apply camera from params
        Scene3D.applyCameraFromParams();
        Scene3D.render();
        ViewCube.update();
    }

    // Mode toggle
    window.toggleViewMode = function () {
        var canvas2d = document.getElementById('canvas');
        var modeBtn = document.getElementById('mode-toggle');
        var viewCubeEl = document.getElementById('view-cube');

        if (window.viewMode === '2d') {
            window.viewMode = '3d';
            canvas2d.style.display = 'none';
            Scene3D.canvas3d = document.getElementById('canvas3d');
            Scene3D.canvas3d.style.display = 'block';
            if (viewCubeEl) viewCubeEl.style.display = 'block';
            Scene3D.init();
            ViewCube.init();
            draw3d();
            Scene3D.startAnimate();
            if (modeBtn) modeBtn.textContent = '2D';
        } else {
            window.viewMode = '2d';
            document.getElementById('canvas3d').style.display = 'none';
            canvas2d.style.display = 'block';
            if (viewCubeEl) viewCubeEl.style.display = 'none';
            Scene3D.stopAnimate();
            if (modeBtn) modeBtn.textContent = '3D';
            if (typeof window.draw2d === 'function') window.draw2d();
        }
    };

    window.draw3d = draw3d;
    window.updateViewCube = function () { ViewCube.update(); };
})();
