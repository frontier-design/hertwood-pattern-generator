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
        radius: document.getElementById('radius'),
        offsetX: document.getElementById('offsetX'),
        offsetY: document.getElementById('offsetY'),
        rotation: document.getElementById('rotation'),
        layerSpread: document.getElementById('layerSpread'),
        camTheta: document.getElementById('camTheta'),
        camPhi: document.getElementById('camPhi'),
        camZoom: document.getElementById('camZoom')
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
        radius: document.getElementById('radiusVal'),
        offsetX: document.getElementById('offsetXVal'),
        offsetY: document.getElementById('offsetYVal'),
        rotation: document.getElementById('rotationVal'),
        layerSpread: document.getElementById('layerSpreadVal'),
        camTheta: document.getElementById('camThetaVal'),
        camPhi: document.getElementById('camPhiVal'),
        camZoom: document.getElementById('camZoomVal')
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
        radius: 45,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        layerSpread: 0,
        camTheta: 0,
        camPhi: 31,
        camZoom: 583,
        strokeColor: '#000000',
        bgColor: '#ffffff'
    };

    function read() {
        params.ringCount = parseInt(sliders.ringCount.value);
        params.spokeCount = parseInt(sliders.spokeCount.value);
        params.strokeWidth = parseInt(sliders.strokeWidth.value) / 10;
        params.dotSize = parseInt(sliders.dotSize.value) / 10;
        params.segments = parseInt(sliders.segments.value);
        params.ringGap = parseInt(sliders.ringGap.value);
        params.wobble = parseInt(sliders.wobble.value) / 100;
        params.seed = parseInt(sliders.seed.value);
        params.frequency = parseInt(sliders.frequency.value) / 100;
        params.noise = parseInt(sliders.noise.value) / 100;
        params.radius = parseInt(sliders.radius.value);
        params.offsetX = parseInt(sliders.offsetX.value);
        params.offsetY = parseInt(sliders.offsetY.value);
        params.rotation = parseInt(sliders.rotation.value);
        params.layerSpread = parseInt(sliders.layerSpread.value);
        params.camTheta = parseInt(sliders.camTheta.value);
        params.camPhi = parseInt(sliders.camPhi.value);
        params.camZoom = parseInt(sliders.camZoom.value);
        params.strokeColor = colorInputs.strokeColor.value;
        params.bgColor = colorInputs.bgColor.value;

        labels.ringCount.textContent = params.ringCount;
        labels.spokeCount.textContent = params.spokeCount;
        labels.strokeWidth.textContent = params.strokeWidth.toFixed(1);
        labels.dotSize.textContent = params.dotSize.toFixed(1);
        labels.segments.textContent = params.segments;
        labels.ringGap.textContent = params.ringGap;
        labels.wobble.textContent = sliders.wobble.value;
        labels.seed.textContent = params.seed;
        labels.frequency.textContent = params.frequency.toFixed(1);
        labels.noise.textContent = sliders.noise.value;
        labels.radius.textContent = params.radius;
        labels.offsetX.textContent = params.offsetX;
        labels.offsetY.textContent = params.offsetY;
        labels.rotation.textContent = params.rotation;
        labels.layerSpread.textContent = params.layerSpread;
        labels.camTheta.textContent = params.camTheta;
        labels.camPhi.textContent = params.camPhi;
        labels.camZoom.textContent = params.camZoom;

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
        params.ringCount = p.ringCount;
        params.spokeCount = p.spokeCount;
        params.strokeWidth = p.strokeWidth;
        params.dotSize = p.dotSize;
        params.segments = p.segments;
        params.ringGap = p.ringGap;
        params.wobble = p.wobble;
        params.seed = p.seed;
        params.frequency = p.frequency;
        params.noise = p.noise;
        params.radius = p.radius;
        params.offsetX = p.offsetX;
        params.offsetY = p.offsetY;
        params.rotation = p.rotation;
        params.layerSpread = p.layerSpread;
        params.camTheta = p.camTheta;
        params.camPhi = p.camPhi;
        params.camZoom = p.camZoom;
        if (p.strokeColor !== undefined) params.strokeColor = p.strokeColor;
        if (p.bgColor !== undefined) params.bgColor = p.bgColor;

        sliders.ringCount.value = p.ringCount;
        sliders.spokeCount.value = p.spokeCount;
        sliders.strokeWidth.value = Math.round(p.strokeWidth * 10);
        sliders.dotSize.value = Math.round(p.dotSize * 10);
        sliders.segments.value = p.segments;
        sliders.ringGap.value = p.ringGap;
        sliders.wobble.value = Math.round(p.wobble * 100);
        sliders.seed.value = p.seed;
        sliders.frequency.value = Math.round(p.frequency * 100);
        sliders.noise.value = Math.round(p.noise * 100);
        sliders.radius.value = p.radius;
        sliders.offsetX.value = p.offsetX;
        sliders.offsetY.value = p.offsetY;
        sliders.rotation.value = p.rotation;
        sliders.layerSpread.value = p.layerSpread;
        sliders.camTheta.value = p.camTheta;
        sliders.camPhi.value = p.camPhi;
        sliders.camZoom.value = p.camZoom;
        if (p.strokeColor !== undefined) colorInputs.strokeColor.value = p.strokeColor;
        if (p.bgColor !== undefined) colorInputs.bgColor.value = p.bgColor;

        labels.ringCount.textContent = p.ringCount;
        labels.spokeCount.textContent = p.spokeCount;
        labels.strokeWidth.textContent = p.strokeWidth.toFixed(1);
        labels.dotSize.textContent = p.dotSize.toFixed(1);
        labels.segments.textContent = p.segments;
        labels.ringGap.textContent = p.ringGap;
        labels.wobble.textContent = Math.round(p.wobble * 100);
        labels.seed.textContent = p.seed;
        labels.frequency.textContent = p.frequency.toFixed(1);
        labels.noise.textContent = Math.round(p.noise * 100);
        labels.radius.textContent = p.radius;
        labels.offsetX.textContent = p.offsetX;
        labels.offsetY.textContent = p.offsetY;
        labels.rotation.textContent = p.rotation;
        labels.layerSpread.textContent = p.layerSpread;
        labels.camTheta.textContent = p.camTheta;
        labels.camPhi.textContent = p.camPhi;
        labels.camZoom.textContent = p.camZoom;

        document.body.style.background = params.bgColor;
    }

    return {
        params: params,
        read: read,
        onChange: onChange,
        applyParams: applyParams
    };
})();
