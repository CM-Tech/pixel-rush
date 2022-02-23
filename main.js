var anim;
var playing = false;
var data=[];
var musicD=[];
for(var i=0;i<256;i++){
    musicD[i]=0.1;
}
var songP= window.location.search.substr(1);
if(songP===""||songP===null||songP===undefined)songP="PR";

var mouse = {
    x: 0.5,
    y: 0.5
};
var triangleVertices = [
   -1.0, -1.0,
    1.0, -1.0, 
   -1.0,  1.0,

    1.0, -1.0,
    1.0,  1.0,
   -1.0,  1.0
];
var canvas = document.getElementById("shader");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

var vertexShader = gl.createShader(gl.VERTEX_SHADER);
var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

gl.shaderSource(vertexShader, document.getElementById("vertex").innerHTML);
gl.shaderSource(fragmentShader, document.getElementById("fragment").innerHTML);

gl.compileShader(vertexShader);
gl.compileShader(fragmentShader);

var program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

program.time = gl.getUniformLocation(program, "time");
program.resolution = gl.getUniformLocation(program, "resolution");
program.mus = gl.getUniformLocation(program, "mus");
program.mouse = gl.getUniformLocation(program, "mouse");
program.position = gl.getAttribLocation(program, "vertPosition");

function update(analyser) {
    var freqArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqArray);
    
    data=[];

    for(var i=0;i<256;i++){
        musicD[i]=freqArray[i];
    }

    render();
    anim = window.requestAnimationFrame(update.bind(this, analyser));
}

function loadSound(url, cb) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = function() {
        cb(request.response);
    };
    request.send();
}

loadSound("https://cdn.glitch.com/ef364f9b-9364-4bf2-b3e5-eff45054f075%2F"+songP+".mp3", function(res) {
    var audioContext = new window.AudioContext() || window.webkitAudioContext();
    audioContext.decodeAudioData(res, function(buffer) {
        var analyser = audioContext.createAnalyser();
        var sourceNode = audioContext.createBufferSource();
        analyser.smoothingTimeConstant = 0.6;
        analyser.fftSize = 512;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        sourceNode.buffer = buffer;
        analyser.connect(audioContext.destination);
        sourceNode.connect(analyser);
        sourceNode.start(0);
        update(analyser);

        render();

        playing = true;

        var control = document.querySelector('p');
        control.className = 'fa fa-pause';
        control.textContent = '';

        document.querySelector('p').onclick = function() {
            sourceNode[(playing ? 'dis' : '') + 'connect'](analyser);
            control.className = 'fa fa-' + (playing ? 'play' : 'pause');
            playing ? window.cancelAnimationFrame(anim) : update(analyser);
            playing = !playing;
        };
    });
});

var time = 0;

function render() {
    gl.clearColor(0,0,0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
    gl.useProgram(program);

    gl.uniform1f(program.time, time / 50);
    gl.uniform2f(program.resolution, window.innerWidth, window.innerHeight);
    gl.uniform2f(program.mouse, mouse.x, 1 - mouse.y);
    gl.uniform1fv(program.mus, musicD);
    gl.enableVertexAttribArray(program.position);
    gl.vertexAttribPointer(program.position, 2, gl.FLOAT, gl.FALSE, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, triangleVertices.length/2);
    time++;
}

window.onmousemove = function(e) {
    mouse.x = e.clientX / window.innerWidth;
    mouse.y = e.clientY / window.innerHeight;
};
window.onresize = function() {
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};