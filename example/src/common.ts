export type KitProtocolRequest = {
    type: string
    data?: any
}

export type KitProtocolResponse = {
    Type: string
    Data: any | undefined
}

export type KitGpioPinNumber = 7 | 11 | 13 | 15 | 16 | 18

export type KitGpioHighLow = 1 | 0

export type KitGpioPinData = {
    pin: number
    value: boolean
}
