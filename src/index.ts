export * from './types'
export * from './interfaces/wiseXboard'
export * from './interfaces/wiseXboardPremium'
export * from './interfaces/microbit'

import { wiseXboard } from './interfaces/wiseXboard'
import { wiseXboardPremium } from './interfaces/wiseXboardPremium'
import { microbit } from './interfaces/microbit'

export type HardwareId = 'wiseXboard' | 'wiseXboardPremium' | 'microbit'

export const hardwareDescriptors = {
    wiseXboard,
    wiseXboardPremium,
    microbit,
}
