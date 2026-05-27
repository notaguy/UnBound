import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AppData,
  EventItem,
  NeedCategory,
  NeedRequest,
  PlatformRole,
  Project,
  RequestableRole,
  RoleRequest,
  User,
} from "../types";
import { loadAppData, saveAppData } from "../lib/storage";
import { isDateInWeek } from "../lib/week";

type Result = { ok: boolean; error?: string };

type AppContextValue = {
  data: AppData;
  currentUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  weeklyEvents: EventItem[];
  publicApprovedNeeds: NeedRequest[];
  register: (name: string, email: string, password: string) => Result;
  login: (email: string, password: string) => Result;
  logout: () => void;
  registerForEvent: (eventId: string) => Result;
  inviteFriendToEvent: (eventId: string, friendId: string) => Result;
  respondToEventInvite: (eventId: string, accept: boolean) => Result;
  requestRole: (role: RequestableRole, message?: string) => Result;
  joinCommunity: (communityId: string) => Result;
  leaveCommunity: (communityId: string) => void;
  setVolunteer: (active: boolean) => void;
  submitNeedRequest: (
    title: string,
    description: string,
    category: NeedCategory,
    imageDataUrl?: string
  ) => Result;
  approveNeed: (needId: string, note?: string) => Result;
  rejectNeed: (needId: string, note?: string) => Result;
  createProjectFromNeed: (
    needId: string,
    title: string,
    description: string,
    faculties: string
  ) => Result;
  assignStudentToProject: (projectId: string, studentUserId: string) => Result;
  approveRoleRequest: (requestId: string) => Result;
  rejectRoleRequest: (requestId: string) => Result;
  addFriend: (userId: string) => Result;
  removeFriend: (userId: string) => void;
  sendMessage: (friendId: string, body: string) => Result;
  getConversationMessages: (friendId: string) => import("../types").Message[];
  getFriends: () => User[];
  getDiscoverableUsers: () => User[];
  getUserNeeds: () => NeedRequest[];
  getPendingNeeds: () => NeedRequest[];
  getUserRoleRequests: () => RoleRequest[];
  getFriendEvents: () => EventItem[];
  getMyProjects: () => Project[];
  getInvitationsForMe: () => { event: EventItem; status: import("../types").InviteStatus }[];
};

const AppContext = createContext<AppContextValue | null>(null);

function uid(): string {
  return crypto.randomUUID();
}

