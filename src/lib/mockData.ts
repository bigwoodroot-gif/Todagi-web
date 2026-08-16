export interface BiometricReading {
  timestamp: number;
  heartRate: number;
  stressLevel: number;
  temperature: number;
  spO2: number;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  priority: number;
  avatar: string;
}

export interface Alert {
  id: string;
  type: "warning" | "danger" | "info" | "success";
  message: string;
  timestamp: number;
}

export const mockContacts: Contact[] = [
  {
    id: "1",
    name: "김민수",
    phone: "010-1234-5678",
    relation: "아버지",
    priority: 1,
    avatar: "KM",
  },
  {
    id: "2",
    name: "이지은",
    phone: "010-9876-5432",
    relation: "어머니",
    priority: 2,
    avatar: "LJ",
  },
  {
    id: "3",
    name: "박서연",
    phone: "010-5555-1234",
    relation: "담당 치료사",
    priority: 3,
    avatar: "PS",
  },
  {
    id: "4",
    name: "최준호",
    phone: "010-7777-8888",
    relation: "담당 의사",
    priority: 4,
    avatar: "CJ",
  },
];

export function generateBiometricHistory(
  hours: number,
  intervalMinutes: number = 5
): BiometricReading[] {
  const readings: BiometricReading[] = [];
  const now = Date.now();
  const totalPoints = (hours * 60) / intervalMinutes;

  for (let i = totalPoints; i >= 0; i--) {
    const timestamp = now - i * intervalMinutes * 60 * 1000;
    const timeOfDay = new Date(timestamp).getHours();
    const isActive = timeOfDay >= 8 && timeOfDay <= 20;

    const baseHR = isActive ? 82 : 68;
    const stressWave = Math.sin((i / totalPoints) * Math.PI * 6) * 15;
    const noise = () => (Math.random() - 0.5) * 8;

    readings.push({
      timestamp,
      heartRate: Math.round(
        Math.max(55, Math.min(130, baseHR + stressWave + noise()))
      ),
      stressLevel: Math.round(
        Math.max(
          0,
          Math.min(100, 35 + stressWave * 1.5 + noise() * 2)
        )
      ),
      temperature: Math.round(
        (36.2 + Math.sin((i / totalPoints) * Math.PI * 2) * 0.5 + (Math.random() - 0.5) * 0.3) * 10
      ) / 10,
      spO2: Math.round(
        Math.max(94, Math.min(100, 97.5 + (Math.random() - 0.5) * 2))
      ),
    });
  }

  return readings;
}

export const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "warning",
    message: "스트레스 수치가 상승 중입니다 (72/100)",
    timestamp: Date.now() - 5 * 60 * 1000,
  },
  {
    id: "2",
    type: "success",
    message: "에어백 압박이 적용되어 안정화되었습니다",
    timestamp: Date.now() - 12 * 60 * 1000,
  },
  {
    id: "3",
    type: "info",
    message: "토다기 조끼 배터리 85% 충전됨",
    timestamp: Date.now() - 30 * 60 * 1000,
  },
  {
    id: "4",
    type: "danger",
    message: "심박수 급상승 감지 (125 BPM)",
    timestamp: Date.now() - 45 * 60 * 1000,
  },
  {
    id: "5",
    type: "success",
    message: "스마트워치 연결 완료",
    timestamp: Date.now() - 60 * 60 * 1000,
  },
];

export function getStressLabel(level: number): {
  label: string;
  color: string;
} {
  if (level < 30) return { label: "안정", color: "#10b981" };
  if (level < 50) return { label: "보통", color: "#f59e0b" };
  if (level < 70) return { label: "주의", color: "#f97316" };
  return { label: "위험", color: "#ef4444" };
}

export function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}
