let postprocv = `
#version 300 es

varying vec2 vUv;

void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
    
    vUv = uv;
}`;

let postprocf = `
#version 300 es

precision highp float;
precision highp int;
out vec4 out_FragColor;

uniform sampler2D uTexture;
uniform float uSamples;
uniform float uExposure;
uniform vec3 uBackgroundColor;

varying vec2 vUv;

void main() {


    float chromaticAberrationStrength = 0.0;
    // uncomment if you want CA
    // chromaticAberrationStrength = length(vec2(0.5, 0.5) - vUv) * 0.0015;
    
    vec4 color = vec4(
        texture2D(uTexture, vUv + vec2(chromaticAberrationStrength, 0.0)).r,
        texture2D(uTexture, vUv).g,
        texture2D(uTexture, vUv + vec2(-chromaticAberrationStrength, 0.0)).b,
        1.0
    );

    if(color.x < 0.0) color.x = 0.0;
    if(color.y < 0.0) color.y = 0.0;
    if(color.z < 0.0) color.z = 0.0;
    

    const float gamma = 1.0; //2.2;
    vec3 hdrColor = (color.rgb) / (uSamples * uExposure);
  
    // reinhard tone mapping
    vec3 mapped = hdrColor / (hdrColor + vec3(1.0));

    // gamma correction 
    mapped = pow(mapped, vec3(1.0 / gamma));



    out_FragColor = vec4(uBackgroundColor + mapped, 1.0);
}`;