// ==UserScript==
// @name         Fork of drparse's excellent GeoNoCar script v4.0
// @description  Improvements to classic GeoNoCar script by drparse.
// @namespace    https://www.geoguessr.com/
// @version      4.0
// @author       echandler (original author is drparses)
// @match        https://www.geoguessr.com/*
// @grant        unsafeWindow
// @run-at       document-start
// @copyright    2020, drparse, echandler
// @updateURL    https://github.com/echandler/Fork-of-drparse-s-GeoNoCar-script/raw/main/GeoGuessrNoCarScript.user.js
// @license      GPL-3.0-or-later; http://www.gnu.org/licenses/gpl-3.0.txt
// @noframes
// ==/UserScript==

(function() {
    'use strict';
    function injected() {
        let globalGL = null;
        let webGLPrograms = [];

        let info = localStorage['noCarScriptData'];
        info = info? JSON.parse(info): { Theta:  0.85, Omega: 0.53, Phi: 0.10, debug: false, x: 100, y: 100};

        const OPTIONS = {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            size: 0.85, //+info.Theta,
            debug: info.debug === false? false: true,
            showLogoOnly: info.showLogoOnly === false? false: true,
            showLogoOnly: info.showLogoOnly === false? false: true,
            showFancy: info.showFancy !== undefined || info.showFancy === false? false: true,
            disableScript: info.disableScript !== undefined || info.disableScript === false? false: true,
        };

        // If the script breaks, search devtools for "BINTULU" and replace these lines with the new one
        const vertexOld = "const float f=3.1415926;varying vec3 a;uniform vec4 b;attribute vec3 c;attribute vec2 d;uniform mat4 e;void main(){vec4 g=vec4(c,1);gl_Position=e*g;a=vec3(d.xy*b.xy+b.zw,1);a*=length(c);}";
        const fragOld = "precision highp float;const float h=3.1415926;varying vec3 a;uniform vec4 b;uniform float f;uniform sampler2D g;void main(){vec4 i=vec4(texture2DProj(g,a).rgb,f);gl_FragColor=i;}";
        const vOld = `varying vec4 a;uniform mat4 matrixClipFromModel;uniform vec4 color;attribute vec3 vert;void main(){a=color;gl_Position=matrixClipFromModel*vec4(vert,1);}`;
        const fOld = `precision highp float;varying vec4 a;void main(){gl_FragColor=a;}`;


        const vertexNew = `

        const float f=3.1415926;
        varying vec3 a;
        varying vec3 blob;
        uniform vec4 b;
        attribute vec3 c;

        varying float v_testvv;
        uniform float u_testv;

        attribute vec2 d;
        uniform mat4 e;

     //   float angleInRadians = 2.1;
     //   float cc = cos(angleInRadians);
     //   float s = sin(angleInRadians);

     //   mat4 xRotation = mat4(1.0, 0.0, 0.0, 0.0,  0.0, cc, s, 0.0,  0.0, -s, cc, 0.0,  0.0, 0.0, 0.0, 1.0);

        void main(){
            //float w = sin(u_testv);
           // c[2] =  0.001;
           // vec3 cc = vec3(c[0] + w, c[1], c[2]);

            vec4 g=vec4(c,1);
            gl_Position=e * g;

            vec2 dd = d.xy;

//            dd.x += 0.01;

            a = vec3(dd.xy * b.xy + b.zw,1);
            a *= length(c);

            v_testvv =  u_testv;

            blob = vec3(d.xy,1.0);
        }
    `;

        const fragNew = `
        precision highp float;

        varying vec3 a;
        varying vec3 blob;

        //    vec2 xy = gl_FragCoord.xy;

        varying float v_testvv;
        uniform float u_random;
        uniform float u_onlyPanorama;
        uniform float u_onlyLogoCircle;
        uniform float u_onlyLogoSize;
        uniform float u_showLogo;
        uniform float u_showLogoOverall;
        uniform float u_showFancy;
        uniform float u_scriptDisabled;
        uniform float u_bugger;
        uniform float u_mixRatio;
        uniform sampler2D sampler2d_logoImg;

        uniform float f; // sv_alpha can't change uniform name.
        uniform sampler2D sv_imageTexure; // Can change sampler2D uniform name.

        float dist(vec2 p0, vec2 pf){
            // https://www.shadertoy.com/view/4tjSW
            return sqrt((pf.x-p0.x)*(pf.x-p0.x)+(pf.y-p0.y)*(pf.y-p0.y));
        }

        vec3 pixelate() {
            float z = cos(sin(v_testvv));

            float scaling = 5.0 * z + 3.0;

            vec3 texCoord = a/a.z; //(a.rgb * scaling) / scaling;

            texCoord.x = float(int(texCoord.x * scaling)) / scaling;
            texCoord.y = float(int(texCoord.y * scaling)) / scaling;

            vec3 t = texture2DProj(sv_imageTexure, texCoord).rgb;

            return vec3(t[0] * tan(z), t[2] * sin(z), t[1] * cos(z)); // vec3(t[0] + z, t[1] + z, t[2] + z);
        }

        vec3 fn1(vec3 sv_proj){
            if (u_bugger == 1.0){
              //  vec3 sv_proj = texture2DProj(sv_imageTexure,a).rgb;
                return sv_proj * 0.7;
            }

             vec4 proj1 =texture2DProj(sampler2d_logoImg, blob).rgba;

             if (proj1.a < 1.0){
             proj1 = mix(vec4(sv_proj.rgb, 0), proj1, proj1.a);

            }
             return mix(sv_proj, proj1.rgb, u_mixRatio);
        }

        vec3 fn(vec3 sv_proj){
            if (u_bugger == 1.0){
              //  vec3 sv_proj = texture2DProj(sv_imageTexure,a).rgb;
                return sv_proj * 0.7;
            }

            if (u_showFancy == 1.0){
                return pixelate();
            }

            if (u_showLogoOverall == 1.0){

              //  vec3 sv_proj = texture2DProj(sv_imageTexure,a).rgb;
               return fn1(sv_proj);
            }

            return vec3(0.5, 0.5, 0.5);
        }

        void main(){
            // Unfortunately blobSize was here when the below calculations were made and they
            // will have to be redone to remove blobSize. Maybe in the future sometime....
            float blobSize = 0.85;
            float thetaY = blob.y * blobSize; //u_testv;
            float thetaX = blob.x * blobSize;


            float z = sin(v_testvv);
            float zz = cos(v_testvv);
            vec3 sv_proj = texture2DProj(sv_imageTexure,a / a[2]).rgb;
            //vec3 proj = vec3(proj1[0] * z, proj1[1] * zz, proj1[2]);
            //vec3 proj = pixelate();

            float ty = 0.018; // Made up variable name.
            float aa = 0.469; // Made up variable name.

            float middle = 0.425; // Goes from 0.0 to 0.85 instead of 0.0 to 1.0 for some reason.
            float offsety =  (0.001 * z);
            float offsetx =  (0.001 * cos(v_testvv));

            vec4 i = vec4(0.0);
            float tttt = 1.0;

            if (u_scriptDisabled == 1.0){

                i = vec4(sv_proj, f);

            } else if (u_onlyLogoCircle == 1.0){

               i = vec4( thetaY > (aa + (ty * u_onlyLogoSize)) && (thetaY < aa + (ty*21.3)) && thetaX > -0.1 && thetaX < 1.0? fn1(sv_proj): sv_proj, f);

            } else if (u_onlyPanorama == 1.0){

               i = vec4(fn1(sv_proj), f);

            } else {
             i = vec4(

                // Middle is 0.425


                thetaY > 0.453 && thetaY < 0.49 && thetaX > 0.028 && thetaX < 0.045? fn(sv_proj): // rear Snorkle
                thetaY > 0.453 && thetaY < 0.49 && thetaX > 0.453 && thetaX < 0.47? fn(sv_proj): // Snorkle


                thetaY > 0.464 && thetaY < (aa + ty * 0.4) && thetaX > (0.375-middle)+0.85 && thetaX < 0.851? fn(sv_proj):  // Left side of origin.
                thetaY > 0.464 && thetaY < (aa + ty * 0.4) && thetaX > -0.1 && thetaX < (0.479-middle)? fn(sv_proj):        // Right side of origin.
                thetaY > 0.464 && thetaY < (aa + ty * 0.4) && thetaX > 0.375 && thetaX < 0.479? fn(sv_proj):

                thetaY > (aa + (ty *0.4)) && thetaY < (aa + ty) && thetaX > (0.368-middle)+0.85 && thetaX < 0.851? fn(sv_proj):    // Left side of origin.
                thetaY > (aa + (ty *0.4)) && thetaY < (aa + ty) && thetaX > -0.1 && thetaX < (0.485-middle)? fn(sv_proj):          // Right side of origin.
                thetaY > (aa + (ty *0.4)) && thetaY < (aa + ty) && thetaX > 0.368 && thetaX < 0.485? fn(sv_proj):

                thetaY > (aa + (ty*1.0)) && (thetaY < aa + (ty*2.0)) && thetaX > (0.349-middle)+0.85 && thetaX < 0.851? fn(sv_proj):
                thetaY > (aa + (ty*1.0)) && (thetaY < aa + (ty*2.0)) && thetaX > -0.1 && thetaX < (0.499-middle)? fn(sv_proj):
                thetaY > (aa + (ty*1.0)) && (thetaY < aa + (ty*2.0)) && thetaX > 0.349 && thetaX < 0.499? fn(sv_proj):

                thetaY > (aa + (ty*2.0)) && (thetaY < aa + (ty*3.0)) && thetaX > (0.330-middle)+0.85 && thetaX < 0.851? fn(sv_proj):
                thetaY > (aa + (ty*2.0)) && (thetaY < aa + (ty*3.0)) && thetaX > -0.1 && thetaX < (0.519-middle)? fn(sv_proj):
                thetaY > (aa + (ty*2.0)) && (thetaY < aa + (ty*3.0)) && thetaX > 0.330 && thetaX < 0.519? fn(sv_proj):

                thetaY > (aa + (ty*3.0)) && (thetaY < aa + (ty*4.0))&& thetaX > (0.319-middle)+0.85 && thetaX < 0.851? fn(sv_proj):
                thetaY > (aa + (ty*3.0)) && (thetaY < aa + (ty*4.0))&& thetaX > -0.1 && thetaX < (0.533-middle)? fn(sv_proj):
                thetaY > (aa + (ty*3.0)) && (thetaY < aa + (ty*4.0))&& thetaX > 0.319 && thetaX < 0.533? fn(sv_proj):

                thetaY > (aa + (ty*4.0)) && (thetaY < aa + (ty*5.0)) && thetaX > (0.313-middle)+0.85 && thetaX < 0.851? fn(sv_proj):
                thetaY > (aa + (ty*4.0)) && (thetaY < aa + (ty*5.0)) && thetaX > -0.1 && thetaX < (0.537-middle)? fn(sv_proj):
                thetaY > (aa + (ty*4.0)) && (thetaY < aa + (ty*5.0)) && thetaX > 0.313 && thetaX < 0.537? fn(sv_proj):

                thetaY > (aa + (ty*5.0)) && (thetaY < aa + (ty*6.0)) && thetaX > (0.304-middle)+0.85 && thetaX < 0.851? fn(sv_proj):
                thetaY > (aa + (ty*5.0)) && (thetaY < aa + (ty*6.0)) && thetaX > -0.1 && thetaX < (0.543-middle)? fn(sv_proj):
                thetaY > (aa + (ty*5.0)) && (thetaY < aa + (ty*6.0)) && thetaX > 0.304 && thetaX < 0.543? fn(sv_proj):

                thetaY > (aa + (ty*6.0)) && (thetaY < aa + (ty*7.0)) && thetaX > (0.299-middle)+0.85 && thetaX < 0.851? fn(sv_proj):
                thetaY > (aa + (ty*6.0)) && (thetaY < aa + (ty*7.0)) && thetaX > -0.1 && thetaX < (0.549-middle)? fn(sv_proj):
                thetaY > (aa + (ty*6.0)) && (thetaY < aa + (ty*7.0)) && thetaX > 0.299 && thetaX < 0.549? fn(sv_proj):

                thetaY > (aa + (ty*7.0)) && (thetaY < aa + (ty*8.0)) && thetaX > (0.294-middle)+0.85 && thetaX < 0.851? fn(sv_proj):
                thetaY > (aa + (ty*7.0)) && (thetaY < aa + (ty*8.0)) && thetaX > -0.1 && thetaX < (0.559-middle)? fn(sv_proj):
                thetaY > (aa + (ty*7.0)) && (thetaY < aa + (ty*8.0)) && thetaX > 0.294 && thetaX < 0.559? fn(sv_proj):

                thetaY > (aa + (ty*8.0)) && (thetaY < aa + (ty*8.5)) && thetaX > (0.28-middle)+0.85 && thetaX < 0.851 ? fn(sv_proj):
                thetaY > (aa + (ty*8.0)) && (thetaY < aa + (ty*8.5)) && thetaX > -0.1 && thetaX < (0.563-middle) ? fn(sv_proj):
                thetaY > (aa + (ty*8.0)) && (thetaY < aa + (ty*8.5)) && thetaX > 0.28 && thetaX < 0.563 ? fn(sv_proj):

                thetaY > (aa + (ty*8.4)) && (thetaY < aa + (ty*11.35)) && thetaX > -0.1 && thetaX < 1.0? fn(sv_proj):

                thetaY > (aa + (ty*11.35)) && (thetaY < aa + (ty*21.3)) && thetaX > -0.1 && thetaX < 1.0? (u_showLogo == 1.0? fn1(sv_proj): fn(sv_proj)) :

                   sv_proj

                , f);
            }

            gl_FragColor=i;
        }
    `;

        let menu ={
            menuBody: null,
            opened: false,
            open: function(){
                this.opened = true;

                info.debug = info.debug === undefined? OPTIONS.debug: info.debug;
                info.x = info.x === undefined? 100: info.x;
                info.y = info.y === undefined? 100: info.y;

                let body = document.createElement('div');
                body.style.cssText = " position: absolute; top: "+info.y+"px; left: "+info.x+"px; background: white;padding: 10px; border-radius: 10px; border: 1px solid grey;z-index: 100000; min-width:12em";

                body.addEventListener('dragenter', function(e){
                    e.preventDefault(); // Needed because of Chrome bug.
                });

                body.addEventListener('dragover', function(e){
                    e.preventDefault();// Needed because of Chrome bug.
                });

                body.addEventListener('drop', function(e){
                    e.preventDefault();
                    e.stopPropagation();

                    let dt = e.dataTransfer;
                    let files = dt.files;

                    handleFileReader(files[0]);

                    msg.innerText =e.dataTransfer.files[0].name;
                },false);

                this.menuBody = body;

                let table = document.createElement('table');


                let header=document.createElement('tr');
                header.innerHTML = "<th></th><th>No Car Script Menu</th>";

                let trScriptDisabled = document.createElement('tr');
                trScriptDisabled.innerHTML = `
                <td></td>
                <td><label><input id='disableScriptCheck' type='checkbox' ${(info.scriptDisabled ? "checked" : "")}><span>Disable script</span></label></td>
                `;

                let trDebugMode = document.createElement('tr');
                trDebugMode.innerHTML = `
                <td></td>
                <td><label><input id='debugCheck' type='checkbox' ${(info.debug?"checked":"")}><span>Debug mode</span></label></td>
                `;

                let trShowOnlyPanorama = document.createElement('tr');
                trShowOnlyPanorama.innerHTML = `
                <td></td>
                <td><label><input id='showOnlyPanoramaCheck' type='checkbox' ${(info.showOnlyPanorama?"checked":"")}><span title="Overrides streetview">Only show panorama</span></label></td>
                `;

                let trShowLogoOnly = document.createElement('tr');
                trShowLogoOnly.innerHTML = `
                <td></td>
                <td><label><input id='showLogoOnlyCheck' type='checkbox' ${(info.showLogoOnly?"checked":"")}><span title="Overrides everthing!">Only show circle logo</span></label></td>
                `;

                let trShowLogoOnlySize = document.createElement('tr');
                trShowLogoOnlySize.innerHTML = `
                <td></td>
                <td><span style="margin-left:4px;" title="Overrides everthing!">Only show circle logo size</span></td>
                <td><input style="padding:0px;" id="showLogoOnlySize" type="range" min="-20" max="-5" value="${-(info.showLogoOnlySize) || -15}" class="slider"></td>
                `;

                let trMixRatio = document.createElement('tr');
                trMixRatio.innerHTML = `
                <td></td>
                <td><span style="margin-left:4px;" >Color mix ratio</span></td>
                <td><input style="padding:0px;" id="mixRatio" type="range" min="0.1" max="1.0" step="0.1" value="${info.mixRatio || 1.0}" class="slider"></td>
                `;

                let trShowLogo = document.createElement('tr');
                trShowLogo.innerHTML = `
                <td></td>
                <td><label><input id='showLogoCheck' type='checkbox' ${(info.showLogo?"checked":"")}><span>Show circle logo on blob</span></label></td>
                `;

                let trShowLogoOverall = document.createElement('tr');
                trShowLogoOverall.innerHTML = `
                <td></td>
                <td><label><input id='showLogoOverallCheck' type='checkbox' ${(info.showLogoOverall?"checked":"")}><span>Show logo on entire blob</span></label></td>
                `;

                let trShowFancy = document.createElement('tr');
                trShowFancy.innerHTML = `
                <td></td>
                <td><label><input id='showFancyCheck' type='checkbox' ${(info.showFancy === undefined || info.showFancy === true?"checked":"")}><span>Make blob fancy</span></label></td>
                `;

                let trLogoInfoBase64 = document.createElement('tr');
                trLogoInfoBase64.innerHTML = `
                <td></td>
                <td><button id = 'logoInfoBtn' title ="Example: data:image/png;base64,iVBORw0KGgoAAAANS....\n Image has to be less than 4.5 mb.">Paste Base64 Image</button></td>
                `;
                // <td><input id='logoInfoInput' type='text' size='15' placeholder="data:image/png;base64,iVBORw0KGgoAAAANS...." value="${info.logoInfo || ""}"></td>

                let data = info.logoInfo;

                setTimeout(()=>{
                    let logoInfoBtn = document.getElementById('logoInfoBtn');
                    logoInfoBtn.addEventListener('click', async ()=>{
                        let input = document.getElementById('logoInfoInput');
                        let text = await navigator.clipboard.readText();

                        if (!/^data:image/.test(text)){
                           alert('Not data url.\n\nFormat example: "data:image/png;base64,iVBORw0KGgoAAAANS.... "');
                           return;
                        }

                        if (handleFileSize(text)){
                           data = text;
                        } else {
                            let t = confirm("Pasted data appears to exceed the ~4.5mb limit. It won't be saved on the hard drive and will be lost on refresh. OK?");
                            if (t){
                                data = text;
                            }
                        }

                        msg.innerText = "Base64 data was read.";
                    });
                }, 100);

                let trLogoInfoFromFile = document.createElement('tr');
                trLogoInfoFromFile.innerHTML = `
                <td></td>
                <td><input type='file' id ='logoInfoFile' value="Upload Image" ></td>
                `;

                setTimeout(()=>{
                    let logoInfoBtn = document.getElementById('logoInfoFile');
                    logoInfoBtn.addEventListener('change', async function(e){
                        handleFileReader(this.files[0]);
                    });
                }, 100);

                let saveBtn = document.createElement('button');
                saveBtn.innerHTML = 'Save';
                saveBtn.addEventListener('click', ()=>{
                    info.scriptDisabled = document.getElementById('disableScriptCheck').checked;
                    info.debug = document.getElementById('debugCheck').checked;
                    info.showOnlyPanorama =document.getElementById('showOnlyPanoramaCheck').checked;
                    info.showLogoOnly =document.getElementById('showLogoOnlyCheck').checked;
                    info.showLogoOnlySize =Math.abs(document.getElementById('showLogoOnlySize').value);
                    info.mixRatio =document.getElementById('mixRatio').value;
                    info.showLogo =document.getElementById('showLogoCheck').checked;
                    info.showLogoOverall =document.getElementById('showLogoOverallCheck').checked;
                    info.showFancy =document.getElementById('showFancyCheck').checked;

                    let dataTooLargeForStorage = null;

                    if (fileIsCorrectSize(data)){
                        info.logoInfo = data; //document.getElementById('logoInfoInput').value;
                    } else {
                       dataTooLargeForStorage = true;
                    }

                    localStorage['noCarScriptData'] = JSON.stringify(info);
                    msg.innerText = "Saved....";

                    updateShader('u_scriptDisabled',info.scriptDisabled === true? 1.0 : 0.0);
                    updateShader('u_bugger',info.debug === true? 1.0 : 0.0);
                    updateShader('u_onlyPanorama',info.showOnlyPanorama === true? 1.0 : 0.0);
                    updateShader('u_onlyLogoCircle',info.showLogoOnly === true? 1.0 : 0.0);
                    updateShader('u_onlyLogoSize',info.showLogoOnlySize);
                    updateShader('u_mixRatio',info.mixRatio);
                    updateShader('u_showLogo',info.showLogo === true? 1.0 : 0.0);
                    updateShader('u_showLogoOverall',info.showLogoOverall === true? 1.0 : 0.0);
                    updateShader('u_showFancy',info.showFancy === true? 1.0 : 0.0);

                    loadImg(dataTooLargeForStorage? data: false);

                    setTimeout(triggerRefresh, 100);
                });

                let msg = document.createElement('span');
                msg.style.cssText = "margin-left: 2em; font-size: 0.7em; color: grey;";

                body.addEventListener('click', (e)=> {
                    if (e.target == saveBtn) return;
                    msg.innerText='';
                });

                let closeBtn = document.createElement('div');
                closeBtn.style = 'position:absolute; right: 10px; top:10px; cursor: pointer;';
                closeBtn.innerText = 'X';
                closeBtn.addEventListener('click', this.close.bind(this));

                table.appendChild(header);
                table.appendChild(trScriptDisabled);
                table.appendChild(trDebugMode);
                table.appendChild(trShowOnlyPanorama);
                table.appendChild(trShowLogoOnly);
                table.appendChild(trShowLogoOnlySize);
                table.appendChild(trMixRatio)
                table.appendChild(trShowLogo);
                table.appendChild(trShowLogoOverall);
                table.appendChild(trShowFancy);
                table.appendChild(trLogoInfoBase64);
                table.appendChild(trLogoInfoFromFile);

                body.appendChild(table);
                body.appendChild(saveBtn);
                body.appendChild(msg);
                body.appendChild(closeBtn);

                document.body.appendChild(body);

                let inputs = body.querySelectorAll('input');
                inputs.forEach(el => el.addEventListener('mousedown', e => e.stopPropagation()));

                body.addEventListener('mousedown', function(e){
                    //                console.log(e);
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

                function handleFileReader(file){
                    //var file = files[0];
                    var reader = new FileReader();
                    reader.onloadend = function() {
                        console.log('RESULT', reader)
                        let text = reader.result;
                        handleFileSize(text);
                    }
                    reader.readAsDataURL(file);
                }

                function handleFileSize(text){
                    if (fileIsCorrectSize(text)){
                        data = text;
                    } else {
                        let t = confirm("Pasted data appears to exceed the ~4.5mb limit. It won't be saved on the hard drive and will be lost on refresh. OK?");
                        if (t){
                            data = text;
                        }
                    }
                }

                function fileIsCorrectSize(text){
                    let sizeInBytes = new Blob([text]).size;
                    if (sizeInBytes / 1024 / 1024 < 4.5){
                        return true;
                    }
                    return false;
                }
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

                    if (glsl === vertexOld  /*|| glsl === vOld*/) glsl = vertexNew;
                    else if (glsl === fragOld /* || glsl === fOld*/) glsl = fragNew;
                    let t = g.call(this, arguments[0], glsl);


                    return t; //g.call(this, arguments[0], glsl);
                }
                return g.apply(this, arguments);
            }
            shaderSource.bestcity = 'bintulu';
            ctx.shaderSource = shaderSource;
        }
        let ttt = 0;

        function installGetContext(el) {
            const g = el.getContext;

            el.getContext = function() {
                if (arguments[0] === 'webgl' || arguments[0] === 'webgl2') {
                    const ctx = g.apply(this, arguments);

                    if (ctx && ctx.shaderSource && ctx.shaderSource.bestcity !== 'bintulu') {
                        installShaderSource(ctx);

                        globalGL = ctx;

                        let old = ctx.linkProgram;
                        ctx.linkProgram = function(...args){
                            let p = old.call(this, args[0]);

                            initWebGl(args[0]);

                            return p;

                        }
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

        function initWebGl(program){
            webGLPrograms.push(program);

            // Init shader variables
            updateShader('u_scriptDisabled',info.scriptDisabled === true? 1.0 : 0.0);
            updateShader('u_bugger',info.debug === true? 1.0 : 0.0);
            updateShader('sampler2d_logoImg', 1.0, true);
            updateShader('u_onlyLogoCircle',info.showLogoOnly === true? 1.0 : 0.0);
            updateShader('u_onlyPanorama',info.showOnlyPanorama === true? 1.0 : 0.0);
            updateShader('u_onlyLogoSize',info.showLogoOnlySize || 15.0);
            updateShader('u_mixRatio',info.mixRatio || 1.0);
            updateShader('u_showLogo',info.showLogo === true? 1.0 : 0.0);
            updateShader('u_showLogoOverall',info.showLogoOverall === true? 1.0 : 0.0);
            updateShader('u_showFancy',info.showFancy === undefined || info.showFancy === true? 1.0 : 0.0);

            loadImg();

            let el = document.querySelector('[aria-label="Street View"]');
            let ddd = 0.1;
            let gl = globalGL;

            setInterval(function(){
                // Makeshift render loop.

                if (info.showFancy !== undefined && !info.showFancy) return;

                let testUniform = gl.getUniformLocation(program, 'u_testv');

                if (!testUniform) return;

                gl.uniform1f(testUniform, ddd += 0.01);

                let randUniform = gl.getUniformLocation(program, 'u_random');
                gl.uniform1f(randUniform,Math.random());

                gl.flush(); // Not sure if necessary.

                // Hack to trigger gmaps to refresh streetview.
                let event;
                triggerEvent(el, "mouseout", event);
            }, 30);
        }

        function triggerRefresh(){
            let el = document.querySelector('[aria-label="Street View"]');
            let event;
            triggerEvent(el, "mouseout", event);
        }

        function triggerEvent( elem, type, event ) {
            // From stack overflow can't remember where.
            event = document.createEvent("MouseEvents");
            event.initMouseEvent(type, true, true, elem.ownerDocument.defaultView,
                                 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            elem.dispatchEvent( event );
        }

        function loadImg(data){
            // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
            let gl = globalGL;

            const level = 0;
            const internalFormat = gl.RGBA;
            const width = 1;
            const height = 1;
            const border = 0;
            const srcFormat = gl.RGBA;
            const srcType = gl.UNSIGNED_BYTE;
            const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue

            const image = new Image();

            image.onload = () => {
                const texture = gl.createTexture();

                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    level,
                    internalFormat,
                    srcFormat,
                    srcType,
                    image
                );

                // WebGL1 has different requirements for power of 2 images
                // vs. non power of 2 images so check if the image is a
                // power of 2 in both dimensions.
                if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                    // Yes, it's a power of 2. Generate mips.
                    gl.generateMipmap(gl.TEXTURE_2D);
                } else {
                    // No, it's not a power of 2. Turn off mips and set
                    // wrapping to clamp to edge
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                }
                // Tell WebGL we want to affect texture unit 1
                gl.activeTexture(gl.TEXTURE1);

               // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

                // Bind the texture to texture unit 1
                gl.bindTexture(gl.TEXTURE_2D, texture );

                gl.activeTexture(gl.TEXTURE0);
            };

            if (!info.logoInfo){

                gl.activeTexture(gl.TEXTURE1);

                gl.bindTexture(gl.TEXTURE_2D, null );

                gl.activeTexture(gl.TEXTURE0);

                return;
            }
            image.src = data || info.logoInfo;

            function isPowerOf2(value) {
                // Might not be necessary
                return (value & (value - 1)) === 0;
            }
        }

        function updateShader(uni, val, i){
            if (!globalGL || webGLPrograms.length == 0) return;

            for (let n = 0; n < webGLPrograms.length; n++){
                let testUniform = globalGL.getUniformLocation(webGLPrograms[n], uni);

                if (!testUniform) continue;

                if (i){
                    // Integer value
                    globalGL.uniform1i(testUniform, val);
                } else {
                    // Float value
                    globalGL.uniform1f(testUniform, val);
                }

                globalGL.flush();
                break;
            }
        }

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
