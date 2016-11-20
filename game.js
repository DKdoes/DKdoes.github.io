window.onload = function(){

    scene = new THREE.Scene()
    clock = new THREE.Clock()
    delta = clock.getDelta()
    world = new CANNON.World()
    world.gravity.set(0,-9.8,0)
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
    debug = false

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
        }
    }
    window.addEventListener('mousemove',function(e){
        e.preventDefault()
        camera.realRotation.x = (e.clientY / window.innerHeight * 2 - 1) * -0.26
        camera.realRotation.y = (e.clientX / window.innerWidth * 2 - 1) * -0.26
    })
    
    window.addEventListener('touchstart',function(e){
        e.preventDefault()
        camera.realRotation.x = (e.touches[0].clientY / window.innerHeight * 2 - 1) * -0.26
        camera.realRotation.y = (e.touches[0].clientX / window.innerWidth * 2 - 1) * -0.26
    })
    window.addEventListener('touchmove',function(e){
        e.preventDefault()
        camera.realRotation.x = (e.touches[0].clientY / window.innerHeight * 2 - 1) * -0.26
        camera.realRotation.y = (e.touches[0].clientX / window.innerWidth * 2 - 1) * -0.26
    })
    
    resize = function(){
        renderer.setSize(window.innerWidth, window.innerHeight)
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
        position == undefined ? position = {x:0,y:0,z:0} : 0
        this.body = new CANNON.Body({
            mass:mass,
            shape:new CANNON.Box(new CANNON.Vec3(size/2,size/2,size/2)),
            position:position
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
    $(document).keydown(function(e){
        e = e.which || e.keyCode
        switch(e){
            case 48:
                debug = !debug
                break
            case 57:
                new CUBE()
                break
            default:
                console.log(e)
        }
    })
    new CUBE()
    render()
}

render = function(){
    requestAnimationFrame(render)
    delta = clock.getDelta()
    TWEEN.update()
    world.step(1/60, delta, 1)
    sceneWorld.map(
        function(o){
            if(o.update){o.update()}
        }
    )
    renderer.render(scene,camera)
}
