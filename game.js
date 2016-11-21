window.onload = function(){

    scene = new THREE.Scene()
    clock = new THREE.Clock()
    delta = clock.getDelta()
    maxSubSteps = 1
    world = new CANNON.World()
    world.gravity.set(0,-91,0)
    world.allowSleep=true
    sceneWorld = []
    
    
    renderer = new THREE.WebGLRenderer({alpha:true})
    renderer.setClearColor(0xffffff,0)
    renderer.shadowMap.type = THREE.BasicShadowMap
    renderer.shadowMap.enabled = true

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.style.position = "absolute"
    renderer.domElement.style.zIndex = 100
    document.body.appendChild(renderer.domElement)

    animate = true

    window.addEventListener('blur',function(){animate = false})
    window.addEventListener('focus',function(){
        animate = true
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
        }
    }
    resize = function(){
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.domElement.style.left = 0
        renderer.domElement.style.top = 0
        window.scrollTo(0,0)
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
    }
    window.addEventListener('resize',resize)
    resize()

    ground = {
        mesh:new THREE.Mesh(
            new THREE.PlaneBufferGeometry(10,10),
            new THREE.MeshLambertMaterial({color:0xffdddd})
        ),
        body:new CANNON.Body({
            mass:0,
            shape: new CANNON.Plane()
        }),
        update:function(){
            this.mesh.quaternion.fromArray(this.body.quaternion.toArray())
            this.mesh.position.copy(this.body.position)
        }
    }
    ground.body.position.y = -5
    ground.body.quaternion.setFromAxisAngle(CANNON.Vec3.UNIT_X,Math.PI*-0.5)
    world.add(ground.body)
    scene.add(ground.mesh)
    sceneWorld.push(ground)


    sunlight = new THREE.DirectionalLight(0xffffff, 1)
    sunlight.position.set(1,2,1)
    sunlight.castShadow = true
    scene.add(sunlight)

    ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambientLight)
    
    
    CUBE = function(size, mass, position){
        size == undefined ? size = 1 : 0
        mass == undefined ? mass = 1 : 0
        position == undefined ? position = {x:0,y:10,z:0} : 0
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
        sceneWorld.push(this)
        world.add(this.body)
        scene.add(this.mesh)
    }
    player = new CUBE(1,4)
    player.mesh.material.color.set(14069242)
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
    player.update = function(){
        if (player.touch.active){
            var t0 = player.touch.x2 - player.touch.x
            var t1 = player.touch.y2 - player.touch.y
            var t2 = Math.hypot(t0, t1) || 1e-15
            console.log(t0/t2)
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
    $(document).keydown(function(e){
        e.preventDefault()
        e = e.which || e.keyCode
        switch(e){
            case 49:
                new CUBE()
                break
            case 50:
                new TWEEN.Tween(player.mesh.material.color)
                    .to({r:Math.random(),g:Math.random(),b:Math.random()},300)
                    .easing(TWEEN.Easing.Circular.InOut)
                    .start()
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
                if (player.jumping == 0){
                    player.jumping = 20
                    player.body.velocity.y = player.jumpVelocity
                    player.speed = player.jSpeed
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
                }
                break
            case 80:
                location.reload()
                break
            default:
                console.log(e)
        }
    })
    $(document).keyup(function(e){
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
    window.addEventListener('mousemove',function(e){
        e.preventDefault()
        camera.realRotation.x = (e.clientY / window.innerHeight * 2 - 1) * -0.26
        camera.realRotation.y = (e.clientX / window.innerWidth * 2 - 1) * -0.26
    })
    window.addEventListener('touchstart',function(e){
        e.preventDefault()
        if (e.touches.length == 1){
            player.touch.active = true
            player.touch.x = e.touches[0].clientX
            player.touch.y = e.touches[0].clientY
            player.touch.x2 = e.touches[0].clientX
            player.touch.y2 = e.touches[0].clientY
        }
        else if (e.touches.length == 2){
            if (player.jumping == 0){
                player.jumping = 20
                player.body.velocity.y = player.jumpVelocity
                player.speed = player.jSpeed
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
            }
        }
        else if (e.touches.length == 3){new CUBE()}
    })
    window.addEventListener('touchmove',function(e){
        e.preventDefault()
        if (e.touches.length == 1){
            player.touch.x2 = e.touches[0].clientX
            player.touch.y2 = e.touches[0].clientY
        }
        else if (e.touches.length == 2){
        }
    })
    window.addEventListener('touchend',function(e){
        e.preventDefault()
        if (e.touches.length == 0){
            player.touch.active = false
        }
    })
    window.addEventListener("devicemotion",function(e){
        e=e.accelerationIncludingGravity
        camera.realRotation.x = e.z*0.03
        camera.realRotation.y = -e.x*0.1
    })
    render()
}

render = function(){
    requestAnimationFrame(render)
    delta = clock.getDelta()
    TWEEN.update()
    world.step(1/60, delta, maxSubSteps)
    sceneWorld.map(
        function(o){
            if(o.update){o.update()}
        }
    )
    renderer.render(scene,camera)
}
