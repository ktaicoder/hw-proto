export * from './types'
export * from './interfaces/wise-xboard'
export * from './interfaces/microbit'

import { wiseXboard } from './interfaces/wise-xboard'
import { microbit } from './interfaces/microbit'

export type HardwareId = 'wiseXboard' | 'microbit'

export const hardwareDescriptors = {
    wiseXboard,
    microbit,
}
