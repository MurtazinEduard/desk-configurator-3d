import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import styles from './App.module.scss'
import { GLTFLoader, OrbitControls } from "three/examples/jsm/Addons.js";

type LegType = {
  type: string;
  url: string;
};

// Параметры ножек
const legSupports: LegType[] = [
  { type: 'Тип 1', url: 'src/assets/prop_01.glb' },
  { type: 'Тип 2', url: 'src/assets/prop_02.glb' },
];

const App = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Cостояния для параметров стола
  const thickness = 40
  const [height, setHeight] = useState(700);
  const [tableWidth, setTableWidth] = useState(1500);
  const [tableDepth, setTableDepth] = useState(800);
  const [materialColor, setMaterialColor] = useState("#c7b299"); // Коричневый
  const [currentSupports, setCurrentSupports] = useState<null | THREE.Group<THREE.Object3DEventMap>>(null)//Поддержка ножек
  const [currentSupportUrl, setCurrentSupportUrl] = useState<string>(legSupports[0].url); // URL текущих ножек


  const changeSupports = (url: string) => {
    setCurrentSupportUrl(url)
  }

  // Функция загрузки ножек
  const loadSupports = async (url: string, scene: THREE.Scene) => {
    console.log('url', url)
    const loader = new GLTFLoader();
    if (!scene) return
    try {
      // Загрузка модели ножек
      const gltf = await loader.loadAsync(url);
      const group = new THREE.Group()
      const model1 = gltf.scene;
      model1.scale.set(2000, 2000, 2000);
      const model2 = model1.clone()
      const model3 = model1.clone()
      const model4 = model1.clone()

      // Настройка модели
      model1.position.set(tableWidth / 2 - thickness, -thickness / 2, -tableDepth / 4);
      model2.position.set(tableWidth / 2 - thickness, -thickness / 2, tableDepth / 4);
      model3.position.set(-tableWidth / 2 + thickness, -thickness / 2, -tableDepth / 4);
      model4.position.set(-tableWidth / 2 + thickness, -thickness / 2, tableDepth / 4);

      group.add(model1,model2,model3,model4)
      
      // Удаляем старую
      if (currentSupports) {
        scene.remove(currentSupports as THREE.Object3D);
      }
      // Добавление ножек
      setCurrentSupports(group )
      scene.add(group);
    } catch (error) {
      console.error(`Ошибка загрузки модели: ${url}`, error);
    }
  };



  // Three.js сцена
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    // Сцена, камера и рендерер
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    
    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      20000
    ) 
    if (!cameraRef.current) {
      camera.position.set(1500, 1500, 1500)
      cameraRef.current = camera
    } else {
      camera.position.set(cameraRef.current.position.x,cameraRef.current.position.y,cameraRef.current.position.z)
    };

    const renderer = new THREE.WebGLRenderer();
    rendererRef.current = renderer


    renderer.setSize(mount.clientWidth, mount.clientHeight);
    //Управление мышью
    const orbitControl = new OrbitControls(camera, mount)

    mount.appendChild(renderer.domElement);

    // Добавление света
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1500, 3500, 1500);
    scene.add(directionalLight);

    

    // Создание стола
    const tableMaterial = new THREE.MeshStandardMaterial({ color: materialColor });
    const legMaterial = new THREE.MeshStandardMaterial({ color: "#969696" }); 
    const tableTop = new THREE.BoxGeometry(tableWidth, thickness, tableDepth);
    const tableTopMesh = new THREE.Mesh(tableTop, tableMaterial);
    tableTopMesh.position.y = height;
    scene.add(tableTopMesh);

    // Ножки стола
    const legGeometry = new THREE.BoxGeometry(thickness, height, thickness);
    const leg1 = new THREE.Mesh(legGeometry, legMaterial);
    const leg2 = new THREE.Mesh(legGeometry, legMaterial);
    const leg3 = new THREE.Mesh(legGeometry, legMaterial);
    const leg4 = new THREE.Mesh(legGeometry, legMaterial);

    // Расстановка ножек по углам
    leg1.position.set(-tableWidth / 2 + thickness, height / 2, -tableDepth / 2 + thickness);
    leg2.position.set(tableWidth / 2 - thickness, height / 2, -tableDepth / 2 + thickness);
    leg3.position.set(-tableWidth / 2 + thickness, height / 2, tableDepth / 2 - thickness);
    leg4.position.set(tableWidth / 2 - thickness, height / 2, tableDepth / 2 - thickness);

    //Поперечены
    const connectorGeometry = new THREE.BoxGeometry(thickness, thickness, tableDepth - thickness * 2);
    const connector1 = new THREE.Mesh(connectorGeometry, legMaterial);
    const connector2 = new THREE.Mesh(connectorGeometry, legMaterial);

    connector1.position.set(-tableWidth / 2 + thickness, thickness / 2, 0);
    connector2.position.set(tableWidth / 2 - thickness, thickness / 2, 0);

    scene.add(leg1, leg2, leg3, leg4, connector1, connector2);

    //init
    loadSupports(currentSupportUrl, scene);

    // Анимация
    const animate = () => {
      requestAnimationFrame(animate);
      orbitControl.update();
      renderer.render(scene, camera);
    };

    animate();

    // Очистка сцены
    return () => {
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [height, tableWidth, tableDepth, materialColor, currentSupportUrl]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Меню конфигурации */}
      <div className={styles.menu}
      >
        <h2>Настройка стола</h2>
        <label>
          Высота (mm):
          <input
            type="range"
            min="500"
            max="1200"
            step="1"
            value={height}
            onChange={(e) => setHeight(parseFloat(e.target.value))}
          />
        </label>
        <p>{height}mm</p>

        <label>
          Ширина столешницы (mm):
          <input
            type="range"
            min="1200"
            max="2400"
            step="1"
            value={tableWidth}
            onChange={(e) => setTableWidth(parseFloat(e.target.value))}
          />
        </label>
        <p>{tableWidth}mm</p>

        <label>
          Глубина столешницы (mm):
          <input
            type="range"
            min="300"
            max="900"
            step="1"
            value={tableDepth}
            onChange={(e) => setTableDepth(parseFloat(e.target.value))}
          />
        </label>
        <p>{tableDepth}mm</p>

        <label>
          Материал столешницы:
          <input
            type="color"

            value={materialColor}
            onChange={(e) => setMaterialColor(e.target.value)}
          />
        </label>
        <p>{materialColor}</p>
        <label>
          Стиль подножек:
          <select id="question" name="support" value={currentSupportUrl} onChange={(e) => changeSupports(e.target.value)}>
            {legSupports.map(item =>
              <option key={item.type} value={item.url}>{item.type}</option>
            )}
          </select>
        </label>
      </div>

      {/* Canvas для сцены */}
      <div
        ref={mountRef}
        style={{ width: "80%", height: "100%", backgroundColor: "#e0e0e0" }}
      ></div>
    </div>
  );
};

export default App;
