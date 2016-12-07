window.onload = function(){

    scene = new THREE.Scene()
    clock = new THREE.Clock()
    delta = clock.getDelta()
    maxSubSteps = 1
    world = new CANNON.World()
    world.gravity.set(0,-91,0)
    world.allowSleep=true
    sceneWorld = []
    
    var temp = /Android/i.test(navigator.userAgent)
    temp ? accelerometerMod = -1 : accelerometerMod = 1

    renderer = new THREE.WebGLRenderer({alpha:true})
    renderer.setClearColor(0xffffff,0)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.style.position = "absolute"
    renderer.domElement.style.zIndex = -100
    document.body.appendChild(renderer.domElement)

    pause = false
    animate = true

    window.addEventListener('blur',function(){animate = false})
    window.addEventListener('focus',function(){
        animate = true
        clock.getDelta()
        clock.getDelta()
        render()
    })
    
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
    sceneWorld.push(camera)
    camera.position.z = 20
    camera.realRotation = {x:0,y:0,z:0}
    camera.update = function(){
        if (animate){
            camera.rotation.x -= (camera.rotation.x - camera.realRotation.x) * delta * 2
            camera.rotation.y -= (camera.rotation.y - camera.realRotation.y) * delta * 2
            camera.rotation.z -= (camera.rotation.z - camera.realRotation.z) * delta * 2
            camera.position.x -= (camera.position.x - player.mesh.position.x) * delta * 2
            camera.position.y -= (camera.position.y - player.mesh.position.y - 4.6) * delta * 0.2
            camera.position.z -= (camera.position.z - player.mesh.position.z - 20) * delta * 2
        }
        Howler.pos(camera.position.x,camera.position.y,camera.position.z)
        Howler.orientation(
            camera.matrix.elements[8]*-1,
            camera.matrix.elements[9]*-1,
            camera.matrix.elements[10]*-1)
    }
    resize = function(e){
        e.preventDefault()
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.domElement.style.left = 0
        renderer.domElement.style.top = 0
        window.scrollTo(0,0)
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
    }
    window.addEventListener('resize',resize)
    window.dispatchEvent(new Event('resize'))
    
    jumpSound = new Howl({
        src: ['jump.mp3']
    })
    bumpSound = new Howl({
        src: ['bump.mp3']
    })
    spinSound = new Howl({
        src: ['spin.mp3']
    })
    destroySound = new Howl({
        src: ['destroy.mp3']
    })
    changeSound = new Howl({
        src: ['change.mp3']
    })
    spawnSound = new Howl({
        src: ['spawn.mp3']
    })
    
    tileGeo = new THREE.PlaneBufferGeometry(10,10)
    
    ground = function(tile,position,color){
        position == undefined && (position={x:0,y:-5,z:0})
        this.tile = tile
        color == undefined && (color=new THREE.Color(Math.random()*0.2+0.75,Math.random()*0.2+0.75,Math.random()*0.2+0.75))
        this.mesh = new THREE.Mesh(
            tileGeo,
            new THREE.MeshLambertMaterial({color:color}))
        this.mesh.position.set(
            position.x,
            position.y-5,
            position.z)
        this.mesh.scale.set(0.1,0.1,1)
        new TWEEN.Tween(this.mesh.scale)
            .to({x:1,y:1},500)
            .easing(TWEEN.Easing.Circular.Out)
            .start()
        new TWEEN.Tween(this.mesh.position)
            .to({y:"+5"},500)
            .easing(TWEEN.Easing.Circular.Out)
            .start()
        this.mesh.rotation.x=Math.PI*-0.5
        scene.add(this.mesh)
    }
    grounds = {
        body:new CANNON.Body({
            mass:0,
            shape: new CANNON.Plane()
        }),
        tiles:{},
        createTile:function(tile,position,color){
            var temp = new ground(tile,position,color)
            this.tiles[temp.tile] = temp
        },
        update:function(){
            var x = Math.round((player.mesh.position.x+(Math.sign(player.mesh.position.x*5)))/10)*10
            var z = Math.round((player.mesh.position.z+(Math.sign(player.mesh.position.z*5)))/10)*10
            //var playerTile = x+','+z
            var playerTiles = [
                [x+','+z,[x,z]],
                [(x+10)+','+z,[x+10,z]],
                [(x-10)+','+z,[x-10,z]],
                [x+','+(z+10),[x,z+10]],
                [x+','+(z-10),[x,z-10]]]
            playerTiles.map(function(a){
                if(grounds.tiles[a[0]]==undefined){
                    grounds.createTile(a[0],{x:a[1][0],y:-5,z:a[1][1]})
                }
            })
            /*
            if(this.tiles[playerTile] == undefined){
                this.createTile(playerTile,{x:x,y:-5,z:z})
            }*/
        }
    }
    grounds.body.position.y = -5
    grounds.body.quaternion.setFromAxisAngle(CANNON.Vec3.UNIT_X,Math.PI*-0.5)
    world.add(grounds.body)
    sceneWorld.push(grounds)
    grounds.createTile('0,0',{x:0,y:-5,z:0},0xffdddd)

    sunlight = new THREE.DirectionalLight(0xffffff, 1)
    sunlight.position.set(1,2,1)
    scene.add(sunlight)

    ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambientLight)
    
    
    CUBE = function(size, mass, position){
        size == undefined && (size = 1)
        mass == undefined && (mass = 1)
        position == undefined && (position = {x:0,y:10,z:0})
        this.body = new CANNON.Body({
            mass:mass,
            shape:new CANNON.Box(new CANNON.Vec3(size/2,size/2,size/2)),
            position:position,
            sleepSpeedLimit:2
        })
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(size,size,size),
            new THREE.MeshLambertMaterial({color:0xffffff*Math.random()})
        )
        this.update = function(){
            this.mesh.quaternion.fromArray(this.body.quaternion.toArray())
            this.mesh.position.copy(this.body.position)
        }
        this.bounce = function(){
            this.body.sleepState = 0
            this.body.velocity.y=25+Math.random()*10
            this.body.angularVelocity.set(
                Math.random()*60-30,
                Math.random()*60-30,
                Math.random()*60-30
            )
            jumpSound.pos(
                this.body.position.x,
                this.body.position.y,
                this.body.position.z)
            jumpSound.play()
        }
        this.mesh.parentRef = this
        this.name = "cube"
        sceneWorld.push(this)
        world.add(this.body)
        scene.add(this.mesh)
    }
    COLORCHANGECUBE = function(mesh){
        var temp = mesh.clone()
        var temp2 = mesh.material.clone()
        temp.material = temp2
        temp2.transparent = true
        new TWEEN.Tween(temp.scale)
            .to({x:5,y:5,z:5},1000)
            .easing(TWEEN.Easing.Circular.InOut)
            .onComplete(function(){scene.remove(temp)})
            .start()
        new TWEEN.Tween(temp2)
            .to({opacity:0},1000)
            .easing(TWEEN.Easing.Circular.InOut)
            .start()
        scene.add(temp)
    }
    document.getElementById("makeCube").onclick = function(){
        var temp = Math.random()*0.4+0.8
        new CUBE(temp,temp,{
            x:player.mesh.position.x,
            y:player.mesh.position.y+15,
            z:player.mesh.position.z
        })
        document.getElementById("refresh").disabled = false
        spawnSound.play()
    }
    document.getElementById("refresh").disabled = true
    
    refresh = function(){
        var temp = []
        for(i=0;i<sceneWorld.length;i++){
            if(sceneWorld[i].name=="cube"){
                world.remove(sceneWorld[i].body)
                scene.remove(sceneWorld[i].mesh)
            }
            else{
                temp.push(sceneWorld[i])
            }
        }
        destroySound.play()
        document.getElementById("refresh").disabled = true
        sceneWorld = temp
    }
    document.getElementById("refresh").onclick = function(){
        var temp = []
        for(i=0;i<sceneWorld.length;i++){
            if(sceneWorld[i].name=="cube"){
                world.remove(sceneWorld[i].body)
                scene.remove(sceneWorld[i].mesh)
            }
            else{
                temp.push(sceneWorld[i])
            }
        }
        destroySound.play()
        document.getElementById("refresh").disabled = true
        sceneWorld = temp
    }
    player = new CUBE(1,4)
    player.mesh.material.color.set(14069242)
    player.name = "player"
    player.body.allowSleep = false
    player.left = 0;
    player.right = 0
    player.up = 0
    player.down = 0
    player.touch = {active:false,x:0,y:0,x2:0,y2:0}
    player.jumping = 1
    player.jumpVelocity = 30
    player.speed = 8
    player.mSpeed = 10
    player.jSpeed = 8
    player.canChange = 0
    player.changeColor = function(){
        if (player.canChange <=0){
            new TWEEN.Tween(player.mesh.material.color)
                .to({r:Math.random(),g:Math.random(),b:Math.random()},300)
                .easing(TWEEN.Easing.Circular.InOut)
                .start()
            new COLORCHANGECUBE(player.mesh)
            changeSound.pos(player.mesh.position.x,player.mesh.position.y,player.mesh.position.z)
            changeSound.play()
            player.canChange = 1.01
        }
    }
    player.jump = function(){
        if (player.jumping == 0){
            player.jumping = 20
            player.body.velocity.y = player.jumpVelocity
            player.speed = player.jSpeed
            jumpSound.pos(
                player.mesh.position.x,
                player.mesh.position.y,
                player.mesh.position.z)
            jumpSound.play()
        }
        else{
            if(player.body.velocity.x<=0){
                player.body.angularVelocity.z = -14.4
                player.body.angularVelocity.y = 14.4
            }
            else{
                player.body.angularVelocity.z = 14.4
                player.body.angularVelocity.y = -14.4
            }
            spinSound.pos(
                player.mesh.position.x,
                player.mesh.position.y,
                player.mesh.position.z)
            spinSound.play()
        }
    }
    document.getElementById("changeColor").onclick = function(){player.changeColor()}
    player.update = function(){
        player.canChange>0&&(player.canChange-=delta)
        if (player.touch.active){
            var t0 = player.touch.x2 - player.touch.x
            var t1 = player.touch.y2 - player.touch.y
            var t2 = Math.hypot(t0, t1) || 1e-15
            player.body.velocity.x= player.speed * (t0/t2)
            player.body.velocity.z= player.speed * (t1/t2)
        }
        else{
            if (player.right == 1){
                player.body.velocity.x=player.speed*(player.up==1||player.down==1?0.707:1)
            }
            else if (player.left == 1){
                player.body.velocity.x=-player.speed*(player.up==1||player.down==1?0.707:1)
            }
            if (player.up == 1){
                player.body.velocity.z=-player.speed*(player.left==1||player.right==1?0.707:1)
            }
            else if (player.down == 1){
                player.body.velocity.z=player.speed*(player.left==1||player.right==1?0.707:1)
            }
        }
        if (player.jumping > 1){
            player.jumping--
        }
        if (player.jumping == 1){
            for (i=0;i<world.contacts.length;i++){
                if (world.contacts[i].bi === player.body || world.contacts[i].bj === player.body){
                    if (Math.abs(world.contacts[i].ni.y) > 0.95){
                        player.jumping = 0
                        player.speed = player.mSpeed
                    }
                }
            }
        }
        this.mesh.quaternion.fromArray(this.body.quaternion.toArray())
        this.mesh.position.copy(this.body.position)
    }
    document.addEventListener('keydown',function(e){
        e.preventDefault()
        e = e || window.event
        e = e.which || e.keyCode
        switch(e){
            case 49:
                var temp = Math.random()*0.5+0.5
                new CUBE(temp,temp,{
                    x:player.mesh.position.x,
                    y:player.mesh.position.y+15,
                    z:player.mesh.position.z
                })
                document.getElementById("refresh").disabled = false
                spawnSound.play()
                break
            case 50:
                player.changeColor()
                break
            case 51:
                refresh()
                break
            case 65:
                player.left = 1
                player.right == 1 && player.right++
                break
            case 68:
                player.right = 1
                player.left == 1 && player.left++
                break
            case 87:
                player.up = 1
                player.down == 1 && player.down++
                break
            case 83:
                player.down = 1
                player.up == 1 && player.up++
                break
            case 32:
                player.jump()
                break
            case 80:
                location.reload()
                break
            default:
                console.log(e)
        }
    })
    document.addEventListener('keyup',function(e){
        e.preventDefault()
        e = e || window.event
        e = e.which || e.keyCode
        switch(e){
            case 65:
                player.left = 0
                player.right == 2 && player.right--
                break
            case 68:
                player.right = 0
                player.left == 2 && player.left--
                break
            case 87:
                player.up = 0
                player.down == 2 && player.down--
                break
            case 83:
                player.down = 0
                player.up == 2 && player.up--
                break
        }
    })
    
    raycaster = new THREE.Raycaster()
    mouse = new THREE.Vector2()
    
    renderer.domElement.addEventListener('mousemove',function(e){
        e.preventDefault()
        mouse.x = (e.clientX / window.innerWidth * 2 - 1)
        mouse.y = - (e.clientY / window.innerHeight * 2 - 1)
        camera.realRotation.x = mouse.y * 0.13
        camera.realRotation.y = mouse.x * -0.26
    })
    renderer.domElement.addEventListener('mousedown',function(e){
        mouse.x = (e.clientX / window.innerWidth * 2 - 1)
        mouse.y = - (e.clientY / window.innerHeight * 2 - 1)
        raycaster.setFromCamera(mouse, camera)
        intersects = raycaster.intersectObjects(scene.children)
        if(intersects.length>0){
            try{
                intersects[0].object.parentRef.bounce()
            }catch(err){}
        }
    })
    
    
    $(function(){FastClick.attach(document.body)})
    
    renderer.domElement.addEventListener('touchstart',function(e){
        if (e.touches.length == 1){
            player.touch.active = true
            player.touch.x = e.touches[0].clientX
            player.touch.y = e.touches[0].clientY
            player.touch.x2 = e.touches[0].clientX
            player.touch.y2 = e.touches[0].clientY
        }
        else if (e.touches.length == 2){
            player.jump()
        }
        for(i=0;i<e.changedTouches.length;i++){
            mouse.x = (e.changedTouches[i].clientX / window.innerWidth * 2 - 1)
            mouse.y = - (e.changedTouches[i].clientY / window.innerHeight * 2 - 1)
            raycaster.setFromCamera(mouse, camera)
            intersects = raycaster.intersectObjects(scene.children)
            if(intersects.length>0){
                try{
                    intersects[0].object.parentRef.bounce()
                }catch(err){}
            }
        }
    })
    renderer.domElement.addEventListener('touchmove',function(e){
        e.preventDefault()
        player.touch.x2 = e.touches[0].clientX
        player.touch.y2 = e.touches[0].clientY
    })
    window.addEventListener('touchend',function(e){
        if (e.touches.length == 0){
            player.touch.active = false
        }
        scrollTo(0,0)
    })
    window.addEventListener("devicemotion",function(e){
        e=e.accelerationIncludingGravity
        camera.realRotation.x = accelerometerMod * e.z * 0.03
        if (renderer.domElement.width <= renderer.domElement.height){
            camera.realRotation.y = accelerometerMod * -e.x * 0.1
        }
        else{
            if (e.x*accelerometerMod < 0){
                camera.realRotation.y = accelerometerMod * e.y * 0.1
            }
            else{
                camera.realRotation.y = accelerometerMod * -e.y * 0.1
            }
        }
    })
    render()
}

