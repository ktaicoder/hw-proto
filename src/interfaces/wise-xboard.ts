import { IHwControl } from '../types'

/**
 * 컨트롤 인터페이스 - 클라이언트(ex: 블록코딩)에서 사용
 * 클라이언트는 이 인터페이스를 Proxy 하여 RPC 처럼 호출
 */
export interface IWiseXboardControl extends IHwControl {
    analogRead(): Promise<number[]>
    digitalRead(): Promise<number[]>
    digitalWrite(pin: number, value: number): Promise<void>
    setHumanoidMotion(index: number): Promise<void>
    dcMotorStop(): Promise<void>
    dcMotorSpeed(l1: number, r1: number, l2: number, r2: number): Promise<void>
}

export const WiseXboardCommands = [
    'analogRead',
    'digitalRead',
    'digitalWrite',
    'setHumanoidMotion',
    'dcMotorStop',
    'dcMotorSpeed',
]
