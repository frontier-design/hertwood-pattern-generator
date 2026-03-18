document.fonts.load('800 16px "GT Flexa Wide"').then(function () {
    var canvas = document.getElementById('canvas');
    paper.setup(canvas);

    var params = Controls.params;

    function pseudoRandom(n) {
        var x = Math.sin(params.seed + n * 127.1) * 43758.5453;
        return x - Math.floor(x);
    }

    function rawWobble(ringIndex, segIndex, angle) {
        var freq = params.frequency;
        var w = 0;
        w += Math.sin(angle * 3 * freq + ringIndex * 0.7) * 0.08;
        w += Math.sin(angle * 7 * freq - ringIndex * 1.3) * 0.04;
        w += Math.sin(angle * 13 * freq + ringIndex * 2.1) * 0.02;
        w += (pseudoRandom(ringIndex * 100 + segIndex) - 0.5) * 0.03 * (params.noise / 0.3);
        return w * params.wobble / 0.3;
    }

    function draw() {
        paper.project.clear();

        var viewCenter = paper.view.center;
        var center = new paper.Point(
            viewCenter.x + params.offsetX * paper.view.size.width / 100,
            viewCenter.y + params.offsetY * paper.view.size.height / 100
        );
        var maxRadius = Math.min(paper.view.size.width, paper.view.size.height) * (params.radius / 100);
        var ringSpacing = maxRadius / params.ringCount;
        var segs = Math.max(6, params.segments);
        var rotRad = params.rotation * Math.PI / 180;

        // Pre-compute ring radii per segment
        var ringRadii = [];
        for (var i = 0; i < params.ringCount; i++) {
            ringRadii.push([]);
            var baseRadius = (i + 1) * ringSpacing;
            for (var s = 0; s < segs; s++) {
                var angle = (s / segs) * Math.PI * 2;
                var offset = rawWobble(i + 1, s, angle) * ringSpacing;
                ringRadii[i].push(baseRadius + offset);
            }
        }

        // Clamp to prevent crossing — ringGap controls minimum distance between rings
        var minGap = ringSpacing * (params.ringGap / 100);
        for (var s = 0; s < segs; s++) {
            for (var i = 1; i < params.ringCount; i++) {
                var floor = ringRadii[i - 1][s] + minGap;
                if (ringRadii[i][s] < floor) {
                    ringRadii[i][s] = floor;
                }
            }
            for (var i = params.ringCount - 2; i >= 0; i--) {
                var ceil = ringRadii[i + 1][s] - minGap;
                if (ringRadii[i][s] > ceil) {
                    ringRadii[i][s] = ceil;
                }
            }
            if (ringRadii[0][s] < minGap) {
                ringRadii[0][s] = minGap;
            }
        }

        // Draw rings
        for (var i = 0; i < params.ringCount; i++) {
            var points = [];
            for (var s = 0; s < segs; s++) {
                var angle = (s / segs) * Math.PI * 2 + rotRad;
                var r = ringRadii[i][s];
                points.push(new paper.Point(
                    center.x + Math.cos(angle) * r,
                    center.y + Math.sin(angle) * r
                ));
            }

            var ring = new paper.Path({
                segments: points,
                closed: true,
                strokeColor: new paper.Color(params.strokeColor),
                strokeWidth: params.strokeWidth
            });
            ring.smooth({ type: 'continuous' });
        }

        // Spokes
        for (var i = 0; i < params.spokeCount; i++) {
            var angle = (360 / params.spokeCount) * i;
            var radians = angle * Math.PI / 180 + rotRad;
            new paper.Path.Line({
                from: center,
                to: new paper.Point(
                    center.x + Math.cos(radians) * maxRadius,
                    center.y + Math.sin(radians) * maxRadius
                ),
                strokeColor: new paper.Color(params.strokeColor),
                strokeWidth: params.strokeWidth
            });
        }

        // Dots at intersections
        if (params.dotSize > 0) {
            for (var r = 0; r < params.ringCount; r++) {
                for (var s = 0; s < params.spokeCount; s++) {
                    var angle = (360 / params.spokeCount) * s;
                    var radians = angle * Math.PI / 180;
                    var segFloat = (radians / (Math.PI * 2)) * segs;
                    var segA = Math.floor(segFloat) % segs;
                    var segB = (segA + 1) % segs;
                    var t = segFloat - Math.floor(segFloat);
                    var radius = ringRadii[r][segA] * (1 - t) + ringRadii[r][segB] * t;

                    var dotAngle = radians + rotRad;
                    new paper.Path.Circle({
                        center: new paper.Point(
                            center.x + Math.cos(dotAngle) * radius,
                            center.y + Math.sin(dotAngle) * radius
                        ),
                        radius: params.dotSize,
                        fillColor: new paper.Color(params.strokeColor)
                    });
                }
            }
        }
    }

    window.draw = draw;
    Controls.onChange(draw);
    draw();

    paper.view.onResize = function () {
        draw();
    };

});

// Keyboard shortcuts — outside font callback so they always work
document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey) return;
    var tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

    var canvas = document.getElementById('canvas');

    if (e.key === 'a') {
        if (paper.project) {
            var svg = paper.project.exportSVG({ asString: true });
            var blob = new Blob([svg], { type: 'image/svg+xml' });
            var link = document.createElement('a');
            link.download = 'radial-grid.svg';
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
        }
    } else if (e.key === 's') {
        if (canvas) {
            var link = document.createElement('a');
            link.download = 'radial-grid.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    }
});