window.addEventListener('scroll',function(){setTimeout(function(){scrollTo(0,0)},5000)})


bumper = {
    bumps:{},
    handleBumps:function(){
        var currentBumps = []
        for (i=0;i<world.contacts.length;i++){
            var temp = world.contacts[i].bi.id.toString()+','+world.contacts[i].bj.id.toString()
            if(currentBumps.indexOf(temp)<0){
                currentBumps.push(temp)
            }
            if(Object.keys(this.bumps).indexOf(temp)<0 || this.bumps[temp]<0){
                this.bumps[temp]=0.062
                bumpSound.pos(
                    world.contacts[i].bj.position.x,
                    world.contacts[i].bj.position.y,
                    world.contacts[i].bj.position.z)
                var tempSound = bumpSound.play()
                bumpSound.rate(Math.random()*2+2,tempSound)
            }
        }
        for(i=0;i<Object.keys(this.bumps).length;i++){
            if(currentBumps.indexOf(Object.keys(this.bumps)[i])<0){
                this.bumps[Object.keys(this.bumps)[i]] -= delta
                if (this.bumps[Object.keys(this.bumps)[i]]<0){
                    delete this.bumps[Object.keys(this.bumps)[i]]
                }
            }
        }
    }
}

render = function(){
    !pause && requestAnimationFrame(render)
    delta = clock.getDelta()
    TWEEN.update()
    world.step(1/60, delta, maxSubSteps)
    bumper.handleBumps()
    sceneWorld.map(
        function(o){
            if(o.update){o.update()}
        }
    )
    renderer.render(scene,camera)
}
