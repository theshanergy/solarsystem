import { Vector3 } from 'three'
import { SUN_RADIUS, SUN_MASS, SPAWN_RADIUS, GRAVITATIONAL_CONSTANT } from '../config/constants'

// Get random position either within the spawn radius or on the outside edge
export const calculateInitialPosition = (isEntry = false) => {
    const theta = Math.random() * Math.PI * 2
    const radius = isEntry ? SPAWN_RADIUS * 1.5 : Math.random() * SPAWN_RADIUS + SUN_RADIUS * 3
    const x = Math.cos(theta) * radius
    const y = Math.random() * 10
    const z = Math.sin(theta) * radius
    return new Vector3(x, y, z)
}

// Calculate the initial velocity of the planet
export const calculateInitialVelocity = (position, respawn) => {
    const radialVector = new Vector3().copy(position)
    const distance = radialVector.length()
    const orbitalSpeed = Math.sqrt((GRAVITATIONAL_CONSTANT * SUN_MASS) / distance)
    const upVector = new Vector3(0, 1, 0)
    const velocity = new Vector3().crossVectors(radialVector, upVector).normalize().multiplyScalar(orbitalSpeed).multiplyScalar(20000)

    if (respawn) {
        velocity.multiplyScalar(0.75)
    }

    return velocity
}
