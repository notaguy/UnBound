import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AppData,
  EventItem,
  InviteStatus,
  NeedCategory,
  NeedRequest,
  PlatformRole,
  Project,
  RequestableRole,
  RoleRequest,
  User,
  Message,
  Community,
  ApprovalStatus,
} from "../types";
import { supabase } from "../lib/supabaseClient";
import { isDateInWeek } from "../lib/week";

type Result = { ok: boolean; error?: string };

type AppContextValue = {
  data: AppData;
  currentUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  weeklyEvents: EventItem[];
  publicApprovedNeeds: NeedRequest[];
  register: (name: string, email: string, password: string) => Promise<Result>;
  login: (email: string, password: string) => Promise<Result>;
  logout: () => Promise<void>;
  registerForEvent: (eventId: string) => Promise<Result>;
  inviteFriendToEvent: (eventId: string, friendId: string) => Promise<Result>;
  respondToEventInvite: (eventId: string, accept: boolean) => Promise<Result>;
  requestRole: (role: RequestableRole, message?: string) => Promise<Result>;
  joinCommunity: (communityId: string) => Promise<Result>;
  leaveCommunity: (communityId: string) => void;
  setVolunteer: (active: boolean) => Promise<void>;
  submitNeedRequest: (
    title: string,
    description: string,
    category: NeedCategory,
    imageDataUrl?: string
  ) => Promise<Result>;
  approveNeed: (needId: string, note?: string) => Promise<Result>;
  rejectNeed: (needId: string, note?: string) => Promise<Result>;
  createProjectFromNeed: (
    needId: string,
    title: string,
    description: string,
    faculties: string
  ) => Promise<Result>;
  assignStudentToProject: (projectId: string, studentUserId: string) => Promise<Result>;
  approveRoleRequest: (requestId: string) => Promise<Result>;
  rejectRoleRequest: (requestId: string) => Promise<Result>;
  addFriend: (userId: string) => Promise<Result>;
  removeFriend: (userId: string) => Promise<void>;
  sendMessage: (friendId: string, body: string) => Promise<Result>;
  getConversationMessages: (friendId: string) => Message[];
  loadConversationMessages: (friendId: string) => Promise<void>;
  getFriends: () => User[];
  getDiscoverableUsers: () => User[];
  getUserNeeds: () => NeedRequest[];
  getPendingNeeds: () => NeedRequest[];
  getUserRoleRequests: () => RoleRequest[];
  getFriendEvents: () => EventItem[];
  getMyProjects: () => Project[];
  getInvitationsForMe: () => {
    event: EventItem;
    status: InviteStatus;
  }[];
};

const AppContext = createContext<AppContextValue | null>(null);

type EventTemplate = Pick<EventItem, "id" | "title" | "description" | "time" | "location" | "hostName" | "communityId" | "hostUserId"> & {
  daysOffsetFromMonday: number;
};

const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: "evt-1",
    title: "Sesiune sport adaptat — deschisă",
    description: "Mișcare incluzivă pentru toate nivelurile.",
    time: "10:00",
    location: "Sports Arena, MTU Cork",
    hostName: "MTU Cork",
    hostUserId: "admin-mtu-1",
    communityId: "com-1",
    daysOffsetFromMonday: 2,
  },
  {
    id: "evt-2",
    title: "Întâlnire comunitate INGENIUM",
    description: "Prezentare proiecte studenți + cereri aprobate.",
    time: "18:30",
    location: "Online",
    hostName: "MTU Cork",
    hostUserId: "admin-mtu-1",
    daysOffsetFromMonday: 4,
  },
  {
    id: "evt-3",
    title: "Basketball adaptat — probă",
    description: "Probă gratuită. Înscriere necesită cont pe platformă.",
    time: "16:00",
    location: "Arena Sport",
    hostName: "MTU Cork",
    hostUserId: "admin-mtu-1",
    communityId: "com-2",
    daysOffsetFromMonday: 6,
  },
];

function formatEventDate(date: Date): string {
  // ISO YYYY-MM-DD
  return date.toISOString().slice(0, 10);
}

