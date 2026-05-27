import type { AppData, EventItem, NeedRequest } from "../types";

const ADMIN_ID = "admin-mtu-1";
const DEMO_STUDENT_ID = "student-demo-1";

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekEvents(): EventItem[] {
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);

  return [
    {
      id: "evt-1",
      title: "Sesiune sport adaptat — deschisă",
      description: "Mișcare incluzivă pentru toate nivelurile.",
      date: addDays(monday, 2),
      time: "10:00",
      location: "Sports Arena, MTU Cork",
      hostUserId: ADMIN_ID,
      hostName: "MTU Cork",
      communityId: "com-1",
      attendeeIds: [DEMO_STUDENT_ID],
      invitations: [],
    },
    {
      id: "evt-2",
      title: "Întâlnire comunitate INGENIUM",
      description: "Prezentare proiecte studenți + cereri aprobate.",
      date: addDays(monday, 4),
      time: "18:30",
      location: "Online",
      hostUserId: ADMIN_ID,
      hostName: "MTU Cork",
      attendeeIds: [],
      invitations: [],
    },
  ];
}

const sampleNeeds: NeedRequest[] = [
  {
    id: "need-1",
    userId: "user-demo-disability",
    userName: "Alex M.",
    title: "Rampă acces la sala de sport",
    description:
      "Intrarea principală nu are rampă — am nevoie de acces cu scaun cu rotile pentru cursuri.",
    category: "infrastructure",
    status: "approved",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "need-2",
    userId: "user-demo-disability",
    userName: "Alex M.",
    title: "Suport pentru rachetă de tenis",
    description:
      "Adaptare care permite fixarea rachetei pentru jucător cu mobilitate limitată la mână.",
    category: "equipment",
    status: "in_project",
    projectId: "proj-1",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export function createSeedData(): AppData {
  const events = weekEvents();

  return {
    version: 2,
    events,
    communities: [
      {
        id: "com-1",
        name: "Sport & incluziune MTU",
        description: "Comunitate oficială — evenimente și proiecte studenți.",
        creatorId: ADMIN_ID,
        creatorName: "MTU Cork",
        memberIds: [ADMIN_ID, DEMO_STUDENT_ID],
      },
      {
        id: "com-2",
        name: "Vocea accesibilității",
        description: "Discuții despre cereri, infrastructură și echipamente adaptate.",
        creatorId: "user-demo-disability",
        creatorName: "Alex M.",
        memberIds: ["user-demo-disability"],
      },
    ],
    needRequests: sampleNeeds,
    projects: [
      {
        id: "proj-1",
        needRequestId: "need-2",
        title: "Proiect: suport rachetă tenis adaptat",
        description:
          "Studenți din Design & Engineering colaborează la prototip. Credite facultate.",
        facultyTags: ["Design", "Engineering"],
        studentIds: [DEMO_STUDENT_ID],
        status: "active",
        createdByAdminId: ADMIN_ID,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
    users: [
      {
        id: ADMIN_ID,
        name: "MTU Cork Admin",
        email: "admin@mtucork.ie",
        password: "admin123",
        roles: ["mtu_admin", "citizen"],
        isVolunteer: false,
        joinedCommunityIds: ["com-1"],
        registeredEventIds: [],
        friendIds: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: DEMO_STUDENT_ID,
        name: "Sara (Student)",
        email: "student@mtucork.ie",
        password: "student123",
        roles: ["citizen", "student"],
        isVolunteer: true,
        joinedCommunityIds: ["com-1"],
        registeredEventIds: ["evt-1"],
        friendIds: ["user-demo-disability"],
        createdAt: new Date().toISOString(),
      },
      {
        id: "user-demo-disability",
        name: "Alex M.",
        email: "alex@demo.ie",
        password: "demo123",
        roles: ["citizen", "disability"],
        isVolunteer: false,
        joinedCommunityIds: ["com-2"],
        registeredEventIds: [],
        friendIds: [DEMO_STUDENT_ID],
        createdAt: new Date().toISOString(),
      },
    ],
    roleRequests: [],
    conversations: [],
    messages: [],
    currentUserId: null,
  };
}
