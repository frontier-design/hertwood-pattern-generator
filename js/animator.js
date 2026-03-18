var Animator = (function () {
    var states = [];
    var duration = 2.0;
    var loop = true;
    var playing = false;
    var startTime = 0;
    var animFrameId = null;
    var currentSegment = -1;
    var activeStateIndex = -1;

    // Easing presets: [x1, y1, x2, y2]
    var easingPresets = {
        'linear':          [0, 0, 1, 1],
        'ease':            [0.25, 0.1, 0.25, 1],
        'ease-in':         [0.42, 0, 1, 1],
        'ease-out':        [0, 0, 0.58, 1],
        'ease-in-out':     [0.42, 0, 0.58, 1],
        'ease-in-back':    [0.6, -0.28, 0.735, 0.045],
        'ease-out-back':   [0.175, 0.885, 0.32, 1.275],
        'ease-in-out-back':[0.68, -0.55, 0.265, 1.55],
        'custom':          [0.42, 0, 0.58, 1]
    };
    var currentEasing = 'ease-in-out';

    // Cubic bezier solver — attempt to find t for a given x on the bezier curve
    function cubicBezier(x1, y1, x2, y2) {
        return function (t) {
            if (t <= 0) return 0;
            if (t >= 1) return 1;

            // Newton-Raphson to solve for parameter u where bezierX(u) = t
            var u = t;
            for (var i = 0; i < 8; i++) {
                var bx = sampleBezier(x1, x2, u) - t;
                var dx = sampleBezierDeriv(x1, x2, u);
                if (Math.abs(bx) < 1e-6) break;
                if (Math.abs(dx) < 1e-6) break;
                u -= bx / dx;
            }
            u = Math.max(0, Math.min(1, u));
            return sampleBezier(y1, y2, u);
        };
    }

    function sampleBezier(p1, p2, t) {
        return 3 * p1 * t * (1 - t) * (1 - t) + 3 * p2 * t * t * (1 - t) + t * t * t;
    }

    function sampleBezierDeriv(p1, p2, t) {
        return 3 * p1 * (1 - t) * (1 - t) + 6 * p2 * t * (1 - t) - 3 * p2 * t * t
             - 6 * p1 * t * (1 - t) + 3 * t * t;
    }

    function getEasingFn() {
        var pts = easingPresets[currentEasing];
        return cubicBezier(pts[0], pts[1], pts[2], pts[3]);
    }

    var easeFn = getEasingFn();

    // Utilities
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function hexToRgb(hex) {
        return [
            parseInt(hex.slice(1, 3), 16),
            parseInt(hex.slice(3, 5), 16),
            parseInt(hex.slice(5, 7), 16)
        ];
    }

    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(function (c) {
            return Math.round(Math.max(0, Math.min(255, c)))
                .toString(16).padStart(2, '0');
        }).join('');
    }

    function lerpColor(hexA, hexB, t) {
        var a = hexToRgb(hexA);
        var b = hexToRgb(hexB);
        return rgbToHex(
            lerp(a[0], b[0], t),
            lerp(a[1], b[1], t),
            lerp(a[2], b[2], t)
        );
    }

    function interpolateParams(from, to, t) {
        return {
            ringCount: Math.round(lerp(from.ringCount, to.ringCount, t)),
            spokeCount: Math.round(lerp(from.spokeCount, to.spokeCount, t)),
            strokeWidth: lerp(from.strokeWidth, to.strokeWidth, t),
            dotSize: lerp(from.dotSize, to.dotSize, t),
            segments: Math.round(lerp(from.segments, to.segments, t)),
            ringGap: Math.round(lerp(from.ringGap, to.ringGap, t)),
            wobble: lerp(from.wobble, to.wobble, t),
            seed: Math.round(lerp(from.seed, to.seed, t)),
            frequency: lerp(from.frequency, to.frequency, t),
            noise: lerp(from.noise, to.noise, t),
            radius: lerp(from.radius, to.radius, t),
            offsetX: lerp(from.offsetX, to.offsetX, t),
            offsetY: lerp(from.offsetY, to.offsetY, t),
            rotation: lerp(from.rotation, to.rotation, t),
            strokeColor: lerpColor(from.strokeColor, to.strokeColor, t),
            bgColor: lerpColor(from.bgColor, to.bgColor, t)
        };
    }

    function snapshot() {
        var p = Controls.params;
        states.push({
            ringCount: p.ringCount,
            spokeCount: p.spokeCount,
            strokeWidth: p.strokeWidth,
            dotSize: p.dotSize,
            segments: p.segments,
            ringGap: p.ringGap,
            wobble: p.wobble,
            seed: p.seed,
            frequency: p.frequency,
            noise: p.noise,
            radius: p.radius,
            offsetX: p.offsetX,
            offsetY: p.offsetY,
            rotation: p.rotation,
            strokeColor: p.strokeColor,
            bgColor: p.bgColor
        });
        activeStateIndex = states.length - 1;
        renderStates();
        updatePlayButton();
    }

    function jumpToState(index) {
        if (playing) pause();
        Controls.applyParams(states[index]);
        if (typeof window.draw === 'function') window.draw();
        activeStateIndex = index;
        renderStates();
    }

    function removeState(index) {
        if (playing) pause();
        states.splice(index, 1);
        if (activeStateIndex >= states.length) activeStateIndex = states.length - 1;
        renderStates();
        updatePlayButton();
    }

    function play() {
        if (states.length < 2) return;
        playing = true;
        startTime = performance.now();
        currentSegment = -1;
        document.getElementById('controls').classList.add('animating');
        document.getElementById('animator').classList.add('animating');
        playPauseBtn.textContent = 'Pause';
        playPauseBtn.classList.add('active');
        animFrameId = requestAnimationFrame(tick);
    }

    function pause() {
        playing = false;
        document.getElementById('controls').classList.remove('animating');
        document.getElementById('animator').classList.remove('animating');
        playPauseBtn.textContent = 'Play';
        playPauseBtn.classList.remove('active');
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    }

    function toggle() {
        if (playing) pause(); else play();
    }

    function tick(timestamp) {
        if (!playing) return;

        var n = states.length;
        var elapsed = (timestamp - startTime) / 1000;

        if (loop) {
            var totalDur = duration * n;
            elapsed = elapsed % totalDur;
        } else {
            var totalDur = duration * (n - 1);
            if (elapsed >= totalDur) {
                elapsed = totalDur;
                Controls.applyParams(states[n - 1]);
                if (typeof window.draw === 'function') window.draw();
                pause();
                return;
            }
        }

        var totalSegs = loop ? n : n - 1;
        var segFloat = elapsed / duration;
        if (segFloat >= totalSegs) segFloat = totalSegs - 0.0001;
        var segIndex = Math.floor(segFloat);
        if (segIndex < 0) segIndex = 0;
        if (segIndex >= totalSegs) segIndex = totalSegs - 1;
        var localT = segFloat - segIndex;

        var fromIdx = segIndex % n;
        var toIdx = (segIndex + 1) % n;
        var easedT = easeFn(localT);

        var interpolated = interpolateParams(states[fromIdx], states[toIdx], easedT);

        Controls.applyParams(interpolated);
        if (typeof window.draw === 'function') window.draw();

        if (fromIdx !== currentSegment) {
            currentSegment = fromIdx;
            activeStateIndex = fromIdx;
            renderStates();
        }

        animFrameId = requestAnimationFrame(tick);
    }

    // UI
    var playPauseBtn;
    var loopBtn;
    var statesContainer;
    var durationSlider;
    var durationLabel;

    function buildUI() {
        var panel = document.getElementById('animator');

        // Animator section
        var section = document.createElement('div');
        section.className = 'animator-section';

        // Duration slider
        var durGroup = document.createElement('div');
        durGroup.className = 'control-group';
        var durLabel = document.createElement('label');
        durLabel.textContent = 'Duration';
        durLabel.setAttribute('for', 'duration');
        durationSlider = document.createElement('input');
        durationSlider.type = 'range';
        durationSlider.id = 'duration';
        durationSlider.min = '50';
        durationSlider.max = '1000';
        durationSlider.value = '200';
        durationLabel = document.createElement('span');
        durationLabel.textContent = '2.0s';
        durGroup.appendChild(durLabel);
        durGroup.appendChild(durationSlider);
        durGroup.appendChild(durationLabel);
        section.appendChild(durGroup);

        durationSlider.addEventListener('input', function () {
            duration = parseInt(durationSlider.value) / 100;
            durationLabel.textContent = duration.toFixed(1) + 's';
        });

        // Easing select
        var easingGroup = document.createElement('div');
        easingGroup.className = 'control-group easing-group';
        var easingLabel = document.createElement('label');
        easingLabel.textContent = 'Easing';
        var easingSelect = document.createElement('select');
        easingSelect.id = 'easingSelect';
        Object.keys(easingPresets).forEach(function (key) {
            var opt = document.createElement('option');
            opt.value = key;
            opt.textContent = key;
            if (key === currentEasing) opt.selected = true;
            easingSelect.appendChild(opt);
        });
        easingGroup.appendChild(easingLabel);
        easingGroup.appendChild(easingSelect);
        easingGroup.appendChild(document.createElement('span')); // empty cell
        section.appendChild(easingGroup);

        // Custom bezier input (hidden unless "custom" selected)
        var customGroup = document.createElement('div');
        customGroup.className = 'control-group bezier-input-group';
        customGroup.style.display = 'none';
        var customLabel = document.createElement('label');
        customLabel.textContent = 'Bezier';
        var customInput = document.createElement('input');
        customInput.type = 'text';
        customInput.id = 'bezierInput';
        customInput.placeholder = '0.42, 0, 0.58, 1';
        customInput.value = '0.42, 0, 0.58, 1';
        customGroup.appendChild(customLabel);
        customGroup.appendChild(customInput);
        customGroup.appendChild(document.createElement('span'));
        section.appendChild(customGroup);

        easingSelect.addEventListener('change', function () {
            currentEasing = easingSelect.value;
            customGroup.style.display = currentEasing === 'custom' ? '' : 'none';
            easeFn = getEasingFn();
        });

        customInput.addEventListener('input', function () {
            var parts = customInput.value.split(',').map(function (s) {
                return parseFloat(s.trim());
            });
            if (parts.length === 4 && parts.every(function (n) { return !isNaN(n); })) {
                easingPresets.custom = parts;
                easeFn = getEasingFn();
                customInput.classList.remove('invalid');
            } else {
                customInput.classList.add('invalid');
            }
        });

        // Buttons row
        var btnRow = document.createElement('div');
        btnRow.className = 'animator-buttons';

        var addBtn = document.createElement('button');
        addBtn.textContent = '+ State';
        addBtn.addEventListener('click', snapshot);

        playPauseBtn = document.createElement('button');
        playPauseBtn.textContent = 'Play';
        playPauseBtn.disabled = true;
        playPauseBtn.addEventListener('click', toggle);

        loopBtn = document.createElement('button');
        loopBtn.className = 'loop-toggle active';
        loopBtn.innerHTML = '&#x21BB;';
        loopBtn.title = 'Loop';
        loopBtn.addEventListener('click', function () {
            loop = !loop;
            loopBtn.classList.toggle('active', loop);
        });

        btnRow.appendChild(addBtn);
        btnRow.appendChild(playPauseBtn);
        btnRow.appendChild(loopBtn);
        section.appendChild(btnRow);

        // States list
        statesContainer = document.createElement('div');
        statesContainer.className = 'state-list';
        section.appendChild(statesContainer);

        panel.appendChild(section);
    }

    function formatStateParams(s) {
        return s.ringCount + ' / ' + s.spokeCount + ' / ' + Math.round(s.wobble * 100) + ' / ' + s.seed
            + ' / ' + s.segments + ' / ' + Math.round(s.frequency * 100);
    }

    function renderStates() {
        statesContainer.innerHTML = '';
        var n = states.length;
        for (var i = 0; i < n; i++) {
            (function (idx) {
                var row = document.createElement('div');
                row.className = 'state-row';
                row.draggable = true;
                row.setAttribute('data-idx', idx);
                if (idx === activeStateIndex) {
                    row.classList.add('active');
                }

                var handle = document.createElement('span');
                handle.className = 'state-handle';
                handle.innerHTML = '&#x2261;';

                var number = document.createElement('span');
                number.className = 'state-number';
                number.textContent = idx + 1;

                var params = document.createElement('span');
                params.className = 'state-params';
                params.textContent = formatStateParams(states[idx]);

                var colors = document.createElement('span');
                colors.className = 'state-colors';
                var strokeSwatch = document.createElement('span');
                strokeSwatch.className = 'state-swatch';
                strokeSwatch.style.background = states[idx].strokeColor;
                var bgSwatch = document.createElement('span');
                bgSwatch.className = 'state-swatch';
                bgSwatch.style.background = states[idx].bgColor;
                bgSwatch.style.borderColor = 'rgba(0,0,0,0.15)';
                colors.appendChild(strokeSwatch);
                colors.appendChild(bgSwatch);

                var removeBtn = document.createElement('span');
                removeBtn.className = 'state-remove';
                removeBtn.textContent = '\u00D7';
                removeBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    removeState(idx);
                });

                row.appendChild(handle);
                row.appendChild(number);
                row.appendChild(params);
                row.appendChild(colors);
                row.appendChild(removeBtn);

                row.addEventListener('click', function () {
                    jumpToState(idx);
                });

                // Drag events
                row.addEventListener('dragstart', function (e) {
                    dragSourceIdx = idx;
                    row.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                });
                row.addEventListener('dragend', function () {
                    row.classList.remove('dragging');
                    dragSourceIdx = null;
                    clearDropIndicators();
                });
                row.addEventListener('dragover', function (e) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    clearDropIndicators();
                    if (dragSourceIdx !== null && dragSourceIdx !== idx) {
                        var rect = row.getBoundingClientRect();
                        var midY = rect.top + rect.height / 2;
                        if (e.clientY < midY) {
                            row.classList.add('drop-above');
                        } else {
                            row.classList.add('drop-below');
                        }
                    }
                });
                row.addEventListener('dragleave', function () {
                    row.classList.remove('drop-above', 'drop-below');
                });
                row.addEventListener('drop', function (e) {
                    e.preventDefault();
                    if (dragSourceIdx === null || dragSourceIdx === idx) return;
                    var rect = row.getBoundingClientRect();
                    var midY = rect.top + rect.height / 2;
                    var targetIdx = e.clientY < midY ? idx : idx + 1;
                    moveState(dragSourceIdx, targetIdx);
                    dragSourceIdx = null;
                });

                statesContainer.appendChild(row);
            })(i);
        }
    }

    var dragSourceIdx = null;

    function clearDropIndicators() {
        var rows = statesContainer.querySelectorAll('.state-row');
        for (var i = 0; i < rows.length; i++) {
            rows[i].classList.remove('drop-above', 'drop-below');
        }
    }

    function moveState(fromIdx, toIdx) {
        if (playing) pause();
        var item = states.splice(fromIdx, 1)[0];
        if (toIdx > fromIdx) toIdx--;
        states.splice(toIdx, 0, item);
        if (activeStateIndex === fromIdx) {
            activeStateIndex = toIdx;
        } else if (fromIdx < activeStateIndex && toIdx >= activeStateIndex) {
            activeStateIndex--;
        } else if (fromIdx > activeStateIndex && toIdx <= activeStateIndex) {
            activeStateIndex++;
        }
        renderStates();
    }

    function updatePlayButton() {
        playPauseBtn.disabled = states.length < 2;
    }

    buildUI();

    // Press "P" to toggle play/pause
    document.addEventListener('keydown', function (e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        if (e.metaKey || e.ctrlKey) return;
        if (e.key === 'p') toggle();
    });

    return {
        states: states,
        snapshot: snapshot,
        removeState: removeState,
        play: play,
        pause: pause,
        toggle: toggle
    };
})();