function conversationKey(a: string, b: string): string[] {
  return [a, b].sort();
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadAppData());

  const persist = useCallback((next: AppData) => {
    setData(next);
    saveAppData(next);
  }, []);

  const currentUser = useMemo(
    () => data.users.find((u) => u.id === data.currentUserId) ?? null,
    [data.users, data.currentUserId]
  );

  const isAdmin = !!currentUser?.roles.includes("mtu_admin");

  const weeklyEvents = useMemo(
    () =>
      [...data.events]
        .filter((e) => isDateInWeek(e.date))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [data.events]
  );

  const publicApprovedNeeds = useMemo(
    () =>
      data.needRequests.filter(
        (n) => n.status === "approved" || n.status === "in_project" || n.status === "completed"
      ),
    [data.needRequests]
  );

  const register = useCallback(
    (name: string, email: string, password: string): Result => {
      const trimmedEmail = email.trim().toLowerCase();
      if (data.users.some((u) => u.email === trimmedEmail)) {
        return { ok: false, error: "Există deja un cont cu acest email." };
      }
      const user: User = {
        id: uid(),
        name: name.trim(),
        email: trimmedEmail,
        password,
        roles: ["citizen"],
        isVolunteer: false,
        joinedCommunityIds: [],
        registeredEventIds: [],
        friendIds: [],
        createdAt: new Date().toISOString(),
      };
      persist({ ...data, users: [...data.users, user], currentUserId: user.id });
      return { ok: true };
    },
    [data, persist]
  );

  const login = useCallback(
    (email: string, password: string): Result => {
      const user = data.users.find(
        (u) => u.email === email.trim().toLowerCase() && u.password === password
      );
      if (!user) return { ok: false, error: "Email sau parolă incorectă." };
      persist({ ...data, currentUserId: user.id });
      return { ok: true };
    },
    [data, persist]
  );

  const logout = useCallback(() => {
    persist({ ...data, currentUserId: null });
  }, [data, persist]);

  const updateUser = useCallback(
    (userId: string, updater: (u: User) => User) => {
      persist({
        ...data,
        users: data.users.map((u) => (u.id === userId ? updater(u) : u)),
      });
    },
    [data, persist]
  );

  const updateEvents = useCallback(
    (updater: (events: EventItem[]) => EventItem[]) => {
      persist({ ...data, events: updater(data.events) });
    },
    [data, persist]
  );

  const registerForEvent = useCallback(
    (eventId: string): Result => {
      if (!currentUser) {
        return { ok: false, error: "Trebuie cont pentru înscriere." };
      }
      if (currentUser.registeredEventIds.includes(eventId)) {
        return { ok: false, error: "Ești deja înscris." };
      }
      updateUser(currentUser.id, (u) => ({
        ...u,
        registeredEventIds: [...u.registeredEventIds, eventId],
      }));
      updateEvents((events) =>
        events.map((e) =>
          e.id === eventId && !e.attendeeIds.includes(currentUser.id)
            ? { ...e, attendeeIds: [...e.attendeeIds, currentUser.id] }
            : e
        )
      );
      return { ok: true };
    },
    [currentUser, updateUser, updateEvents]
  );

  const inviteFriendToEvent = useCallback(
    (eventId: string, friendId: string): Result => {
      if (!currentUser) return { ok: false, error: "Autentificare necesară." };
      if (!currentUser.friendIds.includes(friendId)) {
        return { ok: false, error: "Poți invita doar prieteni." };
      }
      const event = data.events.find((e) => e.id === eventId);
      if (!event) return { ok: false, error: "Eveniment negăsit." };
      if (event.invitations.some((i) => i.userId === friendId)) {
        return { ok: false, error: "Prietenul a fost deja invitat." };
      }
      updateEvents((events) =>
        events.map((e) =>
          e.id === eventId
            ? {
                ...e,
                invitations: [...e.invitations, { userId: friendId, status: "pending" }],
              }
            : e
        )
      );
      return { ok: true };
    },
    [currentUser, data.events, updateEvents]
  );

  const respondToEventInvite = useCallback(
    (eventId: string, accept: boolean): Result => {
      if (!currentUser) return { ok: false, error: "Autentificare necesară." };
      const status = accept ? "accepted" : "declined";
      updateEvents((events) =>
        events.map((e) => {
          if (e.id !== eventId) return e;
          return {
            ...e,
            invitations: e.invitations.map((i) =>
              i.userId === currentUser.id ? { ...i, status } : i
            ),
          };
        })
      );
      if (accept) {
        updateUser(currentUser.id, (u) => ({
          ...u,
          registeredEventIds: u.registeredEventIds.includes(eventId)
            ? u.registeredEventIds
            : [...u.registeredEventIds, eventId],
        }));
        updateEvents((events) =>
          events.map((e) =>
            e.id === eventId && !e.attendeeIds.includes(currentUser.id)
              ? { ...e, attendeeIds: [...e.attendeeIds, currentUser.id] }
              : e
          )
        );
      }
      return { ok: true };
    },
    [currentUser, updateEvents, updateUser]
  );

  const requestRole = useCallback(
    (role: RequestableRole, message?: string): Result => {
      if (!currentUser) return { ok: false, error: "Autentificare necesară." };
      if (currentUser.roles.includes(role)) {
        return { ok: false, error: "Ai deja acest rol." };
      }
      if (
        data.roleRequests.some(
          (r) => r.userId === currentUser.id && r.role === role && r.status === "pending"
        )
      ) {
        return { ok: false, error: "Cerere deja în așteptare." };
      }
      const req: RoleRequest = {
        id: uid(),
        userId: currentUser.id,
        role,
        status: "pending",
        message: message?.trim(),
        createdAt: new Date().toISOString(),
      };
      persist({ ...data, roleRequests: [...data.roleRequests, req] });
      return { ok: true };
    },
    [currentUser, data, persist]
  );

  const joinCommunity = useCallback(
    (communityId: string): Result => {
      if (!currentUser) return { ok: false, error: "Autentificare necesară." };
      if (currentUser.joinedCommunityIds.includes(communityId)) {
        return { ok: false, error: "Ești deja membru." };
      }
      persist({
        ...data,
        communities: data.communities.map((c) =>
          c.id === communityId && !c.memberIds.includes(currentUser.id)
            ? { ...c, memberIds: [...c.memberIds, currentUser.id] }
            : c
        ),
        users: data.users.map((u) =>
          u.id === currentUser.id
            ? { ...u, joinedCommunityIds: [...u.joinedCommunityIds, communityId] }
            : u
        ),
      });
      return { ok: true };
    },
    [currentUser, data, persist]
  );

  const leaveCommunity = useCallback(
    (communityId: string) => {
      if (!currentUser) return;
      updateUser(currentUser.id, (u) => ({
        ...u,
        joinedCommunityIds: u.joinedCommunityIds.filter((id) => id !== communityId),
      }));
      persist({
        ...data,
        communities: data.communities.map((c) =>
          c.id === communityId
            ? { ...c, memberIds: c.memberIds.filter((id) => id !== currentUser.id) }
            : c
        ),
      });
    },
    [currentUser, data, persist, updateUser]
  );

  const setVolunteer = useCallback(
    (active: boolean) => {
      if (!currentUser) return;
      updateUser(currentUser.id, (u) => {
        const roles: PlatformRole[] = active
          ? u.roles.includes("volunteer")
            ? u.roles
            : [...u.roles, "volunteer"]
          : u.roles.filter((r) => r !== "volunteer");
        return { ...u, isVolunteer: active, roles };
      });
    },
    [currentUser, updateUser]
  );

  const submitNeedRequest = useCallback(
    (
      title: string,
      description: string,
      category: NeedCategory,
      imageDataUrl?: string
    ): Result => {
      if (!currentUser) return { ok: false, error: "Autentificare necesară." };
      if (!currentUser.roles.includes("disability")) {
        return {
          ok: false,
          error:
            "Pentru cereri de accesibilitate ai nevoie de rolul „Persoană cu dizabilități”. Cere-l din panou.",
        };
      }
      const need: NeedRequest = {
        id: uid(),
        userId: currentUser.id,
        userName: currentUser.name,
        title: title.trim(),
        description: description.trim(),
        category,
        imageDataUrl,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      persist({ ...data, needRequests: [...data.needRequests, need] });
      return { ok: true };
    },
    [currentUser, data, persist]
  );

  const approveNeed = useCallback(
    (needId: string, note?: string): Result => {
      if (!isAdmin) return { ok: false, error: "Doar MTU Cork poate aproba." };
      persist({
        ...data,
        needRequests: data.needRequests.map((n) =>
          n.id === needId ? { ...n, status: "approved", adminNote: note } : n
        ),
      });
      return { ok: true };
    },
    [isAdmin, data, persist]
  );

  const rejectNeed = useCallback(
    (needId: string, note?: string): Result => {
      if (!isAdmin) return { ok: false, error: "Doar MTU Cork poate respinge." };
      persist({
        ...data,
        needRequests: data.needRequests.map((n) =>
          n.id === needId ? { ...n, status: "rejected", adminNote: note } : n
        ),
      });
      return { ok: true };
    },
    [isAdmin, data, persist]
  );

  const createProjectFromNeed = useCallback(
    (needId: string, title: string, description: string, faculties: string): Result => {
      if (!isAdmin || !currentUser) {
        return { ok: false, error: "Doar administratorii MTU Cork." };
      }
      const need = data.needRequests.find((n) => n.id === needId);
      if (!need || need.status !== "approved") {
        return { ok: false, error: "Cererea trebuie să fie aprobată mai întâi." };
      }
      const project: Project = {
        id: uid(),
        needRequestId: needId,
        title: title.trim(),
        description: description.trim(),
        facultyTags: faculties.split(",").map((f) => f.trim()).filter(Boolean),
        studentIds: [],
        status: "planning",
        createdByAdminId: currentUser.id,
        createdAt: new Date().toISOString(),
      };
      persist({
        ...data,
        projects: [...data.projects, project],
        needRequests: data.needRequests.map((n) =>
          n.id === needId ? { ...n, status: "in_project", projectId: project.id } : n
        ),
      });
      return { ok: true };
    },
    [isAdmin, currentUser, data, persist]
  );

  const assignStudentToProject = useCallback(
    (projectId: string, studentUserId: string): Result => {
      if (!isAdmin) return { ok: false, error: "Doar administratorii." };
      const student = data.users.find((u) => u.id === studentUserId);
      if (!student?.roles.includes("student")) {
        return { ok: false, error: "Utilizatorul trebuie să aibă rol Student." };
      }
      persist({
        ...data,
        projects: data.projects.map((p) =>
          p.id === projectId && !p.studentIds.includes(studentUserId)
            ? { ...p, studentIds: [...p.studentIds, studentUserId], status: "active" as const }
            : p
        ),
      });
      return { ok: true };
    },
    [isAdmin, data, persist]
  );

  const approveRoleRequest = useCallback(
    (requestId: string): Result => {
      if (!isAdmin) return { ok: false, error: "Doar administratorii." };
      const req = data.roleRequests.find((r) => r.id === requestId);
      if (!req) return { ok: false, error: "Cerere negăsită." };
      persist({
        ...data,
        roleRequests: data.roleRequests.map((r) =>
          r.id === requestId ? { ...r, status: "approved" } : r
        ),
        users: data.users.map((u) =>
          u.id === req.userId && !u.roles.includes(req.role)
            ? { ...u, roles: [...u.roles, req.role] }
            : u
        ),
      });
      return { ok: true };
    },
    [isAdmin, data, persist]
  );

  const rejectRoleRequest = useCallback(
    (requestId: string): Result => {
      if (!isAdmin) return { ok: false, error: "Doar administratorii." };
      persist({
        ...data,
        roleRequests: data.roleRequests.map((r) =>
          r.id === requestId ? { ...r, status: "rejected" } : r
        ),
      });
      return { ok: true };
    },
    [isAdmin, data, persist]
  );

  const addFriend = useCallback(
    (userId: string): Result => {
      if (!currentUser) return { ok: false, error: "Autentificare necesară." };
      if (userId === currentUser.id) {
        return { ok: false, error: "Nu te poți adăuga pe tine." };
      }
      if (currentUser.friendIds.includes(userId)) {
        return { ok: false, error: "Sunteți deja prieteni." };
      }
      const other = data.users.find((u) => u.id === userId);
      if (!other) return { ok: false, error: "Utilizator negăsit." };
      persist({
        ...data,
        users: data.users.map((u) => {
          if (u.id === currentUser.id) {
            return { ...u, friendIds: [...u.friendIds, userId] };
          }
          if (u.id === userId) {
            return { ...u, friendIds: [...u.friendIds, currentUser.id] };
          }
          return u;
        }),
      });
      return { ok: true };
    },
    [currentUser, data, persist]
  );

  const removeFriend = useCallback(
    (userId: string) => {
      if (!currentUser) return;
      persist({
        ...data,
        users: data.users.map((u) => ({
          ...u,
          friendIds: u.friendIds.filter(
            (id) =>
              !(u.id === currentUser.id && id === userId) &&
              !(u.id === userId && id === currentUser.id)
          ),
        })),
      });
    },
    [currentUser, data, persist]
  );

  const sendMessage = useCallback(
    (friendId: string, body: string): Result => {
      if (!currentUser) return { ok: false, error: "Autentificare necesară." };
      if (!currentUser.friendIds.includes(friendId)) {
        return { ok: false, error: "Poți scrie doar prietenilor." };
      }
      const trimmed = body.trim();
      if (!trimmed) return { ok: false, error: "Mesaj gol." };
      const participants = conversationKey(currentUser.id, friendId);
      let conv = data.conversations.find(
        (c) =>
          c.participantIds.length === 2 &&
          c.participantIds.every((id) => participants.includes(id))
      );
      const now = new Date().toISOString();
      let conversations = data.conversations;
      if (!conv) {
        conv = { id: uid(), participantIds: participants, lastMessageAt: now };
        conversations = [...conversations, conv];
      } else {
        conversations = conversations.map((c) =>
          c.id === conv!.id ? { ...c, lastMessageAt: now } : c
        );
      }
      const msg = {
        id: uid(),
        conversationId: conv.id,
        senderId: currentUser.id,
        body: trimmed,
        createdAt: now,
      };
      persist({
        ...data,
        conversations,
        messages: [...data.messages, msg],
      });
      return { ok: true };
    },
    [currentUser, data, persist]
  );

  const getConversationMessages = useCallback(
    (friendId: string) => {
      if (!currentUser) return [];
      const participants = conversationKey(currentUser.id, friendId);
      const conv = data.conversations.find(
        (c) =>
          c.participantIds.length === 2 &&
          c.participantIds.every((id) => participants.includes(id))
      );
      if (!conv) return [];
      return data.messages
        .filter((m) => m.conversationId === conv.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    [currentUser, data.conversations, data.messages]
  );

  const getFriends = useCallback(() => {
    if (!currentUser) return [];
    return data.users.filter((u) => currentUser.friendIds.includes(u.id));
  }, [currentUser, data.users]);

  const getDiscoverableUsers = useCallback(() => {
    if (!currentUser) return [];
    return data.users.filter(
      (u) => u.id !== currentUser.id && !currentUser.friendIds.includes(u.id)
    );
  }, [currentUser, data.users]);

  const getUserNeeds = useCallback(() => {
    if (!currentUser) return [];
    return data.needRequests.filter((n) => n.userId === currentUser.id);
  }, [currentUser, data.needRequests]);

  const getPendingNeeds = useCallback(
    () => data.needRequests.filter((n) => n.status === "pending"),
    [data.needRequests]
  );

  const getUserRoleRequests = useCallback(() => {
    if (!currentUser) return [];
    return data.roleRequests.filter((r) => r.userId === currentUser.id);
  }, [currentUser, data.roleRequests]);

  const getFriendEvents = useCallback(() => {
    if (!currentUser) return [];
    const friendIds = currentUser.friendIds;
    return data.events.filter(
      (e) =>
        friendIds.some((fid) => e.attendeeIds.includes(fid) || e.hostUserId === fid) &&
        isDateInWeek(e.date)
    );
  }, [currentUser, data.events]);

  const getMyProjects = useCallback(() => {
    if (!currentUser) return [];
    if (isAdmin) return data.projects;
    if (currentUser.roles.includes("student")) {
      return data.projects.filter((p) => p.studentIds.includes(currentUser.id));
    }
    return data.projects.filter((p) => {
      const need = data.needRequests.find((n) => n.id === p.needRequestId);
      return need?.userId === currentUser.id;
    });
  }, [currentUser, isAdmin, data.projects, data.needRequests]);

  const getInvitationsForMe = useCallback(() => {
    if (!currentUser) return [];
    return data.events
      .flatMap((e) => {
        const inv = e.invitations.find((i) => i.userId === currentUser.id);
        return inv ? [{ event: e, status: inv.status }] : [];
      })
      .filter(Boolean);
  }, [currentUser, data.events]);

  const value: AppContextValue = {
    data,
    currentUser,
    isAuthenticated: !!currentUser,
    isAdmin,
    weeklyEvents,
    publicApprovedNeeds,
    register,
    login,
    logout,
    registerForEvent,
    inviteFriendToEvent,
    respondToEventInvite,
    requestRole,
    joinCommunity,
    leaveCommunity,
    setVolunteer,
    submitNeedRequest,
    approveNeed,
    rejectNeed,
    createProjectFromNeed,
    assignStudentToProject,
    approveRoleRequest,
    rejectRoleRequest,
    addFriend,
    removeFriend,
    sendMessage,
    getConversationMessages,
    getFriends,
    getDiscoverableUsers,
    getUserNeeds,
    getPendingNeeds,
    getUserRoleRequests,
    getFriendEvents,
    getMyProjects,
    getInvitationsForMe,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
