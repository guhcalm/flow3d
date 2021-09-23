import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.112.1/build/three.module.js'
import Noise from './src/PerlinNoise/noise.js'
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js'

let canvas  = document.querySelector( 'canvas' )
let w       = ( canvas.width = window.innerWidth )
let h       = ( canvas.height = window.innerHeight )
let octaves = { x: 1, y: 1, z: 1 }
let malha   = { x: 15, y: 15, z: 15 }
let malhas  = { octaves, malha }
let quantidade = 50
let raio = .06
let velocidade = .5
let cena

function criarAmbiente( canvas ) {
    let cena = criarCena()
    let camera = criarCamera( canvas, cena )
    let luz = criarLuz( cena )
    let render = criarRenderizador( canvas )
    return { cena, camera, render }
}
function criarCena () {
    let background = 0x363d3d
    let cena = new THREE.Scene()
    cena.background = new THREE.Color( background )
    cena.fog = new THREE.Fog( background, -1, 3000  )
    return cena
}
function criarCamera( canvas, cena ) {
    let w = ( canvas.width = window.innerWidth )
    let h = ( canvas.height = window.innerHeight )
    let camera = new THREE.PerspectiveCamera( 75, w/h, .1, 1000 )
    cena.add(camera)
    return camera
}
function criarLuz( cena ) {
    let light = new THREE.HemisphereLight(0xffffff, 0xffffff, .5)
         
    let backLight = new THREE.DirectionalLight(0xffffff, .2);
    backLight.position.set(-10, 20, 50);
    backLight.castShadow = true;

    let lightProbe = new THREE.LightProbe();

    const dirLight = new THREE.DirectionalLight( 'white', .2 );
    dirLight.position.set(10, 10, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = - 2;
    dirLight.shadow.camera.left = - 2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;

    const light2 = new THREE.PointLight( 0xff2200, 0.2 );
	light2.position.set( - 100, - 100, - 100 );
	cena.add( light2 )

    addShadowedLight( 1, 1, 1, 0xffffff, .1 )
    addShadowedLight( 0.5, 1, - 1, 0xffffff, .5 )


    function addShadowedLight( x, y, z, color, intensity ) {

        const directionalLight = new THREE.DirectionalLight( color, intensity );
        directionalLight.position.set( x, y, z );
        cena.add( directionalLight );
    
        directionalLight.castShadow = true;
    
        const d = 1;
        directionalLight.shadow.camera.left = - d;
        directionalLight.shadow.camera.right = d;
        directionalLight.shadow.camera.top = d;
        directionalLight.shadow.camera.bottom = - d;
    
        directionalLight.shadow.camera.near = 1;
        directionalLight.shadow.camera.far = 4;
    
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
    
        directionalLight.shadow.bias = - 0.001;
    
    }

    cena.add(dirLight);    
    cena.add(lightProbe );    
    cena.add(backLight);
    cena.add(light);
}
function criarRenderizador(canvas) {
    let render = new THREE.WebGLRenderer( { canvas, antialias: true } )
    render.setSize( w, h )
    return render
}


function init( canvas, malhas ) {
    let ambiente = criarAmbiente( canvas ) // {cena,camera,render}
    let malha = criarMalha(malhas)         // {unidades, intervalo, contorno}
    let time = 0
    //OrbitControl
    const controls = new OrbitControls(ambiente.camera, canvas);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 4;
    controls.maxDistance = 50;
    controls.minDistance = 5;
    controls.enablePan = false;
    controls.target.set(malha.contorno.x/2, malha.contorno.y/2, malha.contorno.y/2)
    ambiente.camera.position.set( malha.contorno.x/2, malha.contorno.y/2, 20 )

    let campo = criarCampo( malha, time )
    desenharCampo(ambiente, campo)
    let life = criarParticulas( ambiente, malha, quantidade )
    loop()
    function loop() {
        //time += .01
        campo = criarCampo( malha, time )
        move( ambiente, malha, campo, life )
        if ( time <= 150 ) {
            
        }
        requestAnimationFrame(loop)
        ambiente.render.render( ambiente.cena, ambiente.camera )
    }
}
function criarMalha(malhas) {
    let o = malhas.octaves
    let m = malhas.malha
    let unidades  = { x: o.x * m.x, y: o.y * m.y, z: o.z * m.z }
    let intervalo = { x: 10 / m.x, y: 10 / m.y, z: 10 / m.z }
    let contorno  = { 
        x: unidades.x * intervalo.x,
        y: unidades.y * intervalo.y,
        z: unidades.z * intervalo.z
    }  
    return { unidades, intervalo, contorno }
}
function criarCampo(malha, tempo) {
    let intervalo = malha.intervalo
    let unidades = malha.unidades
    let campo = [ new Array( unidades.x ) ]
    for ( let x = 0; x <= unidades.x; x++ ) {
        campo[x] = new Array( unidades.y )
    for ( let y = 0; y <= unidades.y; y++ ) {
        campo[x][y] = new Array( unidades.z )
    for ( let z = 0; z <= unidades.z; z++ ) {
        let xi = x * intervalo.x
        let yi = y * intervalo.y
        let zi = z * intervalo.z
        
        let pos = { x: xi, y: yi, z: zi }
        let noise = Noise( xi/unidades.x + tempo, yi/unidades.y + tempo, zi/unidades.z + tempo )

        let comprimento = malha.intervalo.x * noise
        let angulo = 2 * Math.PI * noise
        let dx = comprimento * Math.cos( angulo )
        let dy = comprimento * Math.sin( angulo )
        let dz = comprimento * Math.cos( angulo )

        campo[x][y][z] = { pos, noise, comprimento, angulo, dx, dy, dz }
    }}}
    return campo
}
function desenharCampo(ambiente, campo) {
    let particulas = new THREE.Group()
    campo.forEach( x => {
        x.forEach( y => {
        y.forEach( z => {
            let pos = z.pos
            let size = .03
            particulas.add(desenharPontos(pos, size))
        })})
    })
    ambiente.cena.add( particulas )
}
function desenharPontos(pos, size) {
    let geometry = new THREE.BoxGeometry( size, size, size )
    let material = new THREE.MeshBasicMaterial({
        color:'rgba(205,205,205,1)'
    })
    let particula = new THREE.Mesh( geometry, material )
    particula.position.set( pos.x, pos.y, pos.z )
    return particula
}
function criarParticulas( ambiente, malha, quantidade ) {
    let particulas = new THREE.Group()
    let life = []
    let comprimento = []
    for ( let i = 0; i <= quantidade; i++ ) {
        let xi = malha.contorno.x * Math.random()
        let yi = malha.contorno.y * Math.random()
        let zi = malha.contorno.z * Math.random()
        let pos = { x: xi, y: yi, z: zi }
        let size = raio
        particulas.add( desenharParticula( pos, size ) )
        life[i] = (Math.random() * 10 + 5)
        comprimento[i] = (Math.random() * 2)
    }
    ambiente.cena.add(particulas)
    return { life, comprimento, particulas }
}
function desenharParticula(pos, size) {
    let geometry = new THREE.SphereGeometry( size, 15, 15 )
    let material = new THREE.MeshLambertMaterial({color:'rgba(255,255,255,1)', opacity: 0, flatShading: true, transparent: true })

    let baseMaterial = new THREE.MeshPhysicalMaterial({
        color: 'rgba(255,255,255,1)',
        wireframe: false,
        metalness: 0,
        roughness: 0,
        transparent: true,
        reflectivity: 1,
        refractionRatio: 1
    })

    let particula = new THREE.Mesh( geometry, material )
    particula.position.set( pos.x, pos.y, pos.z )
    return particula
}
function criarVetor( cena, points, color, opacity ) {
    let material = new THREE.LineBasicMaterial( {
        color: color,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: opacity 
    } )
    let geometria = new THREE.BufferGeometry().setFromPoints( points )
    let vetor = new THREE.LineSegments( geometria, material )
    cena.add( vetor )
    return vetor
}
function move( ambiente, malha, campo, life ) {
    let particulas = life.particulas.children
    let index = 0

    particulas.forEach( p => {
        life.comprimento[index] -= .05
        life.life[index] -= 1
        let pos = p.position
        let v = {
            x: Math.round(pos.x / malha.intervalo.x),
            y: Math.round(pos.y / malha.intervalo.y),
            z: Math.round(pos.z / malha.intervalo.z),
        }
        
        let vel = {
            x: campo[v.x][v.y][v.z].dx,
            y: campo[v.x][v.y][v.z].dy,
            z: campo[v.x][v.y][v.z].dz
        }
        
        let color = p.material.color

        let noise = campo[v.x][v.y][v.z].noise * 1.05
        
        let oi = parametrizarCores( noise )
        //console.log(oi)
        color.r = oi.cor.r
        color.g = oi.cor.g
        color.b = oi.cor.b


        let opacity = (p.material.opacity = noise)

        pos.x += vel.x * velocidade
        pos.y += vel.y * velocidade
        pos.z += vel.z * velocidade

        let points = []
        points.push( 
            {x:pos.x - vel.x * velocidade, y:pos.y - vel.y * velocidade, z:pos.z - vel.z * velocidade}, 
            {x:pos.x, y:pos.y, z:pos.z}
            )
        
        
        let vetor = criarVetor( ambiente.cena, points, color, opacity )
        
        if (life.comprimento[index]  <=0 ) {
            ambiente.cena.children.splice(10, 1)
        }
        

        if ( pos.x >= malha.contorno.x || 
             pos.y >= malha.contorno.y ||
             pos.z >= malha.contorno.z ||
             pos.x <= 0                || 
             pos.y <= 0                ||
             pos.z <= 0                 
             //life.life[index]  <=0
        ) 
        {
            let xi = malha.contorno.x * Math.random()
            let yi = malha.contorno.y * Math.random()
            let zi = malha.contorno.z * Math.random()
            pos.set( xi, yi, zi )
        }
        if ( life.life[index]  <=0 ) {
           life.life[index] = Math.random() * 10 + 5
       }

        //console.log(ambiente.cena)
        index ++
        })
    
}

function parametrizarCores( noise ) {
    let azul     = { r:   0, g:   0, b: 1 }
    let ciano    = { r:   0, g: 1, b: 1 }
    let verde    = { r:   0, g: 1, b:  0 }
    let amarelo  = { r: 1, g: 1, b:   0 }
    let vermelho = { r: 1, g:   0, b: 0 }
    let magenta  = { r: 1, g:   0, b: 1 }
    let intervalo = 1 / 6
    let cor

    if ( noise >= 0 && noise < 1 * intervalo ) {
        let pos = (noise - 0 * intervalo) / intervalo
        cor = interpolarCor(azul, magenta, pos)
    }
    if ( noise >= 1 * intervalo && noise < 2 * intervalo ) {
        let pos = (noise - 1 * intervalo) / intervalo
        cor = interpolarCor(azul, ciano, pos)
    }
    if ( noise >= 2 * intervalo && noise < 3 * intervalo ) {
        let pos = (noise - 2 * intervalo) / intervalo
        cor = interpolarCor(ciano, verde, pos)     
    }
    if ( noise >= 3 * intervalo && noise <= 4 * intervalo ) { 
        let pos = (noise - 3 * intervalo) / intervalo
        cor = interpolarCor(verde, amarelo, pos)   
    }
    if ( noise > 4 * intervalo && noise <= 5 * intervalo ) { 
        let pos = (noise - 4 * intervalo) / intervalo
        cor = interpolarCor(amarelo, vermelho, pos)
    }
    if ( noise > 5 * intervalo && noise <= 6 * intervalo ) { 
        let pos = (noise - 5 * intervalo) / intervalo
        cor = interpolarCor(vermelho, magenta, pos)
    }
    return cor  
}
function interpolarCor( cor1, cor2, pos ) {
    let r = cor1.r + pos * (cor2.r - cor1.r)
    let g = cor1.g + pos * (cor2.g - cor1.g)
    let b = cor1.b + pos * (cor2.b - cor1.b)

    let cor = { r, g, b }
    return { cor }
}



init( canvas, malhas )
