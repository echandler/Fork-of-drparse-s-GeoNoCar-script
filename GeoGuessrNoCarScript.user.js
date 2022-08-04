// ==UserScript==
// @name         Fork of drparse's excellent GeoNoCar script v1.7
// @description  Adds trippy effect to GeoNoCar script.
// @namespace    https://www.geoguessr.com/
// @version      1.7
// @author       echandler (original author is drparses)
// @match        https://www.geoguessr.com/*
// @grant        unsafeWindow
// @run-at       document-start
// @copyright    2020, drparse
// @updateURL    https://github.com/echandler/Fork-of-drparse-s-GeoNoCar-script/raw/main/GeoGuessrNoCarScript.user.js
// @license      GPL-3.0-or-later; http://www.gnu.org/licenses/gpl-3.0.txt
// @noframes
// ==/UserScript==

(function() {
    'use strict';

function injected() {
    let info = localStorage['noCarScriptData'];
    info = info? JSON.parse(info): { Theta:  0.85, Omega: 0.53, Phi: 0.10, debug: false, x: 100, y: 100};

    const OPTIONS = {
        colorR: 0.5,
        colorG: 0.5,
        colorB: 0.5,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        size: +info.Theta,
        length: +info.Omega,
        width: +info.Phi,
        debug: info.debug === false? false: true,
    };

console.log(OPTIONS);
    // If the script breaks, search devtools for "BINTULU" and replace these lines with the new one
    const vertexOld = "const float f=3.1415926;varying vec3 a;uniform vec4 b;attribute vec3 c;attribute vec2 d;uniform mat4 e;void main(){vec4 g=vec4(c,1);gl_Position=e*g;a=vec3(d.xy*b.xy+b.zw,1);a*=length(c);}";
    const fragOld = "precision highp float;const float h=3.1415926;varying vec3 a;uniform vec4 b;uniform float f;uniform sampler2D g;void main(){vec4 i=vec4(texture2DProj(g,a).rgb,f);gl_FragColor=i;}";

    const vertexNew = `
        const float f=3.1415926;
        varying vec3 a;
        varying vec3 blob;
        uniform vec4 b;
        attribute vec3 c;


        attribute vec2 d;
        uniform mat4 e;

     //   float angleInRadians = 2.1;
     //   float cc = cos(angleInRadians);
     //   float s = sin(angleInRadians);

     //   mat4 xRotation = mat4(1.0, 0.0, 0.0, 0.0,  0.0, cc, s, 0.0,  0.0, -s, cc, 0.0,  0.0, 0.0, 0.0, 1.0);

        void main(){
            vec4 g=vec4(c,1);
            gl_Position=e * g;

            a = vec3(d.xy * b.xy + b.zw,1);
            a *= length(c);

            blob = vec3(d.xy,1);
        }
    `;

    const fragNew = `
        precision highp float;
        
        varying vec3 a;
        varying vec3 blob;
        
        uniform vec4 b;
        uniform float f;
        uniform sampler2D g;

        float rand(vec2 co){
            return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        float dist(vec2 p0, vec2 pf){
            // https://www.shadertoy.com/view/4tjSW
            return sqrt((pf.x-p0.x)*(pf.x-p0.x)+(pf.y-p0.y)*(pf.y-p0.y));
        }

         vec3 fn(){
            float rx = float(${OPTIONS.innerWidth});
            float ry = float(${OPTIONS.innerHeight});

            vec2 ggg = vec2(blob.x, a.x);
            float randomNoise = rand(ggg); // 0.66 * t.r + 0.94 * t.g * 0.47 * t.b;

            vec2 xy = gl_FragCoord.xy;

            float shadow = (xy.y / ry) + 0.25;

            vec3 red = vec3(1.0,0.0,0.0);
            vec3 blue = vec3(0.0,0.0,1.0);

            vec3 black = vec3(0.1, 0.1, 0.1);
            black *= randomNoise; //  Add some grain so that it visually fits into the scene better.

            vec2 center = vec2(rx * 0.5 , ry * 0.5);
            float d = dist(center, xy) * 0.00085;

            vec3 linearColors = mix(blue, red, xy.x / rx);// Blue to red gradient.

            vec3 fragColor = mix(linearColors, black, d); // Make more radial gradient.
            fragColor *= shadow;

            return fragColor;
        }

        void main(){

            float blobSize = float(${OPTIONS.size});//0.76; // default: 1.0 . Bigger number == bigger blob
            float theta = blob.y * blobSize;

            // Smaller thresholdD1 makes the blob longer. The more distance between
            // thesholdD1 and thresholdD1 makes the blob skinnier. Changing potatoSize
            // changes the overall size equally.
            float threshold1 = float(${OPTIONS.length});//0.45;
            float threshold2 = threshold1 + float(${OPTIONS.width});//0.29; 0.73;

            float x = blob.x;
            float y = abs(4.0*x - 2.0);
            float phi = smoothstep(0.0, 1.0, y > 1.0 ? 2.0 - y : y);
            float _mix = mix(threshold1, threshold2, phi);

            vec3 proj = texture2DProj(g,a).rgb;


            vec4 i = vec4(
                theta > _mix //mix(thresholdD1, thresholdD2, phiD)
                    ? theta < _mix + 0.001 //mix(thresholdD1, thresholdD2, phiD) + 0.001

                        // Add border around "blob".
                        ? vec3(proj.r*0.9, proj.g*0.9, proj.b*0.9)//vec3(0,0,0) //vec3(float(${OPTIONS.colorR}), float(${OPTIONS.colorG}), float(${OPTIONS.colorB})) // texture2DProj(g,a).rgb * 0.259
                        
                        // Add trippy effect.
                        :  ${OPTIONS.debug}
                            ? proj.xyz * 0.7
                            : fn()              //fragColor //linearColors  //vec3((_mix * st.x), (_mix * st.y), (_mix * st.x))//vec3(tan(thetaD * 10000.0) * 0.1, tan(thetaD*10000.0)* 0.1,tan(thetaD* 10000.0) * 0.3 ) //vec3(rand(vec2(potato.y, a.y))*0.2,rand(vec2(potato.x, a.z))*0.2 ,rand(vec2(a.x, a.y))*0.5 )

                    :proj //texture2DProj(g,a).rgb// vec3(_r, _r, _r) //vec3(_r, t.gb) //texture2DProj(g,a).rgb
                , f);

            gl_FragColor=i;
        }
    `;

    let menu ={
        menuBody: null,
        opened: false,
        open: function(){
            this.opened = true;

            let info = localStorage['noCarScriptData'];
            info = info? JSON.parse(info): { Theta:  OPTIONS.size, Omega: OPTIONS.length, Phi: OPTIONS.width, debug: OPTIONS.debug, x: 100, y: 100};

            let body = document.createElement('div');
            body.style.cssText = " position: absolute; top: "+info.y+"px; left: "+info.x+"px; background: white;padding: 10px; border-radius: 10px; border: 1px solid grey;z-index: 100000;";

            this.menuBody = body;

            let table = document.createElement('table');

            let header=document.createElement('tr');
            header.innerHTML = "<th></th><th>No Car Script Menu</th>";

            let tr1 = document.createElement('tr');
            tr1.innerHTML = "<td>Theta</td><td style='text-align:center;'> <input style='width:4em;' type='text' id='ThetaInput' value="+info.Theta+"></td><td> Overall size of the blob. Default: 0.85</td>";
            let tr2 = document.createElement('tr');
            tr2.innerHTML = "<td>Omega</td><td style='text-align:center;'><input style='width:4em;' type='text' id='OmegaInput' value="+info.Omega+"></td><td> Length of the blob. Default: 0.53</td>";
            let tr3 = document.createElement('tr');
            tr3.innerHTML = "<td>Phi</td><td style='text-align:center;'><input style='width:4em;' type='text' id='PhiInput' value="+info.Phi+"></td><td> Width of the blob. Default: 0.10</td>";
            let tr4 = document.createElement('tr');
            tr4.innerHTML = "<td></td><td><input id='debugCheck' type='checkbox' "+(info.debug?"checked":"")+"><span>Debug mode</span></td>";

            let saveBtn = document.createElement('button');
            saveBtn.innerHTML = 'Save';
            saveBtn.addEventListener('click', ()=>{
                info.Theta = document.getElementById('ThetaInput').value;
                info.Omega = document.getElementById('OmegaInput').value;
                info.Phi = document.getElementById('PhiInput').value;
                info.debug = document.getElementById('debugCheck').checked;
                localStorage['noCarScriptData'] = JSON.stringify(info);
            });

            let closeBtn = document.createElement('div');
            closeBtn.style = 'position:absolute; right: 10px; top:10px; cursor: pointer;';
            closeBtn.innerText = 'X';
            closeBtn.addEventListener('click', this.close.bind(this));

            table.appendChild(header);
            table.appendChild(tr1);
            table.appendChild(tr2);
            table.appendChild(tr3);
            table.appendChild(tr4);
            body.appendChild(table);
            body.appendChild(saveBtn);
            body.appendChild(closeBtn);
            document.body.appendChild(body);

            body.addEventListener('mousedown', function(e){
                console.log(e);
                document.body.addEventListener('mousemove', mmove);
                document.body.addEventListener('mouseup', mup);
                let yy = info.y - e.y;
                let xx = e.x - info.x;

                function mmove(evt){
                    if (Math.abs(evt.x - e.x) > 2 || Math.abs(evt.y - e.y) > 2){
                       document.body.removeEventListener('mousemove', mmove);
                       document.body.addEventListener('mousemove', _mmove);
                    }
                }

                function _mmove(evt){
                    body.style.top = evt.y + yy + "px";
                    body.style.left = evt.x - xx + "px";
                }

                function mup(evt){
                    document.body.removeEventListener('mousemove', mmove);
                    document.body.removeEventListener('mousemove', _mmove);
                    document.body.removeEventListener('mouseup', mup);

                    if (Math.abs(evt.x - e.x) < 2 && Math.abs(evt.y - e.y) < 2){
                        return;
                    }

                    info.x = evt.x - xx;
                    info.y = evt.y + yy;
                    localStorage['noCarScriptData'] = JSON.stringify(info);
                }
            });
        },
        close : function(){
            this.opened = false;
            document.body.removeChild(this.menuBody);
            this.menuBody = null;
        },
};

    function installShaderSource(ctx) {
        const g = ctx.shaderSource;
        function shaderSource() {
            if (typeof arguments[1] === 'string') {
                let glsl = arguments[1];
                console.log('BINTULU shader', glsl);

                if (glsl === vertexOld) glsl = vertexNew;
                else if (glsl === fragOld) glsl = fragNew;
                return g.call(this, arguments[0], glsl);                
            }
            return g.apply(this, arguments);
        }
        shaderSource.bestcity = 'bintulu';
        ctx.shaderSource = shaderSource;
    }

    function installGetContext(el) {
        const g = el.getContext;
        el.getContext = function() {
            if (arguments[0] === 'webgl' || arguments[0] === 'webgl2') {
                console.log('shader info', arguments);
                const ctx = g.apply(this, arguments);
                if (ctx && ctx.shaderSource && ctx.shaderSource.bestcity !== 'bintulu') {
                    installShaderSource(ctx);
                }
                return ctx;
            }
            return g.apply(this, arguments);
        };
    }

    const f = document.createElement;
    document.createElement = function() {
        if (arguments[0] === 'canvas' || arguments[0] === 'CANVAS') {
            const el = f.apply(this, arguments);
            installGetContext(el);
            return el;
        }
        return f.apply(this, arguments);
    };

    function addCompassStyle() {
        let style = document.createElement('style');
        style.id = 'bintulu_nocompass';
        style.innerHTML = '.compass { display: none } .game-layout__compass { display: none }';
        document.head.appendChild(style);
   }

    //addCompassStyle();

    document.addEventListener('keydown', (evt) => {
        if (evt.key !== 'Escape') return;
        if (menu.opened){
            menu.close();
        } else {
            menu.open();
        }
    });
}

unsafeWindow.eval(`(${injected.toString()})()`);

})();
