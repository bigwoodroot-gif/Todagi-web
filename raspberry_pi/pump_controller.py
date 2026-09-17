"""
토다기 에어펌프 컨트롤러 (펌프 2개 버전)
- GPIO18 -> 릴레이 IN1 -> 1번 펌프 (active-low)
- GPIO23 -> 릴레이 IN2 -> 2번 펌프 (active-low)
- Supabase에서 앱이 보낸 명령 수신 (폴링)

명령 형식 (device_commands 테이블):
  command: "pump1_on" | "pump1_off" | "pump2_on" | "pump2_off"
           | "all_on" | "all_off"
  pressure: 0~100 (참고값)

배선 (설계도 기준):
  Raspberry Pi GPIO18 -> 릴레이 IN1 -> COM1(+V) / NO1 -> 1번 펌프(+)
  Raspberry Pi GPIO23 -> 릴레이 IN2 -> COM2(+V) / NO2 -> 2번 펌프(+)
  펌프(-) -> GND (공통)
  릴레이 VCC -> 펌프 전원 +V (5V)
  릴레이 GND -> GND (공통)

사용법:
  pip install RPi.GPIO supabase
  python pump_controller.py
"""

import os
import sys
import signal
import threading
import time
import RPi.GPIO as GPIO
from supabase import create_client

SUPABASE_URL = os.environ.get(
    "SUPABASE_URL",
    "https://clkuluartuodqyqjutbl.supabase.co",
)
SUPABASE_KEY = os.environ.get(
    "SUPABASE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsa3VsdWFydHVvZHF5cWp1dGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3OTc2ODYsImV4cCI6MjEwMjM3MzY4Nn0.SAVbhQ08C4ds3bZTZTngwP8jo7tJmnkKmDxbV09cLNo",
)

RELAY_PIN_1 = 18  # GPIO18 -> 릴레이 IN1 -> 1번 펌프
RELAY_PIN_2 = 23  # GPIO23 -> 릴레이 IN2 -> 2번 펌프
POLL_INTERVAL = 2
AUTO_OFF_SECONDS = 4.3  # 펌프 켜진 뒤 자동으로 꺼질 때까지의 시간

_auto_off_timers = {}  # pin -> threading.Timer


def setup_gpio():
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(RELAY_PIN_1, GPIO.OUT)
    GPIO.setup(RELAY_PIN_2, GPIO.OUT)
    GPIO.output(RELAY_PIN_1, GPIO.HIGH)  # HIGH = 릴레이 OFF (active-low)
    GPIO.output(RELAY_PIN_2, GPIO.HIGH)
    print("[GPIO] 초기화 완료")
    print(f"  1번 펌프: GPIO{RELAY_PIN_1} = OFF")
    print(f"  2번 펌프: GPIO{RELAY_PIN_2} = OFF")


def _cancel_auto_off(pin):
    timer = _auto_off_timers.pop(pin, None)
    if timer:
        timer.cancel()


def pump_on(pin, name):
    _cancel_auto_off(pin)
    GPIO.output(pin, GPIO.LOW)
    print(f"[PUMP] {name} ON — 작동 중 ({AUTO_OFF_SECONDS}초 후 자동 정지)")

    timer = threading.Timer(AUTO_OFF_SECONDS, pump_off, args=(pin, name))
    timer.daemon = True
    _auto_off_timers[pin] = timer
    timer.start()


def pump_off(pin, name):
    _cancel_auto_off(pin)
    GPIO.output(pin, GPIO.HIGH)
    print(f"[PUMP] {name} OFF — 정지")


def all_on():
    pump_on(RELAY_PIN_1, "1번 펌프")
    pump_on(RELAY_PIN_2, "2번 펌프")


def all_off():
    pump_off(RELAY_PIN_1, "1번 펌프")
    pump_off(RELAY_PIN_2, "2번 펌프")


def cleanup(signum=None, frame=None):
    print("\n[종료] GPIO 정리 중...")
    all_off()
    GPIO.cleanup()
    print("[종료] 완료")
    sys.exit(0)


COMMANDS = {
    "pump1_on":  lambda: pump_on(RELAY_PIN_1, "1번 펌프"),
    "pump1_off": lambda: pump_off(RELAY_PIN_1, "1번 펌프"),
    "pump2_on":  lambda: pump_on(RELAY_PIN_2, "2번 펌프"),
    "pump2_off": lambda: pump_off(RELAY_PIN_2, "2번 펌프"),
    "pump_on":   all_on,
    "pump_off":  all_off,
    "all_on":    all_on,
    "all_off":   all_off,
}


def main():
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    setup_gpio()

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print(f"[SUPABASE] 연결 완료 — {SUPABASE_URL}")
    print(f"[대기] 앱에서 명령을 기다리는 중... (폴링 간격: {POLL_INTERVAL}초)\n")

    last_command_id = None

    while True:
        try:
            result = (
                supabase.table("device_commands")
                .select("*")
                .eq("status", "pending")
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )

            if result.data:
                cmd = result.data[0]

                if cmd["id"] != last_command_id:
                    last_command_id = cmd["id"]
                    command = cmd["command"]
                    pressure = cmd.get("pressure", 0)

                    print(f"[명령 수신] {command} (압력: {pressure}%)")

                    action = COMMANDS.get(command)
                    if action:
                        action()
                    else:
                        print(f"[경고] 알 수 없는 명령: {command}")

                    supabase.table("device_commands").update(
                        {"status": "executed", "executed_at": "now()"}
                    ).eq("id", cmd["id"]).execute()

                    print(f"[완료] 명령 실행됨: {command}\n")

        except Exception as e:
            print(f"[오류] {e}")

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
