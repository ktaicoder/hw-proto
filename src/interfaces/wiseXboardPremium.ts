import { HardwareDescriptor, IHwControl } from '../types'

/**
 * 컨트롤 인터페이스 - 클라이언트(ex: 블록코딩)에서 사용
 * 클라이언트는 이 인터페이스를 Proxy 하여 RPC 처럼 호출
 */
export interface IWiseXboardPremiumControl extends IHwControl {
    /**
     * DC 모터1,2 속도 설정
     */
    setDCMotorSpeedP(l1: number, r1: number, l2: number, r2: number): Promise<void>

    /**
     * DC 모터2 속도 설정
     */
    setDCMotor1SpeedP(l1: number, r1: number): Promise<void>

    /**
     * DC 모터1 속도 설정
     */
    setDCMotor2SpeedP(l2: number, r2: number): Promise<void>

    /**
     * 리모콘 값 읽기
     */
    readRemoconP(): Promise<number>
    /**
     * 모든 DC 모터 끄기
     */
    stopDCMotorP(): Promise<void>

    /**
     * n번핀 서보모터 각도 angle로 정하기
     */
    setServoMotorAngleP(pinNum: number, angle: number): Promise<void>

    /**
     * 아날로그 핀 읽기
     * 다섯개의 핀값을 모두 가져온다
     */
    analogReadP(): Promise<number[]>

    /**
     * 디지털 핀 읽기
     * 다섯개의 핀값을 모두 가져온다
     */
    digitalReadP(): Promise<number[]>

    /**
     * 디지털 n번핀 value로 정하기
     */
    digitalWriteP(pin: number, value: number): Promise<void>

    /**
     * 키값 전송
     * @param pin
     * @param value
     */
    sendKeyP(pin: number, value: number): Promise<void>
}

/**
 * 하드웨어 디스크립터: commands
 * 변수이름을 hwId로 해야 함
 */
export const wiseXboardPremium: HardwareDescriptor = {
    commands: [
        'setDCMotorSpeedP', //
        'setDCMotor1SpeedP',
        'setDCMotor2SpeedP',
        'readRemoconP',
        'stopDCMotorP',
        'setServoMotorAngleP',
        'analogReadP',
        'digitalReadP',
        'digitalWriteP',
        'sendKeyP',
    ],
}
