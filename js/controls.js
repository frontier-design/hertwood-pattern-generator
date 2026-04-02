var Controls = (function () {
    var sliders = {
        ringCount: document.getElementById('ringCount'),
        spokeCount: document.getElementById('spokeCount'),
        strokeWidth: document.getElementById('strokeWidth'),
        dotSize: document.getElementById('dotSize'),
        segments: document.getElementById('segments'),
        ringGap: document.getElementById('ringGap'),
        wobble: document.getElementById('wobble'),
        seed: document.getElementById('seed'),
        frequency: document.getElementById('frequency'),
        noise: document.getElementById('noise'),
        wobbleFalloff: document.getElementById('wobbleFalloff'),
        coherence: document.getElementById('coherence'),
        radius: document.getElementById('radius'),
        offsetX: document.getElementById('offsetX'),
        offsetY: document.getElementById('offsetY'),
        rotation: document.getElementById('rotation'),
        layerSpread: document.getElementById('layerSpread'),
        flatten: document.getElementById('flatten'),
        linearize: document.getElementById('linearize'),
        camTheta: document.getElementById('camTheta'),
        camPhi: document.getElementById('camPhi'),
        camZoom: document.getElementById('camZoom'),
        camFov: document.getElementById('camFov')
    };

    var labels = {
        ringCount: document.getElementById('ringCountVal'),
        spokeCount: document.getElementById('spokeCountVal'),
        strokeWidth: document.getElementById('strokeWidthVal'),
        dotSize: document.getElementById('dotSizeVal'),
        segments: document.getElementById('segmentsVal'),
        ringGap: document.getElementById('ringGapVal'),
        wobble: document.getElementById('wobbleVal'),
        seed: document.getElementById('seedVal'),
        frequency: document.getElementById('frequencyVal'),
        noise: document.getElementById('noiseVal'),
        wobbleFalloff: document.getElementById('wobbleFalloffVal'),
        coherence: document.getElementById('coherenceVal'),
        radius: document.getElementById('radiusVal'),
        offsetX: document.getElementById('offsetXVal'),
        offsetY: document.getElementById('offsetYVal'),
        rotation: document.getElementById('rotationVal'),
        layerSpread: document.getElementById('layerSpreadVal'),
        flatten: document.getElementById('flattenVal'),
        linearize: document.getElementById('linearizeVal'),
        camTheta: document.getElementById('camThetaVal'),
        camPhi: document.getElementById('camPhiVal'),
        camZoom: document.getElementById('camZoomVal'),
        camFov: document.getElementById('camFovVal')
    };

    var colorInputs = {
        strokeColor: document.getElementById('strokeColor'),
        bgColor: document.getElementById('bgColor')
    };

    var params = {
        ringCount: 7,
        spokeCount: 0,
        strokeWidth: 0.8,
        dotSize: 1.5,
        segments: 72,
        ringGap: 8,
        wobble: 0.3,
        seed: 42,
        frequency: 1.0,
        noise: 0.3,
        wobbleFalloff: 50,
        coherence: 0,
        radius: 45,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        layerSpread: 0,
        flatten: 0,
        linearize: 0,
        camTheta: 0,
        camPhi: 31,
        camZoom: 583,
        camFov: 50,
        strokeColor: '#000000',
        bgColor: '#ffffff'
    };

    // Slider-to-param conversion rules
    var sliderToParam = {
        strokeWidth: function (v) { return parseInt(v) / 10; },
        dotSize: function (v) { return parseInt(v) / 10; },
        wobble: function (v) { return parseInt(v) / 100; },
        frequency: function (v) { return parseInt(v) / 100; },
        noise: function (v) { return parseInt(v) / 100; }
    };

    var paramToSlider = {
        strokeWidth: function (v) { return Math.round(v * 10); },
        dotSize: function (v) { return Math.round(v * 10); },
        wobble: function (v) { return Math.round(v * 100); },
        frequency: function (v) { return Math.round(v * 100); },
        noise: function (v) { return Math.round(v * 100); }
    };

    var paramToLabel = {
        strokeWidth: function (v) { return v.toFixed(1); },
        dotSize: function (v) { return v.toFixed(1); },
        frequency: function (v) { return v.toFixed(1); },
        wobble: function (v) { return Math.round(v * 100); },
        noise: function (v) { return Math.round(v * 100); }
    };

    function read() {
        Object.keys(sliders).forEach(function (key) {
            var conv = sliderToParam[key];
            params[key] = conv ? conv(sliders[key].value) : parseInt(sliders[key].value);
        });
        params.strokeColor = colorInputs.strokeColor.value;
        params.bgColor = colorInputs.bgColor.value;

        Object.keys(labels).forEach(function (key) {
            var fmt = paramToLabel[key];
            labels[key].textContent = fmt ? fmt(params[key]) : params[key];
        });

        document.body.style.background = params.bgColor;
    }

    function onChange(callback) {
        Object.keys(sliders).forEach(function (key) {
            sliders[key].addEventListener('input', function () {
                read();
                callback();
            });
        });
        Object.keys(colorInputs).forEach(function (key) {
            colorInputs[key].addEventListener('input', function () {
                read();
                callback();
            });
        });
    }

    function applyParams(p) {
        // Only overwrite params that exist in p — missing keys keep current value
        Object.keys(params).forEach(function (key) {
            if (p[key] !== undefined) {
                params[key] = p[key];
            }
        });

        // Sync sliders
        Object.keys(sliders).forEach(function (key) {
            var conv = paramToSlider[key];
            sliders[key].value = conv ? conv(params[key]) : params[key];
        });
        colorInputs.strokeColor.value = params.strokeColor;
        colorInputs.bgColor.value = params.bgColor;

        // Sync labels
        Object.keys(labels).forEach(function (key) {
            var fmt = paramToLabel[key];
            labels[key].textContent = fmt ? fmt(params[key]) : params[key];
        });

        document.body.style.background = params.bgColor;
    }

    return {
        params: params,
        read: read,
        onChange: onChange,
        applyParams: applyParams
    };
})();
