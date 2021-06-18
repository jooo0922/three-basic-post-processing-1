'use strict';

import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';

import {
  EffectComposer
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/postprocessing/EffectComposer.js';

import {
  RenderPass
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/postprocessing/RenderPass.js';

import {
  BloomPass
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/postprocessing/BloomPass.js';

import {
  FilmPass
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/postprocessing/FilmPass.js';

import {
  GUI
} from 'https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js';


function main() {
  // create WebGLRenderer
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas
  });

  // create camera
  const fov = 75;
  const aspect = 2;
  const near = 0.1;
  const far = 5;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 2;

  // create scene
  const scene = new THREE.Scene();

  // create directional light
  {
    const color = 0xFFFFFF;
    const intensity = 2;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
  }

  // create box geometry
  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  // 각각의 퐁-머티리얼을 생성해서 적용한 큐브 메쉬를 만들고, 해당 큐브 메쉬를 리턴해주는 함수
  function makeInstance(geometry, color, x) {
    const material = new THREE.MeshPhongMaterial({
      color
    });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.x = x;

    return cube;
  }

  // 생성하여 리턴받은 큐브 메쉬들을 배열에 저장해놓음. animate 함수에서 회전 애니메이션을 줄 때 사용할거임
  const cubes = [
    makeInstance(geometry, 0x44aa88, 0),
    makeInstance(geometry, 0x8844aa, -2),
    makeInstance(geometry, 0xaa8844, 2),
  ];

  /**
   * EffectComposer는 THREE.JS에서 후처리 패스 체인을 관리 및 실행해줌으로써, 원하는 렌더러에 후처리 효과를 추가해주는 객체
   * 씬을 렌더할 렌더러 객체를 넘겨주면서 생성해 줌.
   * 
   * EffectComposer를 생성하는 순간 2개의 렌더 타겟에 추가된 후처리 패스들을 적용하면서 교차로 렌더링해줌.
   * 이 과정을 'chain of post-processing passes'라고 부르며 자세한 설명이 튜토리얼 웹사이트에 잘 나와있으니 참고할 것. 
   * 
   * 어쨋든 후처리 패스 체이닝을 실행하려면 EffectComposer를 먼저 생성해줘야 함.
   */
  const composer = new EffectComposer(renderer);

  // EffectComposer의 패스 체인에는 항상 RenderPass를 첫 pass로 추가해줘야 함.
  // 얘는 씬과 카메라를 넘겨받은 뒤, EffectComposer가 패스 체이닝에 사용하는 두 렌더타겟 중 첫번째 렌더타겟에 넘겨받은 씬을 렌더해 줌.
  // 그래서 THREE.JS에서 대부분 후처리 작업을 해줄때는 EffectComposer, RenderPass는 필수로 사용해줘야 함.
  composer.addPass(new RenderPass(scene, camera));

  // BloomPass는 넘겨받은 씬을 원래보다 작게 렌더링해서 blur 효과를 주고, 이렇게 블러 처리한 씬을 원래 씬에 덮어씌워서 블룸 효과를 구현함
  // 참고로 블룸효과란 빛을 받는 물체가 그 주위에 빛을 발산하는 것과 같은 효과를 나타냄. -> '뽀샤시' 라고도 함...
  const bloomPass = new BloomPass(
    1, // 강도
    25, // 커널 크기
    4, // 시그마(?)
    256, // 렌더 타겟의 해상도를 낮춤
    // three.js 공식 문서에도 해당 클래스에 대한 문서가 없어서 각 인자가 정확히 뭘 의미하는지는 모르겠음ㅠ
  )
  composer.addPass(bloomPass); // 두번째 패스로 추가함

  // FilmPass는 노이즈 효과와 스캔라인(scanline) 효과를 적용함. 
  // 참고로 스캔라인이란, 옛날 브라운관 TV를 통해서 볼 때 은은한 가로선(?)이 그어진 효과를 연출해 준 거임.. 그니까 이 패스는 전반적으로 옛날 브라운관 TV로 보는 영화 느낌(?)을 구현해주는 패스같음.
  const filmPass = new FilmPass(
    0.35, // 노이즈 강도
    0.025, // 스캔라인 강도
    648, // 스캔라인 개수
    false, // 흑백 여부
  );
  // Pass.renderToScreen은 모든 Pass 객체에 공통적으로 존재하는 4개의 옵션 중 하나로써,
  // EffectComposer내에 존재하는 렌더 타겟에 해당 패스를 렌더링할지, 아니면 처음에 넘겨준 renderer의 캔버스에 렌더링할지 여부를 결정함.
  // 보통 EffectComposer에 마지막으로 추가하는 pass는 말그대로 마지막이니까 더 이상 렌더 타겟이 아니라 캔버스에 결과물을 렌더해줘야 하므로, 해당 옵션을 true로 지정해 줌.
  filmPass.renderToScreen = true;
  composer.addPass(filmPass); // 마지막 패스로 추가함

  // resize renderer
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }

    return needResize;
  }

  // dat.GUI를 이용해서 런타임에 각 패스들의 속성값을 변경해보자
  const gui = new GUI();

  // 런타임에 각 후처리 패스의 속성값을 변경할 때는 보통 uniform.value값을 바꿔주면 됨.
  // 이때, 어떤 속성값을 어떻게 조작할 수 있는지는 three.js의 후처리 패스 관련 소스 코드를 직접 까봐야 알 수 있음. (자세한 내용은 튜토리얼 웹사이트 참고)
  {
    // BloomPass.js의 코드를 확인해보면 인스턴스를 생성할 때 전달하는 strength 값이 this.copyUniforms[ "opacity" ].value 에 할당되는 것을 볼 수 있음.
    // 아, 그러면 this.copyUniforms[ "opacity" ].value 값을 dat.GUI로 조절하면 강도를 조절할 수 있구나!
    const folder = gui.addFolder('BloomPass'); // 일단 BloomPath 관련 입력창을 모아두는 폴더를 생성하고
    folder.add(bloomPass.copyUniforms.opacity, 'value', 0, 2).name('strength');
    folder.open(); // 폴더의 기본 상태를 열어 둠
  }

  {
    // FilmPass.js 코드를 확인해보면 인스턴스를 생성할 때 전달하는 4개의 값을 모두 uniform.XXX~.value를 통해서 할당되는 것을 볼 수 있음.
    // 이 4개의 값들도 각각의 uniform.XXX~.value를 dat.GUI로 조절할 수 있겠네 
    const folder = gui.addFolder('FilmPass'); // FilmPass 관련 입력창을 모아두는 폴더 생성
    folder.add(filmPass.uniforms.grayscale, 'value').name('grayscale'); // 흑백 여부는 boolean 값을 받아야 하므로 입력값의 범위를 별도로 지정하지 않음.
    folder.add(filmPass.uniforms.nIntensity, 'value', 0, 1).name('noise intensity');
    folder.add(filmPass.uniforms.sIntensity, 'value', 0, 1).name('scanline intensity');
    folder.add(filmPass.uniforms.sCount, 'value', 0, 1000).name('scanline count');
    folder.open(); // 폴더의 기본 상태를 열어둠.
  }

  let then = 0; // 이전 프레임의 타임스탬프값을 담을 변수
  // animate
  function animate(now) {
    now *= 0.001; // 밀리초 단위의 현재 프레임 타임스탬프값을 초 단위로 변환함.
    const deltaTime = now - then; // 현재 타임스탬프값에서 이전 타임스탬프값을 뺸 값(거의 항상 대략 16.66...값에 근접할거임)을 구해놓음. EffectComposer.render() 메서드를 호출할 때 전달해줘야 한다고 함...
    then = now; // 매 프레임마다 현재 타임스탬프값을 이전 타임스탬프값에 overwrite해놓음.

    // 렌더러가 리사이징되면 변화한 렌더러 사이즈에 맞춰서 카메라 비율(aspect)도 업데이트 해줘야 함
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();

      // EffectComposer가 패스 체인을 모두 적용해 준 결과물 씬을 캔버스에 렌더링해줄 때,
      // 캔버스 크기가 리사이징 되었다면 결과물의 크기를 리사이징된 캔버스 크기로 맞춰주어야 함. WebGLRenderer.setSize()와 유사한 메서드.
      composer.setSize(canvas.width, canvas.height);
    }

    // 각 큐브 메쉬에 회전 애니메이션을 줌
    cubes.forEach((cube, index) => {
      const speed = 1 + index * 0.1;
      const rotate = now * speed;
      cube.rotation.x = rotate;
      cube.rotation.y = rotate;
    });

    // WebGLRenderer.render() 메서드 대신 EffectComposer.render()를 호출해줘야 함.
    // 얘를 호출하면 EffectComposer에 추가된 후처리 패스 체인들을 순서대로 실행하여 최종적으로 모든 후처리 효과들이 적용된 씬을 캔버스에 렌더링 해줄거임
    // 이때 인자로 마지막 프레임을 렌더링한 이후 지난 시간값인 deltaTime을 인자로 받는데, 이게 왜 필요하냐면
    // 패스 체인에 추가된 pass들 중에서 애니메이션이 필요한 pass가 있다면 이 값을 이용해서 처리해줘야 하기 때문이라고 함.
    // 이 예제에서는 FilmPass가 애니메이션이 있다고 함.
    composer.render(deltaTime);

    requestAnimationFrame(animate); // 내부에서 반복 호출함
  }

  requestAnimationFrame(animate);
}

main();