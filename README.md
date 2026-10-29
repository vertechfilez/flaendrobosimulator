# Flaend Simulator

A small browser-based 3D free-roam robot game for GitHub Pages.

## Upload to GitHub
1. Extract `Flaend-Simulator.zip`.
2. Upload the files and the `images` folder into the root of your GitHub repository.
3. In your repository, open **Settings → Pages**.
4. Choose **Deploy from a branch**, select your main branch and `/ (root)`, then save.
5. Open the Pages URL GitHub provides. The game needs an internet connection to load Three.js from its CDN.

## Loading screen image
Put your image in the `images` folder and name it exactly:

`loading-screen.png`

The image path used by the game is `images/loading-screen.png`. A PNG with a square or near-square aspect ratio works well. If your image is JPG, either convert it to PNG or change the filename in `index.html` to match the real file.

## Controls
- **Desktop:** WASD or arrow keys to move, mouse to look around, Space to jump, C to switch camera, Shift to move faster.
- **Mobile:** drag the virtual joystick to move; JUMP and VIEW buttons jump and switch camera.
- Click **ENTER THE CITY** to begin.
- Third-person is the default; switch to first-person with the camera button or C.

## Notes
The city and robot are generated from code, so no 3D model assets are required. This is a starter prototype; it uses simple geometric robot and building models. It requires WebGL and an internet connection.
