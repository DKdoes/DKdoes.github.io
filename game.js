window.onload = function(){

scene = new THREE.Scene()

renderer = new THREE.WebGLRenderer({alpha:true})
renderer.setClearColor(0xffffff,1)
renderer.shadowMap.type = 0
renderer.shadowMap.endabled = true

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.domElement.style.position = "absolute"
renderer.domElement.style.zIndex = 100

document.body.appendChild(renderer.domElement)

camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
camera.position.z = 20


window.addEventListener('resize',function(){
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
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
plane = new THREE.Mesh(planeGeo)
plane.receiveShadow = true
plane.position.z = -1
scene.add(plane)


sunlight = new THREE.DirectionalLight(0xffffff, 1.35)
sunlight.position.set(0,1,0)
sunlight.castShadow = true
scene.add(sunlight)

render()
}

render = function(){
  requestAnimationFrame(render)
  
  scene.children.map(
    function(o){
      if(o.update){o.update()}
    }
  )
  renderer.render(scene,camera)
}
