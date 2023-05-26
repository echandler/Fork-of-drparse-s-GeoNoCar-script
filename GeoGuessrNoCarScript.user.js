// ==UserScript==
// @name         Fork of drparse's excellent GeoNoCar script v5.0
// @description  Improvements to classic GeoNoCar script by drparse.
// @namespace    https://www.geoguessr.com/
// @version      5.0
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
        let globalGL = null;
        let webGLPrograms = [];

        let info = localStorage['noCarScriptData'];
        info = info? JSON.parse(info): { debug: false, x: 100, y: 100};


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

        attribute vec3 coordinates;//testing

        varying float v_time;
        uniform float u_time;

        attribute vec2 d;
        uniform mat4 e;

        void main(){
            vec4 g=vec4(c,1);
            gl_Position=e * g;

            a = vec3(d.xy * b.xy + b.zw,1);
            a *= length(c);

            v_time =  u_time;

            blob = vec3(d.xy,1.0);
        }
    `;

        const fragNew = `
        precision highp float;

        varying vec3 a;
        varying vec3 blob;
        vec3 spinBlob;
        // vec2 xy = gl_FragCoord.xy;

        varying float v_time;
        uniform float u_random;
        uniform float u_y;
        uniform float u_tinyPlanetEffect;
        uniform float u_tinyPlanetEffectSize;
        uniform float u_onlyPanorama;
        uniform float u_onlyLogoCircle;
        uniform float u_onlyLogoSize;
        uniform float u_showLogo;
        uniform float u_showLogoOverall;
        uniform float u_showFancy;
        uniform float u_scriptDisabled;
        uniform float u_bugger;
        uniform float u_doRotate;
        uniform float u_doRotateClockwise;
        uniform float u_doRotateSpeed;
        uniform float u_mixRatio;
        uniform sampler2D sampler2d_logoImg;
        uniform sampler2D sampler2d_mask;

        uniform float f; // sv_alpha can't change uniform name.
        uniform sampler2D sv_imageTexure; // Can change sampler2D uniform name.

        float dist(vec2 p0, vec2 pf){
            // https://www.shadertoy.com/view/4tjSW
            return sqrt((pf.x-p0.x)*(pf.x-p0.x)+(pf.y-p0.y)*(pf.y-p0.y));
        }

        float modd(float a, float b){
            return a - (b * floor(a/b));
        }

        vec4 expandingRing(vec4 texture){
//            float t = 1.0-((modd((v_time * 0.03) , 360.0))/360.0);
//
//            if (blob.y > t && blob.y <= t+0.1 ) {
//               // ring expanding out
//
//               if (blob.y < t + 0.05){
//
//                   texture = vec4(0.0, 87.0/255.0, 183.0/ 255.0, texture.a);
//
//               } else {
//
//                   texture = vec4(1.0,221.0/255.0, 0.0, texture.a);
//
//               }
//            }

            return texture;
        }

        vec3 pixelate() {

           float z = (sin(v_time * 0.0007) + 1.0)/2.0;

            float scaling = 5.0 * z + 3.0;

            vec3 texCoord = a/a.z; //(a.rgb * scaling) / scaling;

            texCoord.x = float(int(texCoord.x * scaling)) / scaling;
            texCoord.y = float(int(texCoord.y * scaling)) / scaling;

            vec3 t = texture2DProj(sv_imageTexure, texCoord).rgb;

            return vec3(t[0] * tan(z), t[2] * sin(z), t[1] * cos(z)); // vec3(t[0] + z, t[1] + z, t[2] + z);
        }

        vec3 noMask(vec3 sv_proj){
            if (u_bugger == 1.0){

                return sv_proj * 0.7;

            }

            vec4 logo = texture2DProj(sampler2d_logoImg, spinBlob.xyz).rgba;

            //logo = expandingRing(logo);

            if (logo.a < 1.0){
                 logo = mix(vec4(sv_proj.rgb, 0), logo, logo.a);
            }

            return mix(sv_proj, logo.rgb, u_mixRatio);
        }

        vec3 defaultFunc(vec3 sv_proj){
            if (u_bugger == 1.0){

                return sv_proj * 0.7;

            }

            if (u_showFancy == 1.0){

                return pixelate();

            }

            if (u_showLogoOverall == 1.0){

               return noMask(sv_proj);

            }

            return vec3(0.5, 0.5, 0.5);
        }

        vec3 useMask(vec3 sv_proj){
            vec4 mask = texture2DProj(sampler2d_mask, blob.xyz).rgba;

            vec4 logo = texture2DProj(sampler2d_logoImg, spinBlob.xyz).rgba;

            logo = expandingRing(logo);

            if (logo.a < 1.0){
                logo = mix(vec4(sv_proj, 0.0), logo, logo.a);
            }

            if (mask.a < 1.0){
                logo = mix(vec4(sv_proj, 0.0), logo, mask.a);
            }

            return mix(sv_proj, logo.rgb, u_mixRatio);
        }

        void tinyPlanetEffect(){
            // Playing with the y value makes some cool effects.
            float y = spinBlob.y;
            float size = -u_tinyPlanetEffectSize;
            if (y + size > 1.0){
                y = 1.0 - y + size;
            } else {
                y = y + size;
            }

            spinBlob.y = y;
        }

        void updateRotation(){
            spinBlob = blob;

            if (u_doRotate == 1.0){

                float t = ((modd((v_time * u_doRotateSpeed) , 360.0))/360.0);

                t = u_doRotateClockwise == 1.0? t: 1.0-t;

                if (blob.x > t){

                    spinBlob = vec3(blob.x - t, blob.y, blob.z);

                } else if (blob.x < t){

                    spinBlob = vec3(1.0 - t + blob.x, blob.y, blob.z);

                }
            }
        }

        void main(){
            // Unfortunately blobSize was here when the below calculations were made and they
            // will have to be redone to remove blobSize. Maybe in the future sometime....

            updateRotation();

            if (u_tinyPlanetEffect == 1.0){
                tinyPlanetEffect();
            }

            float blobSize = 0.85;
            float thetaY = blob.y * blobSize;
            float thetaX = blob.x * blobSize;

            float z = sin(v_time);
            float zz = cos(v_time);

            vec3 sv_proj = texture2DProj(sv_imageTexure,a / a[2]).rgb;

            float ty = 0.018; // Made up variable name.
            float aa = 0.469; // Made up variable name.

            float middle = 0.425; // Goes from 0.0 to 0.85 instead of 0.0 to 1.0 for some reason.

            vec4 i = vec4(0.0);

            if (u_scriptDisabled == 1.0){

                i = vec4(sv_proj, f);

            } else if (u_onlyPanorama == 1.0){
               //i = vec4(noMask(sv_proj), f);

               i = vec4(useMask(sv_proj), f);

            } else if (u_onlyLogoCircle == 1.0){

               i = vec4( thetaY > (u_onlyLogoSize/21.3) && (thetaY < 21.3) && thetaX > -0.1 && thetaX < 1.0? noMask(sv_proj): sv_proj, f);

            } else {
             i = vec4(

                // Middle is 0.425


                thetaY > 0.453 && thetaY < 0.49 && thetaX > 0.028 && thetaX < 0.045? defaultFunc(sv_proj): // rear Snorkle
                thetaY > 0.453 && thetaY < 0.49 && thetaX > 0.453 && thetaX < 0.47? defaultFunc(sv_proj): // Snorkle


                thetaY > 0.464 && thetaY < (aa + ty * 0.4) && thetaX > (0.375-middle)+0.85 && thetaX < 0.851? defaultFunc(sv_proj):  // Left side of origin.
                thetaY > 0.464 && thetaY < (aa + ty * 0.4) && thetaX > -0.1 && thetaX < (0.479-middle)? defaultFunc(sv_proj):        // Right side of origin.
                thetaY > 0.464 && thetaY < (aa + ty * 0.4) && thetaX > 0.375 && thetaX < 0.479? defaultFunc(sv_proj):

                thetaY > (aa + (ty *0.4)) && thetaY < (aa + ty) && thetaX > (0.368-middle)+0.85 && thetaX < 0.851? defaultFunc(sv_proj):    // Left side of origin.
                thetaY > (aa + (ty *0.4)) && thetaY < (aa + ty) && thetaX > -0.1 && thetaX < (0.485-middle)? defaultFunc(sv_proj):          // Right side of origin.
                thetaY > (aa + (ty *0.4)) && thetaY < (aa + ty) && thetaX > 0.368 && thetaX < 0.485? defaultFunc(sv_proj):

                thetaY > (aa + (ty*1.0)) && (thetaY < aa + (ty*2.0)) && thetaX > (0.349-middle)+0.85 && thetaX < 0.851? defaultFunc(sv_proj):
                thetaY > (aa + (ty*1.0)) && (thetaY < aa + (ty*2.0)) && thetaX > -0.1 && thetaX < (0.499-middle)? defaultFunc(sv_proj):
                thetaY > (aa + (ty*1.0)) && (thetaY < aa + (ty*2.0)) && thetaX > 0.349 && thetaX < 0.499? defaultFunc(sv_proj):

                thetaY > (aa + (ty*2.0)) && (thetaY < aa + (ty*3.0)) && thetaX > (0.330-middle)+0.85 && thetaX < 0.851? defaultFunc(sv_proj):
                thetaY > (aa + (ty*2.0)) && (thetaY < aa + (ty*3.0)) && thetaX > -0.1 && thetaX < (0.519-middle)? defaultFunc(sv_proj):
                thetaY > (aa + (ty*2.0)) && (thetaY < aa + (ty*3.0)) && thetaX > 0.330 && thetaX < 0.519? defaultFunc(sv_proj):

                thetaY > (aa + (ty*3.0)) && (thetaY < aa + (ty*4.0))&& thetaX > (0.319-middle)+0.85 && thetaX < 0.851? defaultFunc(sv_proj):
                thetaY > (aa + (ty*3.0)) && (thetaY < aa + (ty*4.0))&& thetaX > -0.1 && thetaX < (0.533-middle)? defaultFunc(sv_proj):
                thetaY > (aa + (ty*3.0)) && (thetaY < aa + (ty*4.0))&& thetaX > 0.319 && thetaX < 0.533? defaultFunc(sv_proj):

                thetaY > (aa + (ty*4.0)) && (thetaY < aa + (ty*5.0)) && thetaX > (0.313-middle)+0.85 && thetaX < 0.851? defaultFunc(sv_proj):
                thetaY > (aa + (ty*4.0)) && (thetaY < aa + (ty*5.0)) && thetaX > -0.1 && thetaX < (0.537-middle)? defaultFunc(sv_proj):
                thetaY > (aa + (ty*4.0)) && (thetaY < aa + (ty*5.0)) && thetaX > 0.313 && thetaX < 0.537? defaultFunc(sv_proj):

                thetaY > (aa + (ty*5.0)) && (thetaY < aa + (ty*6.0)) && thetaX > (0.304-middle)+0.85 && thetaX < 0.851? defaultFunc(sv_proj):
                thetaY > (aa + (ty*5.0)) && (thetaY < aa + (ty*6.0)) && thetaX > -0.1 && thetaX < (0.543-middle)? defaultFunc(sv_proj):
                thetaY > (aa + (ty*5.0)) && (thetaY < aa + (ty*6.0)) && thetaX > 0.304 && thetaX < 0.543? defaultFunc(sv_proj):

                thetaY > (aa + (ty*6.0)) && (thetaY < aa + (ty*7.0)) && thetaX > (0.299-middle)+0.85 && thetaX < 0.851? defaultFunc(sv_proj):
                thetaY > (aa + (ty*6.0)) && (thetaY < aa + (ty*7.0)) && thetaX > -0.1 && thetaX < (0.549-middle)? defaultFunc(sv_proj):
                thetaY > (aa + (ty*6.0)) && (thetaY < aa + (ty*7.0)) && thetaX > 0.299 && thetaX < 0.549? defaultFunc(sv_proj):

                thetaY > (aa + (ty*7.0)) && (thetaY < aa + (ty*8.0)) && thetaX > (0.294-middle)+0.85 && thetaX < 0.851? defaultFunc(sv_proj):
                thetaY > (aa + (ty*7.0)) && (thetaY < aa + (ty*8.0)) && thetaX > -0.1 && thetaX < (0.559-middle)? defaultFunc(sv_proj):
                thetaY > (aa + (ty*7.0)) && (thetaY < aa + (ty*8.0)) && thetaX > 0.294 && thetaX < 0.559? defaultFunc(sv_proj):

                thetaY > (aa + (ty*8.0)) && (thetaY < aa + (ty*8.5)) && thetaX > (0.28-middle)+0.85 && thetaX < 0.851 ? defaultFunc(sv_proj):
                thetaY > (aa + (ty*8.0)) && (thetaY < aa + (ty*8.5)) && thetaX > -0.1 && thetaX < (0.563-middle) ? defaultFunc(sv_proj):
                thetaY > (aa + (ty*8.0)) && (thetaY < aa + (ty*8.5)) && thetaX > 0.28 && thetaX < 0.563 ? defaultFunc(sv_proj):

                thetaY > (aa + (ty*8.4)) && (thetaY < aa + (ty*11.35)) && thetaX > -0.1 && thetaX < 1.0? defaultFunc(sv_proj):

                thetaY > (aa + (ty*11.35)) && (thetaY < aa + (ty*21.3)) && thetaX > -0.1 && thetaX < 1.0? (u_showLogo == 1.0? noMask(sv_proj): defaultFunc(sv_proj)) :

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

                let body = document.createElement('div');
                body.style.cssText = `position: absolute; top: ${info.y}px; left: ${info.x}px; background: white;padding: 10px; border-radius: 10px;
                                      border: 1px solid grey;z-index: 100000; min-width:12em; overflow-y:scroll; max-height: 60vh;`;

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

                    let reader = new FileReader();
                    reader.onloadend = function() {
                        let text = reader.result;
                        data = text;
                    }
                    reader.readAsDataURL(files[0]);

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

                let trDoRotate = document.createElement('tr');
                trDoRotate.innerHTML = `
                <td></td>
                <td colspan='2'><label><input id='doRotate' type='checkbox' ${(info.doRotate === true?"checked":"")}><span>Make it spin</span></label>
                <label><input id='doRotateClockwise' type='checkbox' ${(info.doRotateClockwise === true?"checked":"")}><span>Clockwise</span></label>
                <span>Speed</span><input id='doRotateSpeed' type='text' size="5" value="${info.doRotateSpeed || 0.003}"></td>
                `;

                let trTinyPlanetEffect = document.createElement('tr');

                trTinyPlanetEffect.innerHTML = `
                <td></td>
                <td colspan='2'><label><input id='tinyPlanetCheck' type='checkbox' ${(info.tinyPlanetEffect === true?"checked":"")}><span>Tiny planet effect</span></label>
                <span>Size</span><input id='tinyPlanetSize' type='text' size="5" value="${info.tinyPlanetEffectSize || 0.45}"></td>
                `;

                let trShowOnlyPanorama = document.createElement('tr');
                trShowOnlyPanorama.innerHTML = `
                <td></td>
                <td><label><input id='showOnlyPanoramaCheck' type='checkbox' ${(info.showOnlyPanorama?"checked":"")}><span title="Overrides streetview">Only show panorama</span></label></td>
                `;

                let trShowLogoOnly = document.createElement('tr');
                trShowLogoOnly.innerHTML = `
                <td></td>
                <td colspan='2'><label><input id='showLogoOnlyCheck' type='checkbox' ${(info.showLogoOnly?"checked":"")}><span title="Overrides everthing!">Confine panorama in circle</span></label>
                <input style="padding:0px;" id="showLogoOnlySize" type="range" min="-19" max="-0" step="0.1" value="${-(info.showLogoOnlySize != undefined? info.showLogoOnlySize: 15)}" class="slider"></td>
                `;

                setTimeout(function(){
                    document.getElementById('showLogoOnlySize').addEventListener('change', function(e){
                        info.showLogoOnlySize =Math.abs(this.value);
                        updateAllShaders(info);
                    });
                }, 100);

                let trMixRatio = document.createElement('tr');
                trMixRatio.innerHTML = `
                <td></td>
                <td><span style="margin-left:4px;" >Color mix ratio</span></td>
                <td><input style="padding:0px;" id="mixRatio" type="range" min="0.1" max="1.0" step="0.05" value="${info.mixRatio || 1.0}" class="slider"></td>
                `;

                setTimeout(function(){
                    document.getElementById('mixRatio').addEventListener('change', function(e){
                        info.mixRatio =document.getElementById('mixRatio').value;
                        updateAllShaders(info);
                    });
                }, 100);

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

                let trMaskMode = document.createElement('tr');
                trMaskMode.innerHTML = `
                <td></td>
                <td><label><input id='maskMode' type='checkbox' ><span>Upload file as a mask</span></label></td>
                `;


                let trDeleteMask = document.createElement('tr');
                trDeleteMask.innerHTML = `
                <td></td>
                <td colspan='2'><button id='deleteMask' type='checkbox' ><span>Delete mask</span></button>
                <button id='deletePanoImage' type='checkbox' ><span>Delete pano image</span></button></td>
                `;

                setTimeout(function(){
                    document.getElementById('deleteMask').addEventListener('click', function(e){
                        if(!confirm('Delete the panorama image from database?')) return;
                        doTheDelete(2);
                    });

                    document.getElementById('deletePanoImage').addEventListener('click',function(e){
                        if(!confirm('Delete the mask image from database?')) return;
                        doTheDelete(1);
                    });

                    function doTheDelete(id){
                        db('put', id, "");// Delete mask from database.
                        const texture = globalGL.createTexture();
                        globalGL.activeTexture(globalGL["TEXTURE"+id]);
                        globalGL.bindTexture(globalGL.TEXTURE_2D, texture);
                        globalGL.activeTexture(globalGL.TEXTURE0);
                    }
                }, 100);

                let trLogoInfoBase64 = document.createElement('tr');
                trLogoInfoBase64.innerHTML = `
                <td></td>
                <td><button id = 'logoInfoBtn' title ="Example: data:image/png;base64,iVBORw0KGgoAAAANS....\n">Paste Base64 Image</button></td>
                `;

                let data = null; 

                setTimeout(()=>{
                    let logoInfoBtn = document.getElementById('logoInfoBtn');
                    logoInfoBtn.addEventListener('click', async ()=>{
                        let input = document.getElementById('logoInfoInput');
                        let text = await navigator.clipboard.readText();

                        if (!/^data:image/.test(text)){
                           alert('Not data url.\n\nFormat example: "data:image/png;base64,iVBORw0KGgoAAAANS.... "');
                           return;
                        }

                        data = text;
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

                        let reader = new FileReader();
                        reader.onloadend = function() {
                            let text = reader.result;
                            data = text;
                        }
                        reader.readAsDataURL(this.files[0]);
                    });

                }, 100);

                let saveBtn = document.createElement('button');
                saveBtn.innerHTML = 'Save';
                saveBtn.addEventListener('click', async ()=>{

                    info.scriptDisabled = document.getElementById('disableScriptCheck').checked;
                    info.debug = document.getElementById('debugCheck').checked;
                    info.tinyPlanetEffect = document.getElementById('tinyPlanetCheck').checked;
                    info.tinyPlanetEffectSize = document.getElementById('tinyPlanetSize').value;
                    info.doRotate = document.getElementById('doRotate').checked;
                    info.doRotateClockwise = document.getElementById('doRotateClockwise').checked;
                    info.doRotateSpeed = document.getElementById('doRotateSpeed').value;
                    info.showOnlyPanorama =document.getElementById('showOnlyPanoramaCheck').checked;
                    info.showLogoOnly =document.getElementById('showLogoOnlyCheck').checked;
                    info.showLogoOnlySize =Math.abs(document.getElementById('showLogoOnlySize').value);
                    info.mixRatio =document.getElementById('mixRatio').value;
                    info.showLogo =document.getElementById('showLogoCheck').checked;
                    info.showLogoOverall =document.getElementById('showLogoOverallCheck').checked;
                    info.showFancy =document.getElementById('showFancyCheck').checked;

                    if (data){
                        let maskMode = document.getElementById('maskMode').checked;
                        if (maskMode){
                            loadImg(data, true);
                            db('put', 2, data);
                        } else {
                            loadImg(data);
                            db('put', 1, data);
                        }
                        data = null;
                        document.getElementById('logoInfoFile').value = '';
                    }

                    localStorage['noCarScriptData'] = JSON.stringify(info);

                    msg.innerText = "Saved....";

                    updateAllShaders(info);

                    setTimeout(triggerRefresh, 40);
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
                table.appendChild(trTinyPlanetEffect);
                table.appendChild(trDoRotate);
                table.appendChild(trShowOnlyPanorama);
                table.appendChild(trShowLogoOnly);
                table.appendChild(trMixRatio)
                table.appendChild(trShowLogo);
                table.appendChild(trShowLogoOverall);
                table.appendChild(trShowFancy);
                table.appendChild(trDeleteMask);
                table.appendChild(trMaskMode);
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

                    if (glsl === vertexOld  /*|| glsl === vOld*/) {

                        glsl = vertexNew;

                        globalGL = ctx;

                        let oldCtx = ctx.linkProgram;
                        ctx.linkProgram = function(...args){
                            let p = oldCtx.call(this, args[0]);

                            initWebGl(args[0]);

                            return p;
                        }

                    } else if (glsl === fragOld /* || glsl === fOld*/) {

                        glsl = fragNew;

                    }
                    let t = g.call(this, arguments[0], glsl);


                    return t; //g.call(this, arguments[0], glsl);
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

        async function initWebGl(program){
            webGLPrograms.push(program);

            const onlyPanorama = info.showOnlyPanorama;
            if (onlyPanorama){
                info.showOnlyPanorama = false;
            }
            // Init shader variables
            updateAllShaders(info);

            let mask = await db('get', 2);
            if (mask.result){
                loadImg(mask.result.datauri, true, fn);
            }

            let image = await db('get', 1);
            if (image.result){
                loadImg(image.result.datauri, false, fn);
            }

            function fn(){
                if (onlyPanorama && (info.showOnlyPanorama !== onlyPanorama)){
                    info.showOnlyPanorama = onlyPanorama;

                    let p = setInterval(()=> {
                        updateAllShaders(info);
                        let val = getUniformValue("u_onlyPanorama");
                        if (val == 1.0){
                            clearInterval(p);
                        }
                    }, 10);
                }
            }

            // Init shader variables
            let el = document.querySelector('[aria-label="Street View"]');
            let ddd = Date.now();
            let gl = globalGL;

            // Force an initial event to cause render.
            // Mouseout doesn't seem to work to cause initial render.
            let event;
            triggerEvent(el, "mouseup", event);

            let last = 0;

            setInterval(function(){
                // Makeshift render loop.

                let u_time = gl.getUniformLocation(program, 'u_time');

                if (!u_time) return;

                let dif = Date.now() - ddd;

                gl.uniform1f(u_time, dif);

                // TODO: Is this still needed?
                let sin = Math.sin(dif * 0.00015);
                let u_y = gl.getUniformLocation(program, 'u_y');
                let tsin = (sin +1) / 2;

                gl.uniform1f(u_y, sin+1 < last? 1.0-tsin: tsin);

                last = sin+1;

                gl.flush(); // Not sure if necessary.

                // Hack to trigger gmaps to refresh streetview.
                triggerEvent(el, "mouseout", event);
            }, 24);
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

        function loadImg(data, maskBool, callback){
            // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
            const gl = globalGL;

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
                //gl.activeTexture(gl.TEXTURE1);
                gl.activeTexture(maskBool? gl.TEXTURE2: gl.TEXTURE1);

               // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

                // Bind the texture to texture unit 1
                gl.bindTexture(gl.TEXTURE_2D, texture );

                gl.activeTexture(gl.TEXTURE0);

                callback();
            };

            image.src = data;

            function isPowerOf2(value) {
                // Might not be necessary
                return (value & (value - 1)) === 0;
            }
        }

        async function db(type, id, data){
            return new Promise(function(res, reg){
                var request = indexedDB.open('images', 1);
                request.onupgradeneeded = async function(){
                    let db = request.result;
                    let store = db.createObjectStore("images", {keyPath:"id"});
                    store.createIndex("getData", ["datauri"], {unique: false});
                }

                request.onsuccess = async function(){
                    const db = request.result;
                    const transact = db.transaction("images", "readwrite");
                    const store = transact.objectStore("images");

                    if (type == "get"){
                        let getIt = store.get(+id);
                        getIt.onsuccess = function(){
                            res(getIt);

                        db.close();
                        }
                        getIt.onerror = function(){
                            res(getIt);
                        db.close();
                        }
                      //  res(store.get(id));

                        return;
                    }

                    if (type == 'put'){
                        store.put({id: id, datauri:data})
                        res();
                        db.close();
                        return;
                    }
                    if (type == 'add'){
                        store.add({id: id, datauri: data});
                        db.close();
                    }
                }

                request.onerror = function(){
                    db.close();
                }

            });
        }

        function updateAllShaders(info){
            updateShader('u_scriptDisabled',info.scriptDisabled === true? 1.0 : 0.0);
            updateShader('u_bugger',info.debug === true? 1.0 : 0.0);
            updateShader('u_tinyPlanetEffect',info.tinyPlanetEffect === true? 1.0 : 0.0);
            updateShader('u_tinyPlanetEffectSize',info.tinyPlanetEffectSize || 0.45);
            updateShader('u_doRotate',info.doRotate === true? 1.0 : 0.0);
            updateShader('u_doRotateClockwise',info.doRotateClockwise === true? 1.0 : 0.0);
            updateShader('u_doRotateSpeed',info.doRotateSpeed || 0.003);
            updateShader('sampler2d_logoImg', 1.0, true);
            updateShader('sampler2d_mask', 2.0, true);
            updateShader('u_onlyLogoCircle',info.showLogoOnly === true? 1.0 : 0.0);
            updateShader('u_onlyPanorama',info.showOnlyPanorama === true? 1.0 : 0.0);
            updateShader('u_onlyLogoSize',info.showLogoOnlySize != undefined ? info.showLogoOnlySize: 15.0);
            updateShader('u_mixRatio',info.mixRatio || 1.0);
            updateShader('u_showLogo',info.showLogo === true? 1.0 : 0.0);
            updateShader('u_showLogoOverall',info.showLogoOverall === true? 1.0 : 0.0);
            updateShader('u_showFancy',info.showFancy === undefined || info.showFancy === true? 1.0 : 0.0);
        }

        function updateShader(uniform, val, i){
            if (!globalGL || webGLPrograms.length == 0) return;

            for (let n = 0; n < webGLPrograms.length; n++){
                let location = globalGL.getUniformLocation(webGLPrograms[n], uniform);

                if (!location) continue;

                if (i){
                    // Integer value
                    globalGL.uniform1i(location, val);
                } else {
                    // Float value
                    globalGL.uniform1f(location, val);
                }

                globalGL.flush();
                break;
            }
        }

        function getUniformValue(uniform){
            if (!globalGL || webGLPrograms.length == 0) return;

            for (let n = 0; n < webGLPrograms.length; n++){
                let location = globalGL.getUniformLocation(webGLPrograms[n], uniform);

                if (!location) continue;

                return globalGL.getUniform(webGLPrograms[n], location);
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
