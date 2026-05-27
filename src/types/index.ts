export type RequestableRole = "student" | "disability";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type PlatformRole =
  | "citizen"
  | "student"
  | "disability"
  | "volunteer"
  | "mtu_admin";

export type NeedCategory = "infrastructure" | "equipment" | "other";

export type NeedStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "in_project"
  | "completed";

export type ProjectStatus = "planning" | "active" | "completed";

export type InviteStatus = "pending" | "accepted" | "declined";

export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  roles: PlatformRole[];
  isVolunteer: boolean;
  joinedCommunityIds: string[];
  registeredEventIds: string[];
  friendIds: string[];
  createdAt: string;
};

export type RoleRequest = {
  id: string;
  userId: string;
  role: RequestableRole;
  status: ApprovalStatus;
  message?: string;
  createdAt: string;
};

/** Cerere de accesibilitate (rampă, echipament adaptat, etc.) */
export type NeedRequest = {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  category: NeedCategory;
  imageDataUrl?: string;
  status: NeedStatus;
  adminNote?: string;
  projectId?: string;
  createdAt: string;
};

/** Proiect creat de MTU Cork după aprobarea unei cereri */
export type Project = {
  id: string;
  needRequestId: string;
  title: string;
  description: string;
  facultyTags: string[];
  studentIds: string[];
  status: ProjectStatus;
  createdByAdminId: string;
  createdAt: string;
};

export type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  hostUserId: string;
  hostName: string;
  communityId?: string;
  attendeeIds: string[];
  invitations: { userId: string; status: InviteStatus }[];
};

export type Community = {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName: string;
  memberIds: string[];
};

export type Conversation = {
  id: string;
  participantIds: string[];
  lastMessageAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type AppData = {
  version: 2;
  events: EventItem[];
  communities: Community[];
  needRequests: NeedRequest[];
  projects: Project[];
  users: User[];
  roleRequests: RoleRequest[];
  conversations: Conversation[];
  messages: Message[];
  currentUserId: string | null;
};