function getWeekMonday(reference = new Date()): Date {
  const d = new Date(reference);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // if Sunday => last Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function computeWeeklyEvents(): EventItem[] {
  const monday = getWeekMonday();
  return EVENT_TEMPLATES.map((t) => {
    const eventDate = new Date(monday);
    eventDate.setDate(eventDate.getDate() + t.daysOffsetFromMonday);
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      date: formatEventDate(eventDate),
      time: t.time,
      location: t.location,
      hostUserId: t.hostUserId,
      hostName: t.hostName,
      communityId: t.communityId,
      attendeeIds: [],
      invitations: [],
    };
  }).filter((e) => isDateInWeek(e.date));
}

function canonicalPair(a: string, b: string): { aMin: string; aMax: string } {
  return a < b ? { aMin: a, aMax: b } : { aMin: b, aMax: a };
}

function mapNeedRequest(row: any): NeedRequest {
  return {
    id: row.id,
    userId: row.user_id ?? row.userId,
    userName: row.user_name ?? row.userName ?? row.user_id ?? "—",
    title: row.title,
    description: row.description,
    category: row.category,
    imageDataUrl: row.image_url ?? row.imageDataUrl ?? undefined,
    status: row.status,
    adminNote: row.admin_note ?? row.adminNote ?? undefined,
    projectId: row.project_id ?? row.projectId ?? undefined,
    createdAt: row.created_at ?? row.createdAt,
  };
}

function mapRoleRequest(row: any): RoleRequest {
  return {
    id: row.id,
    userId: row.user_id ?? row.userId,
    role: row.role,
    status: row.status,
    message: row.message ?? undefined,
    createdAt: row.created_at ?? row.createdAt,
  };
}

function mapProject(row: any): Project {
  return {
    id: row.id,
    needRequestId: row.need_request_id ?? row.needRequestId,
    title: row.title,
    description: row.description,
    facultyTags: row.faculty_tags ?? row.facultyTags ?? [],
    studentIds: row.student_ids ?? row.studentIds ?? [],
    status: row.status,
    createdByAdminId: row.created_by_admin_id ?? row.createdByAdminId,
    createdAt: row.created_at ?? row.createdAt,
  };
}

