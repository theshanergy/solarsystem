import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'

const useObjectSelect = () => {
    const { controls, camera, raycaster, scene, mouse } = useThree()

    const cameraTarget = useRef(new Vector3())

    const [activeObject, setActiveObject] = useState(null)

    useEffect(() => {
        const onClick = (event) => {
            // Update the picking ray with the camera and mouse position
            raycaster.setFromCamera(mouse, camera)

            // Calculate objects intersecting the picking ray
            const intersects = raycaster.intersectObjects(scene.children, true)

            if (intersects.length > 0) {
                // Assuming the first intersected object is the one we're interested in
                const object = intersects[0].object

                if (object.userData.type === 'Planet' || object.userData.type === 'Sun') {
                    setActiveObject(object)
                }
            }
        }

        // Add event listener
        window.addEventListener('click', onClick)

        return () => {
            window.removeEventListener('click', onClick)
        }
    }, [camera, mouse, raycaster, scene.children])

    useFrame(() => {
        if (activeObject) {
            // Smoothly move the camera target to the active object
            const target = new Vector3().copy(activeObject.position)
            const smoothness = 0.05
            cameraTarget.current.lerp(target, smoothness)
            camera.lookAt(cameraTarget.current)
        }
    })
}

export default useObjectSelect
