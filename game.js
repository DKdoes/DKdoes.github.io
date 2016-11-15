window.onload = function(){

    scene = new THREE.Scene()
    clock = new THREE.Clock()
    delta = clock.getDelta()
    
    renderer = new THREE.WebGLRenderer({alpha:true})
    renderer.setClearColor(0xffffff,0)
    renderer.shadowMap.type = 0
    renderer.shadowMap.enabled = true

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.style.position = "absolute"
    renderer.domElement.style.zIndex = 100

    document.body.appendChild(renderer.domElement)

    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
    scene.add(camera)
    camera.position.z = 20
    camera.realRotation = {x:0,y:0,z:0}
    camera.update = function(){
        camera.rotation.x -= (camera.rotation.x - camera.realRotation.x) * delta * 2
        camera.rotation.y -= (camera.rotation.y - camera.realRotation.y) * delta * 2
    }
    window.addEventListener('mousemove',function(e){
        camera.realRotation.x = (e.clientY / window.innerHeight * 2 - 1) * -0.26
        camera.realRotation.y = (e.clientX / window.innerWidth * 2 - 1) * -0.26
    })

    window.addEventListener('resize',function(){
        renderer.setSize(window.innerWidth, window.innerHeight)
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
    })
    window.dispatchEvent(new Event('resize'))


    cubeGeo = new THREE.BoxGeometry(1,1,1)
    cubeMat = new THREE.MeshLambertMaterial({color:0xabcdef})
    cube = new THREE.Mesh(cubeGeo, cubeMat)
    cube.castShadow = true
    cube.update = function(){
        this.rotation.x = new Date() * Math.PI / 5000
        this.rotation.y = new Date() * Math.PI / 5000
        this.rotation.z = new Date() * Math.PI / 5000
    }
    scene.add(cube)


    planeGeo = new THREE.PlaneBufferGeometry(10,10)
    planeMat = new THREE.MeshLambertMaterial({color:0xffdddd})
    plane = new THREE.Mesh(planeGeo,planeMat)
    plane.receiveShadow = true
    plane.position.z = -1
    scene.add(plane)


    sunlight = new THREE.DirectionalLight(0xffffff, 1)
    sunlight.position.set(-0.2,0.2,1)
    sunlight.castShadow = true
    scene.add(sunlight)

    ambientLight = new THREE.AmbientLight(0xffffff, 0.1)
    scene.add(ambientLight)
    render()
}

render = function(){
    requestAnimationFrame(render)
    TWEEN.update()
    delta = clock.getDelta()
    scene.children.map(
        function(o){
            if(o.update){o.update()}
        }
    )
    renderer.render(scene,camera)
}
