import type { NeedCategory, PlatformRole } from "../types";

export const ROLE_INFO: {
  id: PlatformRole | "guest";
  title: string;
  short: string;
}[] = [
  {
    id: "guest",
    title: "Vizitator",
    short: "Vezi evenimente, cereri aprobate și cum funcționează platforma.",
  },
  {
    id: "citizen",
    title: "Citizen",
    short: "Cont de bază — evenimente, prieteni, comunități, mesaje.",
  },
  {
    id: "disability",
    title: "Persoană cu dizabilități",
    short: "Poți trimite cereri (rampă, echipament adaptat, infrastructură).",
  },
  {
    id: "student",
    title: "Student MTU",
    short: "Implicat în proiecte după aprobare — credite facultate.",
  },
  {
    id: "mtu_admin",
    title: "MTU Cork (administrator)",
    short: "Aprobă cereri, creează proiecte, implică studenți.",
  },
  {
    id: "volunteer",
    title: "Voluntar",
    short: "Sprijin la evenimente și în comunități.",
  },
];

export const ROLE_LABELS: Record<PlatformRole, string> = {
  citizen: "Citizen",
  student: "Student",
  disability: "Persoană cu dizabilități",
  volunteer: "Voluntar",
  mtu_admin: "MTU Cork Admin",
};

export const NEED_CATEGORY_LABELS: Record<NeedCategory, string> = {
  infrastructure: "Infrastructură",
  equipment: "Echipament adaptat",
  other: "Altele",
};

export const NEED_STATUS_LABELS: Record<string, string> = {
  pending: "În așteptare",
  approved: "Aprobat",
  rejected: "Respins",
  in_project: "În proiect",
  completed: "Finalizat",
};
