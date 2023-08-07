# Fork of drparse's GeoNoCar script
### Hide the camera car in GeoGuessr and add your own 360 panorama logo.

Press the escape (esc) key to open the menu.

[Click here to install](https://github.com/echandler/Fork-of-drparse-s-GeoNoCar-script/raw/main/GeoGuessrNoCarScript.user.js), if this doesn't work copy and paste the contents of the user.js file into a new tamper monkey script.

#### How to make a 360 panorama logo 
1) I'm not an expert at making these. I just followed the instructions on this website [link](https://360rumors.com/technique-fast-and-easy-way-to-add-logo/).
    - I downloaded the Hugin program. If you have access to Photoshop that would probably be better.
    - The instructions say to create a large image (I used my 1080p monitor's resolution) and make it transparent then put the logo in the center. Hugin doesn't seem to like transparent backgrounds, so I used a solid color instead to fix the jagged logo.
    - To follow the directions, you have to change the Hugin interface to "advanced".
    - In the "stitcher" tab, make sure to press the "Calculate optimal size" button (or not if it doesn't work for your logo).
    - I saved it as a .png and that seems to work well.
 2) I used this site to convert the image to base64 [link](https://base64.guru/converter/encode/image), but use what ever site works for you.
    - Make sure to change the "Output Format" to "Data URI -- data:content/type;base64". !!IMPORTANT!!
    - Copy the output to you clipboard.
 3) On Geoguessr, press the ESC key to open the menu and upload the image.
 4) Press "Save" and see if it worked. If it didn't, try try again lol.
 5) [Nadirpatch.com](https://nadirpatch.com/) is also a good resource, you can use one of the 360 panorama files in the images folder as the "Equirectangular projection" in a pinch, but you have to remove it with photoshop when your done.

### How to make a 360 panorama
1) Begin at step 2 above. I don't know much about 360 panoramas, just try it and see if it works.
2) Click the "Only show panorama" check box if you want to override the street view image (this feature is basically a toy).

[Original GeoNoCar script on openuserjs.org](https://openuserjs.org/scripts/drparse/GeoNoCar)

If you want to reinstall or delete the script, while on the geoguessr website, enter this command in the javascript console (cntrl-shift-j) to delete the saved data : ```delete localStorage.noCarScriptData```
