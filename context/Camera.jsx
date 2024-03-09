import { createContext, useContext, useState, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3, Matrix4 } from 'three'

const CameraContext = createContext()

export const useCamera = () => useContext(CameraContext)

export const CameraProvider = ({ children }) => {
    const { camera, controls } = useThree()
    const cameraTarget = useRef(new Vector3())
    const [focusedObject, setFocusedObject] = useState(null)

    useFrame(() => {
        if (focusedObject) {
            let target

            if (focusedObject.instanceId !== undefined) {
                const instanceMatrix = new Matrix4()
                focusedObject.object.getMatrixAt(focusedObject.instanceId, instanceMatrix)
                target = new Vector3().setFromMatrixPosition(instanceMatrix)
            } else {
                target = focusedObject.object.position.clone()
            }

            const smoothness = 0.05
            cameraTarget.current.lerp(target, smoothness)
            camera.lookAt(cameraTarget.current)

            controls.target.copy(cameraTarget.current)
            controls.update()
        }
    })

    // Handle focus
    const handleFocus = (event) => {
        const object = event.object
        const instanceId = event.instanceId

        if (instanceId !== undefined) {
            setFocusedObject({ object, instanceId })
        } else {
            setFocusedObject({ object })
        }
    }

    return <CameraContext.Provider value={{ focusedObject, handleFocus }}>{children}</CameraContext.Provider>
}