export function AppProviderSupabase({ children }: { children: ReactNode }) {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [discoverableUsers, setDiscoverableUsers] = useState<User[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [needRequests, setNeedRequests] = useState<NeedRequest[]>([]);
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [eventInvitations, setEventInvitations] = useState<
    Array<{ eventId: string; status: InviteStatus }>
  >([]);

  const [conversationMessages, setConversationMessages] = useState<
    Record<string, Message[]>
  >({});

  const weeklyEvents = useMemo(() => computeWeeklyEvents(), []);

  const isAuthenticated = !!sessionUserId && !!profile;
  const isAdmin = !!profile?.roles.includes("mtu_admin");

  const publicApprovedNeeds = useMemo(
    () =>
      needRequests.filter(
        (n) => n.status === "approved" || n.status === "in_project" || n.status === "completed"
      ),
    [needRequests]
  );

  const data: AppData = useMemo(
    () => ({
      version: 2,
      events: [],
      communities,
      needRequests: needRequests,
      projects,
      users: isAdmin
        ? adminUsers
        : [profile, ...friends, ...discoverableUsers].filter(
            (u): u is User => Boolean(u)
          ),
      roleRequests,
      conversations: [],
      messages: [],
      currentUserId: sessionUserId,
    }),
    [
      communities,
      needRequests,
      projects,
      profile,
      friends,
      discoverableUsers,
      roleRequests,
      sessionUserId,
      isAdmin,
      adminUsers,
    ]
  );

  // Session restore
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSessionUserId(data.session?.user?.id ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Pentru vizitatori: afișăm cereri aprobate publice.
  // (Anon key + RLS/permisiuni necesare pe `need_requests`.)
  useEffect(() => {
    if (sessionUserId) return;

    const fetchPublicNeeds = async () => {
      const { data } = await supabase
        .from("need_requests")
        .select("*")
        .in("status", ["approved", "in_project", "completed"])
        .order("created_at", { ascending: false });
      setNeedRequests((data ?? []).map(mapNeedRequest));
    };

    fetchPublicNeeds();
  }, [sessionUserId]);

  // Initial load based on auth
  useEffect(() => {
    if (!supabase) return;
    if (!sessionUserId) {
      setProfile(null);
      setFriends([]);
      setDiscoverableUsers([]);
      setCommunities([]);
      setNeedRequests([]);
      setRoleRequests([]);
      setProjects([]);
      setAdminUsers([]);
      setEventInvitations([]);
      setConversationMessages({});
      return;
    }

    const run = async () => {
      // PROFILE
      const { data: profileRow, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionUserId)
        .maybeSingle();

      if (profileErr || !profileRow) {
        setProfile(null);
        return;
      }

      // roles stored as text[] in DB
      const roles = Array.isArray(profileRow.roles) ? (profileRow.roles as PlatformRole[]) : [];

      const user: User = {
        id: profileRow.id,
        name: profileRow.name,
        email: profileRow.email,
        password: undefined,
        roles,
        isVolunteer: !!profileRow.is_volunteer,
        joinedCommunityIds: [],
        registeredEventIds: [],
        friendIds: [],
        createdAt: profileRow.created_at,
      };

      setProfile(user);

      // Load communities membership + communities list
      const { data: memberRows } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", sessionUserId);

      const joined = (memberRows ?? []).map((r: any) => r.community_id as string);

      const { data: comRows } = await supabase.from("communities").select("*");
      const coms: Community[] = (comRows ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        creatorId: r.creator_id,
        creatorName: r.creator_name ?? "—",
        memberIds: [], // optional: filled later if you want
      }));

      setCommunities(coms);
      setProfile((p) => (p ? { ...p, joinedCommunityIds: joined } : p));

      // Load friendships (MVP: interogăm întâi ids, apoi profiles)
      const { data: friendRows } = await supabase
        .from("friendships")
        .select("friend_id")
        .eq("user_id", sessionUserId)
        .eq("status", "accepted");

      const friendIdArr = Array.from(
        new Set((friendRows ?? []).map((r: any) => r.friend_id as string))
      );

      if (!friendIdArr.length) {
        setFriends([]);
      } else {
        const { data: friendProfiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", friendIdArr);

        const friendList: User[] = (friendProfiles ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          password: undefined,
          roles: Array.isArray(p.roles) ? (p.roles as PlatformRole[]) : [],
          isVolunteer: !!p.is_volunteer,
          joinedCommunityIds: [],
          registeredEventIds: [],
          friendIds: [],
          createdAt: p.created_at,
        }));

        setFriends(friendList);
      }

      // Discoverable users = all profiles minus self and minus friends
      const friendIdSet = new Set(friendIdArr);
      const { data: allProfiles } = await supabase.from("profiles").select("*");
      const discover = (allProfiles ?? [])
        .filter((p: any) => p.id !== sessionUserId && !friendIdSet.has(p.id))
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          password: undefined,
          roles: Array.isArray(p.roles) ? (p.roles as PlatformRole[]) : [],
          isVolunteer: !!p.is_volunteer,
          joinedCommunityIds: [],
          registeredEventIds: [],
          friendIds: [],
          createdAt: p.created_at,
        })) as User[];
      setDiscoverableUsers(discover);

      // Need requests
      if (roles.includes("mtu_admin")) {
        const { data: allNeeds } = await supabase
          .from("need_requests")
          .select("*")
          .order("created_at", { ascending: false });
        setNeedRequests((allNeeds ?? []).map(mapNeedRequest));

        const { data: allRoleReq } = await supabase
          .from("role_requests")
          .select("*")
          .order("created_at", { ascending: false });
        setRoleRequests((allRoleReq ?? []).map(mapRoleRequest));

        const { data: allProjects } = await supabase.from("projects").select("*");
        setProjects((allProjects ?? []).map(mapProject));

        // Pentru pagină admin: avem nevoie de toți userii (ex. studenți).
        const { data: allProfiles } = await supabase.from("profiles").select("*");
        const all: User[] = (allProfiles ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          password: undefined,
          roles: Array.isArray(p.roles) ? (p.roles as PlatformRole[]) : [],
          isVolunteer: !!p.is_volunteer,
          joinedCommunityIds: [],
          registeredEventIds: [],
          friendIds: [],
          createdAt: p.created_at,
        }));
        setAdminUsers(all);
      } else {
        const { data: myNeeds } = await supabase
          .from("need_requests")
          .select("*")
          .eq("user_id", sessionUserId)
          .order("created_at", { ascending: false });
        setNeedRequests((myNeeds ?? []).map(mapNeedRequest));

        const { data: myRoleReq } = await supabase
          .from("role_requests")
          .select("*")
          .eq("user_id", sessionUserId)
          .order("created_at", { ascending: false });
        setRoleRequests((myRoleReq ?? []).map(mapRoleRequest));

        // Projects (student or disability)
        const myRoles = new Set(roles);
          if (myRoles.has("student")) {
          const { data: myProjects } = await supabase
            .from("projects")
            .select("*")
            .contains("student_ids", [sessionUserId]);
          setProjects((myProjects ?? []).map(mapProject));
        } else if (myRoles.has("disability")) {
          // disability projects -> need_requests authored by current user
          const { data: approvedNeedIds } = await supabase
            .from("need_requests")
            .select("id")
            .eq("user_id", sessionUserId)
            .in("status", ["approved", "in_project", "completed", "pending"]);
          const ids = (approvedNeedIds ?? []).map((r: any) => r.id as string);
          if (ids.length) {
            const { data: myProjects } = await supabase
              .from("projects")
              .select("*")
              .in("need_request_id", ids);
            setProjects((myProjects ?? []).map(mapProject));
          } else {
            setProjects([]);
          }
        } else {
          setProjects([]);
        }
      }

      // Event registrations + invitations for current user
      const eventIds = weeklyEvents.map((e) => e.id);
      const { data: regs } = await supabase
        .from("event_registrations")
        .select("event_id")
        .eq("user_id", sessionUserId)
        .in("event_id", eventIds);
      const regSet = new Set((regs ?? []).map((r: any) => r.event_id as string));
      // Pentru UI: WeeklyEvents folosește currentUser.registeredEventIds
      setProfile((p) =>
        p ? { ...p, registeredEventIds: Array.from(regSet) } : p
      );

      const { data: invs } = await supabase
        .from("event_invitations")
        .select("event_id,status")
        .eq("to_user_id", sessionUserId)
        .in("event_id", eventIds);
      setEventInvitations((invs ?? []).map((r: any) => ({ eventId: r.event_id, status: r.status as InviteStatus })));
    };

    run();
  }, [sessionUserId, weeklyEvents]);

  const refetchWeeklyPersonal = useCallback(async () => {
    if (!sessionUserId) return;
    const eventIds = weeklyEvents.map((e) => e.id);
    const { data: regs } = await supabase
      .from("event_registrations")
      .select("event_id")
      .eq("user_id", sessionUserId)
      .in("event_id", eventIds);
    const regSet = new Set((regs ?? []).map((r: any) => r.event_id as string));
    setProfile((p) => (p ? { ...p, registeredEventIds: Array.from(regSet) } : p));

    const { data: invs } = await supabase
      .from("event_invitations")
      .select("event_id,status")
      .eq("to_user_id", sessionUserId)
      .in("event_id", eventIds);
    setEventInvitations(
      (invs ?? []).map((r: any) => ({
        eventId: r.event_id,
        status: r.status as InviteStatus,
      }))
    );
  }, [sessionUserId, weeklyEvents]);

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<Result> => {
      if (!supabase) return { ok: false, error: "Supabase nu e configurat." };
      const trimmedEmail = email.trim().toLowerCase();
      const cleanedName = name.trim();
      if (!cleanedName) return { ok: false, error: "Nume invalid." };

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });
      if (error || !data.user) {
        return { ok: false, error: error?.message ?? "Eroare la înregistrare." };
      }

      // Create profile row
      const { error: profErr } = await supabase.from("profiles").insert({
        id: data.user.id,
        name: cleanedName,
        email: trimmedEmail,
        roles: ["citizen"],
        is_volunteer: false,
      });
      if (profErr) return { ok: false, error: profErr.message };
      return { ok: true };
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string): Promise<Result> => {
      if (!supabase) return { ok: false, error: "Supabase nu e configurat." };
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    []
  );

  const logout = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const getFriends = useCallback(() => friends, [friends]);
  const getDiscoverableUsers = useCallback(() => discoverableUsers, [discoverableUsers]);

  const getPendingNeeds = useCallback(() => {
    if (!isAdmin) return [];
    return needRequests.filter((n) => n.status === "pending") as NeedRequest[];
  }, [needRequests, isAdmin]);

  const registerForEvent = useCallback(
    async (eventId: string): Promise<Result> => {
      if (!supabase || !sessionUserId) {
        return { ok: false, error: "Autentificare necesară." };
      }

      const { error } = await supabase.from("event_registrations").upsert(
        {
          event_id: eventId,
          user_id: sessionUserId,
        },
        { onConflict: "event_id,user_id" }
      );

      if (error) return { ok: false, error: error.message };
      await refetchWeeklyPersonal();
      return { ok: true };
    },
    [refetchWeeklyPersonal, sessionUserId]
  );

  const inviteFriendToEvent = useCallback(
    async (eventId: string, friendId: string): Promise<Result> => {
      if (!supabase || !sessionUserId) return { ok: false, error: "Autentificare necesară." };
      // Ensure friendship accepted
      const { data: friendshipRow, error: frErr } = await supabase
        .from("friendships")
        .select("user_id,friend_id")
        .eq("user_id", sessionUserId)
        .eq("friend_id", friendId)
        .eq("status", "accepted")
        .maybeSingle();
      if (frErr) return { ok: false, error: frErr.message };
      if (!friendshipRow) return { ok: false, error: "Poți invita doar prieteni." };

      const { error } = await supabase.from("event_invitations").upsert(
        {
          event_id: eventId,
          from_user_id: sessionUserId,
          to_user_id: friendId,
          status: "pending",
        },
        { onConflict: "event_id,to_user_id" }
      );
      if (error) return { ok: false, error: error.message };
      await refetchWeeklyPersonal();
      return { ok: true };
    },
    [refetchWeeklyPersonal, sessionUserId]
  );

  const respondToEventInvite = useCallback(
    async (eventId: string, accept: boolean): Promise<Result> => {
      if (!supabase || !sessionUserId) return { ok: false, error: "Autentificare necesară." };
      const status: InviteStatus = accept ? "accepted" : "declined";

      const { error } = await supabase
        .from("event_invitations")
        .update({ status })
        .eq("event_id", eventId)
        .eq("to_user_id", sessionUserId);

      if (error) return { ok: false, error: error.message };
      if (accept) {
        const regRes = await registerForEvent(eventId);
        if (!regRes.ok) return regRes;
      } else {
        await refetchWeeklyPersonal();
      }
      return { ok: true };
    },
    [refetchWeeklyPersonal, registerForEvent, sessionUserId]
  );

  const requestRole = useCallback(
    async (role: RequestableRole, message?: string): Promise<Result> => {
      if (!supabase || !sessionUserId) return { ok: false, error: "Autentificare necesară." };
      if (!profile) return { ok: false, error: "Profil lipsă." };
      if (profile.roles.includes(role as PlatformRole)) {
        return { ok: false, error: "Ai deja acest rol." };
      }
      const { error: existErr } = await supabase
        .from("role_requests")
        .select("id")
        .eq("user_id", sessionUserId)
        .eq("role", role)
        .eq("status", "pending");
      if (existErr) {
        // not fatal
      } else {
        // We'll rely on DB constraints / additional checks in real schema
      }

      const { error } = await supabase.from("role_requests").insert({
        user_id: sessionUserId,
        role,
        status: "pending" as ApprovalStatus,
        message: message?.trim() ?? null,
      });
      if (error) return { ok: false, error: error.message };
      // refresh user's role requests on next load; for now no-op
      return { ok: true };
    },
    [profile, sessionUserId]
  );

  const submitNeedRequest = useCallback(
    async (
      title: string,
      description: string,
      category: NeedCategory,
      imageDataUrl?: string
    ): Promise<Result> => {
      if (!supabase || !sessionUserId) return { ok: false, error: "Autentificare necesară." };
      if (!profile) return { ok: false, error: "Profil lipsă." };
      if (!profile.roles.includes("disability")) {
        return {
          ok: false,
          error:
            "Pentru cereri de accesibilitate ai nevoie de rolul „Persoană cu dizabilități”. Cere-l din panou.",
        };
      }
      const { error } = await supabase.from("need_requests").insert({
        user_id: sessionUserId,
        title: title.trim(),
        description: description.trim(),
        category,
        status: "pending" as ApprovalStatus,
        image_url: imageDataUrl ?? null,
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    [profile, sessionUserId]
  );

  const approveNeed = useCallback(
    async (needId: string, note?: string): Promise<Result> => {
      if (!supabase || !sessionUserId) return { ok: false, error: "Autentificare necesară." };
      if (!isAdmin) return { ok: false, error: "Doar MTU Cork poate aproba." };

      const { error } = await supabase
        .from("need_requests")
        .update({ status: "approved", admin_note: note?.trim() ?? null })
        .eq("id", needId);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    [isAdmin, sessionUserId]
  );

  const rejectNeed = useCallback(
    async (needId: string, note?: string): Promise<Result> => {
      if (!supabase || !sessionUserId) return { ok: false, error: "Autentificare necesară." };
      if (!isAdmin) return { ok: false, error: "Doar MTU Cork poate respinge." };

      const { error } = await supabase
        .from("need_requests")
        .update({ status: "rejected", admin_note: note?.trim() ?? null })
        .eq("id", needId);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    [isAdmin, sessionUserId]
  );

  const createProjectFromNeed = useCallback(
    async (
      needId: string,
      title: string,
      description: string,
      faculties: string
    ): Promise<Result> => {
      if (!supabase || !sessionUserId) return { ok: false, error: "Autentificare necesară." };
      if (!isAdmin || !profile) return { ok: false, error: "Doar admin MTU Cork." };
      const facultiesArr = faculties.split(",").map((f) => f.trim()).filter(Boolean);

      const { error } = await supabase.from("projects").insert({
        need_request_id: needId,
        title: title.trim(),
        description: description.trim(),
        faculty_tags: facultiesArr,
        student_ids: [],
        status: "planning",
        created_by_admin_id: profile.id,
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    [isAdmin, profile, sessionUserId]
  );

  const assignStudentToProject = useCallback(
    async (projectId: string, studentUserId: string): Promise<Result> => {
      if (!supabase || !sessionUserId) return { ok: false, error: "Autentificare necesară." };
      if (!isAdmin) return { ok: false, error: "Doar admin." };

      // Fetch project student_ids then update (safe for small dataset)
      const { data: projectRow, error: projErr } = await supabase
        .from("projects")
        .select("student_ids")
        .eq("id", projectId)
        .maybeSingle();
      if (projErr) return { ok: false, error: projErr.message };
      const current = Array.isArray(projectRow?.student_ids) ? (projectRow!.student_ids as string[]) : [];
      if (!current.includes(studentUserId)) current.push(studentUserId);

      const { error } = await supabase
        .from("projects")
        .update({ student_ids: current, status: "active" })
        .eq("id", projectId);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    [isAdmin, sessionUserId]
  );

  const approveRoleRequest = useCallback(
    async (requestId: string): Promise<Result> => {
      if (!supabase || !sessionUserId) return { ok: false, error: "Autentificare necesară." };
      if (!isAdmin) return { ok: false, error: "Doar admin." };

      const { data: reqRow, error: reqErr } = await supabase
        .from("role_requests")
        .select("user_id,role")
        .eq("id", requestId)
        .maybeSingle();
      if (reqErr) return { ok: false, error: reqErr.message };
      if (!reqRow) return { ok: false, error: "Cerere negăsită." };

      const { error: updReqErr } = await supabase
        .from("role_requests")
        .update({ status: "approved" })
        .eq("id", requestId);
      if (updReqErr) return { ok: false, error: updReqErr.message };

      const { data: profRow } = await supabase
        .from("profiles")
        .select("roles")
        .eq("id", reqRow.user_id)
        .maybeSingle();

      const roles = Array.isArray(profRow?.roles) ? (profRow!.roles as PlatformRole[]) : [];
      if (!roles.includes(reqRow.role as PlatformRole)) roles.push(reqRow.role as PlatformRole);

      const { error: updProfErr } = await supabase
        .from("profiles")
        .update({ roles })
        .eq("id", reqRow.user_id);
      if (updProfErr) return { ok: false, error: updProfErr.message };

      return { ok: true };
    },
    [isAdmin, sessionUserId]
  );

  const rejectRoleRequest = useCallback(
    async (requestId: string): Promise<Result> => {
      if (!supabase || !sessionUserId) return { ok: false, error: "Autentificare necesară." };
      if (!isAdmin) return { ok: false, error: "Doar admin." };

      const { error } = await supabase
        .from("role_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    [isAdmin, sessionUserId]
  );

  const joinCommunity = useCallback(
    async (communityId: string): Promise<Result> => {
      if (!supabase || !sessionUserId) return { ok: false, error: "Autentificare necesară." };
      const { error } = await supabase.from("community_members").upsert(
        { community_id: communityId, user_id: sessionUserId },
        { onConflict: "community_id,user_id" }
      );
      if (error) return { ok: false, error: error.message };
      // For quick MVP: refresh only membership IDs in profile locally
      setProfile((p) => (p ? { ...p, joinedCommunityIds: [...p.joinedCommunityIds, communityId] } : p));
      return { ok: true };
    },
    [sessionUserId]
  );

  const leaveCommunity = useCallback(
    (communityId: string) => {
      if (!supabase || !sessionUserId) return;
      supabase
        .from("community_members")
        .delete()
        .eq("community_id", communityId)
        .eq("user_id", sessionUserId)
        .then(({ error }) => {
          if (!error) {
            setProfile((p) =>
              p ? { ...p, joinedCommunityIds: p.joinedCommunityIds.filter((id) => id !== communityId) } : p
            );
          }
        });
    },
    [sessionUserId]
  );

  const setVolunteer = useCallback(
    async (active: boolean): Promise<void> => {
      if (!supabase || !sessionUserId) return;
      const { error } = await supabase
        .from("profiles")
        .update({ is_volunteer: active })
        .eq("id", sessionUserId);
      if (!error) setProfile((p) => (p ? { ...p, isVolunteer: active } : p));
    },
    [sessionUserId]
  );

  const addFriend = useCallback(
    async (userId: string): Promise<Result> => {
      if (!supabase || !sessionUserId) return { ok: false, error: "Autentificare necesară." };
      if (userId === sessionUserId) return { ok: false, error: "Nu te poți adăuga pe tine." };
      // Upsert symmetric friendship accepted (MVP)
      const { error } = await supabase.from("friendships").upsert(
        [
          { user_id: sessionUserId, friend_id: userId, status: "accepted" },
          { user_id: userId, friend_id: sessionUserId, status: "accepted" },
        ],
        { onConflict: "user_id,friend_id" }
      );
      if (error) return { ok: false, error: error.message };
      // Quick refetch: reuse the initial effect by hard reload of user data would be best.
      // For MVP, we reload conversation cache only.
      return { ok: true };
    },
    [sessionUserId]
  );

  const removeFriend = useCallback(
    async (userId: string): Promise<void> => {
      if (!sessionUserId) return;
      await supabase
        .from("friendships")
        .delete()
        .eq("user_id", sessionUserId)
        .eq("friend_id", userId);
      await supabase
        .from("friendships")
        .delete()
        .eq("user_id", userId)
        .eq("friend_id", sessionUserId);
      // Best-effort refresh: clear cached lists so next component render triggers reload.
      setFriends((prev) => prev.filter((f) => f.id !== userId));
      setDiscoverableUsers((prev) => prev); // no-op
    },
    [sessionUserId]
  );

  const loadConversationMessages = useCallback(
    async (friendId: string): Promise<void> => {
      if (!supabase || !sessionUserId) return;
      const { aMin, aMax } = canonicalPair(sessionUserId, friendId);
      const { data: convRow } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_a", aMin)
        .eq("user_b", aMax)
        .maybeSingle();

      if (!convRow) {
        setConversationMessages((m) => ({ ...m, [friendId]: [] }));
        return;
      }

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convRow.id)
        .order("created_at", { ascending: true });
      setConversationMessages((m) => ({ ...m, [friendId]: (msgs ?? []) as Message[] }));
    },
    [sessionUserId]
  );

  const getConversationMessages = useCallback(
    (friendId: string) => conversationMessages[friendId] ?? [],
    [conversationMessages]
  );

  const sendMessage = useCallback(
    async (friendId: string, body: string): Promise<Result> => {
      if (!supabase || !sessionUserId) return { ok: false, error: "Autentificare necesară." };
      const trimmed = body.trim();
      if (!trimmed) return { ok: false, error: "Mesaj gol." };

      // Ensure friendship accepted
      const { data: isFriend } = await supabase
        .from("friendships")
        .select("id")
        .eq("user_id", sessionUserId)
        .eq("friend_id", friendId)
        .eq("status", "accepted")
        .maybeSingle();
      if (!isFriend) return { ok: false, error: "Poți scrie doar prietenilor." };

      const { aMin, aMax } = canonicalPair(sessionUserId, friendId);
      let conversationId: string | null = null;

      const { data: convRow, error: convErr } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_a", aMin)
        .eq("user_b", aMax)
        .maybeSingle();

      if (convErr) return { ok: false, error: convErr.message };

      if (convRow?.id) {
        conversationId = convRow.id;
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from("conversations")
          .insert({ user_a: aMin, user_b: aMax })
          .select("id")
          .maybeSingle();
        if (insErr) return { ok: false, error: insErr.message };
        conversationId = inserted?.id ?? null;
      }

      if (!conversationId) return { ok: false, error: "Eroare conversation." };

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: sessionUserId,
        body: trimmed,
      });
      if (error) return { ok: false, error: error.message };

      await loadConversationMessages(friendId);
      return { ok: true };
    },
    [loadConversationMessages, sessionUserId]
  );

  const getInvitationsForMe = useCallback(() => {
    const eventsById = new Map(weeklyEvents.map((e) => [e.id, e]));
    return eventInvitations
      .map((inv) => {
        const ev = eventsById.get(inv.eventId);
        return ev ? { event: ev, status: inv.status } : null;
      })
      .filter(Boolean) as { event: EventItem; status: InviteStatus }[];
  }, [eventInvitations, weeklyEvents]);

  const getUserNeeds = useCallback(() => {
    if (!sessionUserId) return [];
    return needRequests;
  }, [needRequests, sessionUserId]);

  const getUserRoleRequests = useCallback(() => {
    if (!sessionUserId) return [];
    return roleRequests;
  }, [roleRequests, sessionUserId]);

  const getFriendEvents = useCallback((): EventItem[] => {
    if (!sessionUserId) return [];
    const friendIds = new Set(friends.map((f) => f.id));
    if (!friendIds.size) return [];

    // In MVP we don't keep attendee lists; we compute from registrations cache per event only for current user.
    // So "friend events" are currently best-effort from static templates (empty unless you implement extra fetching).
    // We'll return the week events; you can tighten later.
    return weeklyEvents;
  }, [friends, sessionUserId, weeklyEvents]);

  const getMyProjects = useCallback((): Project[] => {
    if (!sessionUserId) return [];
    // Projects already loaded based on role in effect
    return projects;
  }, [projects, sessionUserId]);

  const value: AppContextValue = {
    data,
    currentUser: profile,
    isAuthenticated,
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
    loadConversationMessages,
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

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProviderSupabase");
  return ctx;
}

