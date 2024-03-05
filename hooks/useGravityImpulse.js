import { useFrame } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import { Vector3 } from 'three'

const useGravityImpulse = (scaleFactor = 0.0001) => {
    const { world } = useRapier()
    const gravitationalConstant = 6.6743e-11 // Universal gravitational constant

    useFrame(() => {
        if (!world) return

        const impulseVector = new Vector3()

        world.bodies.forEach((currentBody) => {
            if (currentBody.isSleeping()) return

            const currentMass = currentBody.mass()
            const currentPosition = currentBody.translation()
            const currentPositionVector = new Vector3(currentPosition.x, currentPosition.y, currentPosition.z)

            world.bodies.forEach((otherBody) => {
                if (currentBody === otherBody || otherBody.isSleeping()) return

                const otherMass = otherBody.mass()
                const otherPosition = otherBody.translation()
                const otherPositionVector = new Vector3(otherPosition.x, otherPosition.y, otherPosition.z)

                const distance = currentPositionVector.distanceTo(otherPositionVector)

                if (distance === 0) return

                const force = (gravitationalConstant * currentMass * otherMass) / Math.pow(distance * scaleFactor, 2)
                impulseVector.subVectors(otherPositionVector, currentPositionVector).normalize().multiplyScalar(force)
                currentBody.applyImpulse(impulseVector, true)
            })
        })
    })
}

export default useGravityImpulse
