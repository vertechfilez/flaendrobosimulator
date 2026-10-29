(() => {
  const loadingScreen = document.getElementById('loading-screen');
  const gameShell = document.getElementById('game-shell');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('loading-percent');
  const loadingStatus = document.getElementById('loading-status');
  const loadingImage = document.getElementById('loading-image');
  loadingImage.addEventListener('error', () => loadingImage.classList.add('image-missing'));

  // The loading UI uses a short startup sequence; Three.js and the scene are initialized below.
  const steps = ['INITIALIZING WORLD', 'BUILDING NEON DISTRICT', 'POWERING ROBOT SYSTEMS', 'READY TO ROAM'];
  let progress = 0;
  const loaderTimer = setInterval(() => {
    progress = Math.min(100, progress + 4 + Math.random() * 8);
    progressFill.style.width = progress + '%';
    progressText.textContent = Math.floor(progress) + '%';
    loadingStatus.textContent = steps[Math.min(steps.length - 1, Math.floor(progress / 26))];
    if (progress >= 100) {
      clearInterval(loaderTimer);
      setTimeout(() => {
        loadingScreen.style.display = 'none';
        gameShell.classList.remove('hidden');
        initGame();
      }, 300);
    }
  }, 110);

  function initGame() {
    const canvas = document.getElementById('game-canvas');
    if (!window.THREE) {
      document.getElementById('world-status').textContent = '3D LIBRARY OFFLINE';
      return;
    }
    const THREE = window.THREE;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07111f);
    scene.fog = new THREE.FogExp2(0x07111f, 0.009);
    const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 900);
    const renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    scene.add(new THREE.HemisphereLight(0x9ddcff, 0x172033, 2.0));
    const sun = new THREE.DirectionalLight(0xc3e9ff, 2.5);
    sun.position.set(-30, 60, 25); sun.castShadow = true; sun.shadow.mapSize.set(1024,1024); scene.add(sun);
    const cyanLight = new THREE.PointLight(0x00d9ff, 35, 100); cyanLight.position.set(0, 12, 0); scene.add(cyanLight);
    const magentaLight = new THREE.PointLight(0xff2eae, 25, 80); magentaLight.position.set(30, 8, -30); scene.add(magentaLight);

    const mat = (color, roughness=0.7, metalness=0.1, emissive=null) => new THREE.MeshStandardMaterial({color, roughness, metalness, ...(emissive ? {emissive:new THREE.Color(emissive), emissiveIntensity:1.1} : {})});
    const groundMat = mat(0x101d2c, .95);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(900,900), groundMat);
    ground.rotation.x = -Math.PI/2; ground.position.y = -0.08; ground.receiveShadow = true; scene.add(ground);

    // Road grid and glowing lane markings
    const roadMat = mat(0x09111e, .85);
    const lineCyan = mat(0x19cbe8, .3, .2, 0x087f99);
    const linePink = mat(0xff3bbf, .3, .2, 0x8b145e);
    for(let i=-5;i<=5;i++){
      const road1 = new THREE.Mesh(new THREE.BoxGeometry(8,.04,900), roadMat); road1.position.set(i*45,.0,0); scene.add(road1);
      const road2 = new THREE.Mesh(new THREE.BoxGeometry(900,.04,8), roadMat); road2.position.set(0,.01,i*45); scene.add(road2);
      const l1 = new THREE.Mesh(new THREE.BoxGeometry(.08,.055,900), i%2?lineCyan:linePink); l1.position.set(i*45+4.1,.04,0); scene.add(l1);
      const l2 = new THREE.Mesh(new THREE.BoxGeometry(900,.055,.08), i%2?linePink:lineCyan); l2.position.set(0,.04,i*45+4.1); scene.add(l2);
    }

    // Procedural skyline: all assets are generated in code, so no external models are required.
    const buildings = [];
    const buildingMats = [mat(0x152c45,.55,.35),mat(0x1a2340,.5,.4),mat(0x102b36,.5,.4),mat(0x252343,.55,.3)];
    const windowMats = [mat(0x34dff5,.3,.1,0x0c7b99),mat(0xff44c7,.3,.1,0x8b125e),mat(0x8eaaff,.3,.1,0x344d9e)];
    function addBuilding(x,z,w,h,d,seed){
      const group = new THREE.Group(); group.position.set(x,0,z);
      const body = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),buildingMats[seed%buildingMats.length]);
      body.position.y=h/2; body.castShadow=true; body.receiveShadow=true; group.add(body);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(w+0.18,.22,d+0.18), seed%2?lineCyan:linePink); trim.position.y=h*.72; group.add(trim);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w*.55,.5,d*.55),mat(0x203b54,.4,.4)); roof.position.y=h+.22; group.add(roof);
      // Repeating window panels on street-facing sides.
      const floors=Math.min(16,Math.floor(h/3.2));
      for(let f=1;f<floors;f++){
        for(let col=0;col<Math.max(1,Math.floor(w/2.8));col++){
          const ww=Math.min(1.25,w/(Math.floor(w/2.8)+1));
          const panel=new THREE.Mesh(new THREE.BoxGeometry(ww,.85,.045),windowMats[(seed+f+col)%windowMats.length]);
          panel.position.set(-w/2+(col+1)*w/(Math.floor(w/2.8)+1),f*3.0,d/2+.03);group.add(panel);
        }
      }
      scene.add(group); buildings.push({x,z,w,d,h});
    }
    let seed=5; const rand=()=>{seed=(seed*9301+49297)%233280;return seed/233280;};
    for(let gx=-5;gx<=5;gx++)for(let gz=-5;gz<=5;gz++){
      if(Math.abs(gx)<=1&&Math.abs(gz)<=1) continue;
      const count=1+Math.floor(rand()*3);
      for(let k=0;k<count;k++){
        const x=gx*45+(rand()-.5)*23, z=gz*45+(rand()-.5)*23;
        const w=8+rand()*12,d=8+rand()*12,h=12+rand()*65;
        addBuilding(x,z,w,h,d,Math.floor(rand()*10));
      }
    }

    // Floating signage, light pylons, and simple holographic rings.
    const signMat=mat(0x5defff,.25,.1,0x14bcd5);
    for(let i=0;i<42;i++){
      const x=(rand()-.5)*350,z=(rand()-.5)*350;
      const pole=new THREE.Mesh(new THREE.BoxGeometry(.18,4+rand()*7,.18),signMat);
      pole.position.set(x,2,z);scene.add(pole);
      const orb=new THREE.Mesh(new THREE.SphereGeometry(.25,8,8),i%2?linePink:lineCyan);
      orb.position.set(x,5+rand()*5,z);scene.add(orb);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(10,.06,8,100),lineCyan);ring.rotation.x=Math.PI/2;ring.position.set(0,.2,0);scene.add(ring);
    const ring2=new THREE.Mesh(new THREE.TorusGeometry(13,.035,8,100),linePink);ring2.rotation.x=Math.PI/2;ring2.position.set(0,.22,0);scene.add(ring2);

    // Robot character Flaend
    const robot = new THREE.Group(); scene.add(robot);
    const robotMetal=mat(0xb7d5e5,.35,.72), darkMetal=mat(0x253c52,.4,.65), visorMat=mat(0x062333,.18,.55), eyeMat=mat(0x4bf0ff,.18,.2,0x20dfff);
    const torso=new THREE.Mesh(new THREE.BoxGeometry(1.05,1.15,.62),robotMetal);torso.position.y=1.85;torso.castShadow=true;robot.add(torso);
    const chest=new THREE.Mesh(new THREE.BoxGeometry(.55,.22,.08),darkMetal);chest.position.set(0,1.95,.35);robot.add(chest);
    const chestLight=new THREE.Mesh(new THREE.BoxGeometry(.22,.07,.1),eyeMat);chestLight.position.set(0,1.95,.41);robot.add(chestLight);
    const head=new THREE.Group();head.position.y=2.68;robot.add(head);
    const headBox=new THREE.Mesh(new THREE.BoxGeometry(.9,.7,.72),robotMetal);headBox.castShadow=true;head.add(headBox);
    const visor=new THREE.Mesh(new THREE.BoxGeometry(.72,.3,.045),visorMat);visor.position.set(0,.02,.37);head.add(visor);
    for(const x of [-.2,.2]){const eye=new THREE.Mesh(new THREE.BoxGeometry(.1,.07,.05),eyeMat);eye.position.set(x,.02,.405);head.add(eye);}
    const antenna=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,.28,8),darkMetal);antenna.position.set(0,.48,0);head.add(antenna);
    const antennaTip=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),linePink);antennaTip.position.set(0,.64,0);head.add(antennaTip);
    const arms=[],legs=[];
    for(const side of [-1,1]){
      const arm=new THREE.Group();arm.position.set(side*.67,2.15,0);robot.add(arm);
      const upper=new THREE.Mesh(new THREE.BoxGeometry(.28,.72,.32),darkMetal);upper.position.y=-.25;arm.add(upper);
      const hand=new THREE.Mesh(new THREE.BoxGeometry(.3,.28,.34),robotMetal);hand.position.y=-.65;arm.add(hand);arms.push(arm);
      const leg=new THREE.Group();leg.position.set(side*.29,1.15,0);robot.add(leg);
      const thigh=new THREE.Mesh(new THREE.BoxGeometry(.35,.58,.4),darkMetal);thigh.position.y=-.25;leg.add(thigh);
      const foot=new THREE.Mesh(new THREE.BoxGeometry(.42,.2,.55),robotMetal);foot.position.set(0,-.57,.1);leg.add(foot);legs.push(leg);
    }
    const shadowDisc=new THREE.Mesh(new THREE.CircleGeometry(.8,24),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.25}));shadowDisc.rotation.x=-Math.PI/2;shadowDisc.position.y=.015;robot.add(shadowDisc);
    robot.position.set(0,0,0);

    // Controls and camera
    const keys={};let yaw=0,pitch=-.12,firstPerson=false,started=false,locked=false;
    const velocity=new THREE.Vector3(), direction=new THREE.Vector3(), clock=new THREE.Clock();
    let joystickX=0,joystickY=0,jumpQueued=false,onGround=true;
    const isMobile=matchMedia('(pointer: coarse)').matches || innerWidth<700;
    document.getElementById('desktop-hint').textContent=isMobile?'Use joystick to move · VIEW changes camera':'WASD move · Mouse look · Space jump · C switch camera';
    const cameraButton=document.getElementById('camera-button'),mobileCamera=document.getElementById('mobile-camera-button');
    function toggleCamera(){firstPerson=!firstPerson;cameraButton.textContent='CAMERA: '+(firstPerson?'FIRST':'THIRD');document.getElementById('crosshair').style.opacity=firstPerson?'.85':'.25';}
    cameraButton.addEventListener('click',toggleCamera);mobileCamera.addEventListener('click',toggleCamera);
    document.getElementById('start-button').addEventListener('click',()=>{
      started=true;document.getElementById('start-overlay').style.display='none';
      if(!isMobile) canvas.requestPointerLock?.();
    });
    canvas.addEventListener('click',()=>{if(started&&!isMobile)canvas.requestPointerLock?.();});
    document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===canvas;});
    document.addEventListener('mousemove',e=>{if(locked&&started){yaw-=e.movementX*.0022;pitch-=e.movementY*.0018;pitch=Math.max(-.8,Math.min(.55,pitch));}});
    document.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();if(e.code==='KeyC')toggleCamera();if(e.code==='Space')jumpQueued=true;});
    document.addEventListener('keyup',e=>keys[e.code]=false);
    document.getElementById('jump-button').addEventListener('click',()=>jumpQueued=true);

    // Touch joystick
    const joy=document.getElementById('joystick'),stick=document.getElementById('stick');let joyActive=false;
    function updateJoy(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=35,len=Math.hypot(dx,dy);if(len>max){dx=dx/len*max;dy=dy/len*max;}joystickX=dx/max;joystickY=dy/max;stick.style.left=`calc(50% + ${dx}px)`;stick.style.top=`calc(50% + ${dy}px)`;}
    joy.addEventListener('pointerdown',e=>{joyActive=true;joy.setPointerCapture(e.pointerId);updateJoy(e);});
    joy.addEventListener('pointermove',e=>{if(joyActive)updateJoy(e);});
    function releaseJoy(){joyActive=false;joystickX=0;joystickY=0;stick.style.left='50%';stick.style.top='50%';}
    joy.addEventListener('pointerup',releaseJoy);joy.addEventListener('pointercancel',releaseJoy);

    const collides=(x,z)=>buildings.some(b=>Math.abs(x-b.x)<b.w/2+0.8&&Math.abs(z-b.z)<b.d/2+0.8);
    function animate(){
      requestAnimationFrame(animate);
      const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;
      ring.rotation.z=t*.12;ring2.rotation.z=-t*.09;cyanLight.position.x=Math.sin(t*.3)*18;magentaLight.position.z=Math.cos(t*.25)*30;
      if(started){
        let forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joystickY;
        let side=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joystickX;
        const mag=Math.hypot(forward,side);if(mag>1){forward/=mag;side/=mag;}
        const speed=keys.ShiftLeft?11:7.2;
        const moveX=(Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed*dt;
        const moveZ=(Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed*dt;
        const nextX=robot.position.x+moveX,nextZ=robot.position.z+moveZ;
        if(!collides(nextX,robot.position.z))robot.position.x=nextX;
        if(!collides(robot.position.x,nextZ))robot.position.z=nextZ;
        const moving=mag>.08;
        if(moving){robot.rotation.y=Math.atan2(moveX,moveZ);legs[0].rotation.x=Math.sin(t*10)*.65;legs[1].rotation.x=-Math.sin(t*10)*.65;arms[0].rotation.x=-Math.sin(t*10)*.35;arms[1].rotation.x=Math.sin(t*10)*.35;}
        else {legs.forEach(l=>l.rotation.x*=.8);arms.forEach(a=>a.rotation.x*=.8);}
        if(jumpQueued&&onGround){velocity.y=7.4;onGround=false;}jumpQueued=false;
        velocity.y-=18*dt;robot.position.y+=velocity.y*dt;
        if(robot.position.y<0){robot.position.y=0;velocity.y=0;onGround=true;}
        head.position.y=2.68+Math.sin(t*2)*.025;
        const target=new THREE.Vector3(robot.position.x,robot.position.y+(firstPerson?2.58:2.05),robot.position.z);
        if(firstPerson){
          camera.position.copy(target);
          const look=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
          camera.lookAt(target.clone().add(look.multiplyScalar(10)));
        }else{
          const distance=7.5, height=3.3;
          const desired=new THREE.Vector3(robot.position.x-Math.sin(yaw)*distance,robot.position.y+height-pitch*2,robot.position.z-Math.cos(yaw)*distance);
          camera.position.lerp(desired,1-Math.pow(.001,dt));
          camera.lookAt(robot.position.x,robot.position.y+1.7,robot.position.z);
        }
        document.getElementById('coords').textContent=`X ${robot.position.x.toFixed(0)} · Z ${robot.position.z.toFixed(0)}`;
      }else{
        camera.position.set(Math.sin(t*.08)*16,10,Math.cos(t*.08)*16);camera.lookAt(0,1,0);
        robot.rotation.y=t*.2;
      }
      renderer.render(scene,camera);
    }
    addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.setSize(innerWidth,innerHeight);});
    animate();
  }
})();