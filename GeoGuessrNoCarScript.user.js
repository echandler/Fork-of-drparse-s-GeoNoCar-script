// ==UserScript==
// @name         Fork of drparse's excellent GeoNoCar script v2.0
// @description  Improvements to classic GeoNoCar script by drparse.
// @namespace    https://www.geoguessr.com/
// @version      2.0
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
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        size: 0.85, //+info.Theta,
        debug: info.debug === false? false: true,
    };

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
            if (${OPTIONS.debug}){
                vec3 proj = texture2DProj(g,a).rgb;
                return proj * 0.7;
            }
            return vec3(0.5, 0.5, 0.5);
            if (${OPTIONS.debug}){
                vec3 proj = texture2DProj(g,a).rgb;
                return proj * 0.7;
            }
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
            // Unfortunately blobSize was here when the below calculations were made and they
            // will have to be redone to remove blobSize. Maybe in the future sometime....
            float blobSize = 0.85;
            float thetaY = blob.y * blobSize;
            float thetaX = blob.x * blobSize;

            vec3 proj = texture2DProj(g,a).rgb;

            float ty = 0.018; // Made up variable name.
            float aa = 0.469; // Made up variable name.
            
            float middle = 0.425; // Goes from 0.0 to 0.85 instead of 0.0 to 1.0 for some reason.
            
            vec4 i = vec4(

                // Middle is 0.425

                thetaY > 0.453 && thetaY < 0.49 && thetaX > 0.028 && thetaX < 0.045? fn(): // rear Snorkle
                thetaY > 0.453 && thetaY < 0.49 && thetaX > 0.453 && thetaX < 0.47? fn(): // Snorkle


                thetaY > 0.464 && thetaY < (aa + ty * 0.4) && thetaX > (0.375-middle)+0.85 && thetaX < 0.851? fn():  // Left side of origin.
                thetaY > 0.464 && thetaY < (aa + ty * 0.4) && thetaX > -0.1 && thetaX < (0.479-middle)? fn():        // Right side of origin.
                thetaY > 0.464 && thetaY < (aa + ty * 0.4) && thetaX > 0.375 && thetaX < 0.479? fn():

                thetaY > (aa + (ty *0.4)) && thetaY < (aa + ty) && thetaX > (0.368-middle)+0.85 && thetaX < 0.851? fn():    // Left side of origin.
                thetaY > (aa + (ty *0.4)) && thetaY < (aa + ty) && thetaX > -0.1 && thetaX < (0.485-middle)? fn():          // Right side of origin.
                thetaY > (aa + (ty *0.4)) && thetaY < (aa + ty) && thetaX > 0.368 && thetaX < 0.485? fn():

                thetaY > (aa + (ty*1.0)) && (thetaY < aa + (ty*2.0)) && thetaX > (0.349-middle)+0.85 && thetaX < 0.851? fn():
                thetaY > (aa + (ty*1.0)) && (thetaY < aa + (ty*2.0)) && thetaX > -0.1 && thetaX < (0.499-middle)? fn():
                thetaY > (aa + (ty*1.0)) && (thetaY < aa + (ty*2.0)) && thetaX > 0.349 && thetaX < 0.499? fn():

                thetaY > (aa + (ty*2.0)) && (thetaY < aa + (ty*3.0)) && thetaX > (0.330-middle)+0.85 && thetaX < 0.851? fn():
                thetaY > (aa + (ty*2.0)) && (thetaY < aa + (ty*3.0)) && thetaX > -0.1 && thetaX < (0.519-middle)? fn():
                thetaY > (aa + (ty*2.0)) && (thetaY < aa + (ty*3.0)) && thetaX > 0.330 && thetaX < 0.519? fn():

                thetaY > (aa + (ty*3.0)) && (thetaY < aa + (ty*4.0))&& thetaX > (0.319-middle)+0.85 && thetaX < 0.851? fn():
                thetaY > (aa + (ty*3.0)) && (thetaY < aa + (ty*4.0))&& thetaX > -0.1 && thetaX < (0.533-middle)? fn():
                thetaY > (aa + (ty*3.0)) && (thetaY < aa + (ty*4.0))&& thetaX > 0.319 && thetaX < 0.533? fn():

                thetaY > (aa + (ty*4.0)) && (thetaY < aa + (ty*5.0)) && thetaX > (0.313-middle)+0.85 && thetaX < 0.851? fn():
                thetaY > (aa + (ty*4.0)) && (thetaY < aa + (ty*5.0)) && thetaX > -0.1 && thetaX < (0.537-middle)? fn():
                thetaY > (aa + (ty*4.0)) && (thetaY < aa + (ty*5.0)) && thetaX > 0.313 && thetaX < 0.537? fn():

                thetaY > (aa + (ty*5.0)) && (thetaY < aa + (ty*6.0)) && thetaX > (0.304-middle)+0.85 && thetaX < 0.851? fn():
                thetaY > (aa + (ty*5.0)) && (thetaY < aa + (ty*6.0)) && thetaX > -0.1 && thetaX < (0.543-middle)? fn():
                thetaY > (aa + (ty*5.0)) && (thetaY < aa + (ty*6.0)) && thetaX > 0.304 && thetaX < 0.543? fn():
                
                thetaY > (aa + (ty*6.0)) && (thetaY < aa + (ty*7.0)) && thetaX > (0.299-middle)+0.85 && thetaX < 0.851? fn():
                thetaY > (aa + (ty*6.0)) && (thetaY < aa + (ty*7.0)) && thetaX > -0.1 && thetaX < (0.549-middle)? fn():
                thetaY > (aa + (ty*6.0)) && (thetaY < aa + (ty*7.0)) && thetaX > 0.299 && thetaX < 0.549? fn():

                thetaY > (aa + (ty*7.0)) && (thetaY < aa + (ty*8.0)) && thetaX > (0.294-middle)+0.85 && thetaX < 0.851? fn():
                thetaY > (aa + (ty*7.0)) && (thetaY < aa + (ty*8.0)) && thetaX > -0.1 && thetaX < (0.559-middle)? fn():
                thetaY > (aa + (ty*7.0)) && (thetaY < aa + (ty*8.0)) && thetaX > 0.294 && thetaX < 0.559? fn():

                thetaY > (aa + (ty*8.0)) && (thetaY < aa + (ty*8.5)) && thetaX > (0.28-middle)+0.85 && thetaX < 0.851 ? fn():
                thetaY > (aa + (ty*8.0)) && (thetaY < aa + (ty*8.5)) && thetaX > -0.1 && thetaX < (0.563-middle) ? fn():
                thetaY > (aa + (ty*8.0)) && (thetaY < aa + (ty*8.5)) && thetaX > 0.28 && thetaX < 0.563 ? fn():

                thetaY > (aa + (ty*8.4)) && (thetaY < aa + (ty*21.3)) && thetaX > -0.1 && thetaX < 1.0? fn():

                   proj

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
            info = info? JSON.parse(info): { debug: OPTIONS.debug, x: 100, y: 100};

            let body = document.createElement('div');
            body.style.cssText = " position: absolute; top: "+info.y+"px; left: "+info.x+"px; background: white;padding: 10px; border-radius: 10px; border: 1px solid grey;z-index: 100000; min-width:12em";

            this.menuBody = body;

            let table = document.createElement('table');

            let header=document.createElement('tr');
            header.innerHTML = "<th></th><th>No Car Script Menu</th>";

            let tr4 = document.createElement('tr');
            tr4.innerHTML = "<td></td><td><label><input id='debugCheck' type='checkbox' "+(info.debug?"checked":"")+"><span>Debug mode</span></label></td>";

            let saveBtn = document.createElement('button');
            saveBtn.innerHTML = 'Save';
            saveBtn.addEventListener('click', ()=>{
                info.debug = document.getElementById('debugCheck').checked;
                localStorage['noCarScriptData'] = JSON.stringify(info);
                msg.innerText = "Saved. Please refresh site.";
            });

            let msg = document.createElement('span');
            msg.style.cssText = "margin-left: 2em; font-size: 0.7em; color: grey;";

            let closeBtn = document.createElement('div');
            closeBtn.style = 'position:absolute; right: 10px; top:10px; cursor: pointer;';
            closeBtn.innerText = 'X';
            closeBtn.addEventListener('click', this.close.bind(this));

            table.appendChild(header);
            table.appendChild(tr4);
            body.appendChild(table);
            body.appendChild(saveBtn);
            body.appendChild(msg);
            body.appendChild(closeBtn);
            document.body.appendChild(body);
            
            let inputs = body.querySelectorAll('input');
            inputs.forEach(el => el.addEventListener('mousedown', e => e.stopPropagation()));
            
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
