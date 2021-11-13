import { HardwareDescriptor, IHwControl } from '../types'

/**
 * 컨트롤 인터페이스 - 클라이언트(ex: 블록코딩)에서 사용
 * 클라이언트는 이 인터페이스를 Proxy 하여 RPC 처럼 호출
 */
export interface IMicrobitControl extends IHwControl {
    analogRead(): Promise<number[]>
}

/**
 * 하드웨어 디스크립터
 * 변수 이름을 HwId로 해야 함
 */
export const microbit: HardwareDescriptor = {
    commands: ['analogRead'],
}
