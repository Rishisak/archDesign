import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jkdjboxmtajkuxxecppo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_DGuYcjDlLkVV237ItBtacw_8tX_N_eX";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Save user/login information into Supabase (e.g. user_logins / profiles table, or localStorage fallback).
 */
export async function recordUserSession(userRecord) {
  try {
    const payload = {
      id: userRecord.id || `user_${Date.now()}`,
      email: userRecord.email || "guest@blueprint.studio",
      full_name: userRecord.user_metadata?.full_name || userRecord.full_name || "Guest User",
      role: userRecord.is_guest ? "guest" : "user",
      last_login: new Date().toISOString(),
      metadata: JSON.stringify(userRecord),
    };

    console.log("Saving user session to Supabase project (https://jkdjboxmtajkuxxecppo.supabase.co):", payload);

    // Try inserting into user_logins table
    const { data, error } = await supabase
      .from("user_logins")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.warn("Note when saving to 'user_logins' table:", error.message);
      // Fallback: try profiles table if user_logins isn't created
      const { error: profErr } = await supabase.from("profiles").upsert({
        id: payload.id,
        email: payload.email,
        full_name: payload.full_name,
        updated_at: new Date().toISOString(),
      });
      if (profErr) {
        console.warn("Note when saving to 'profiles' table:", profErr.message);
        console.info("💡 TIP: Create the 'user_logins' table in Supabase SQL Editor to see records in Table Editor!");
      }
    } else {
      console.log("Successfully saved user session to Supabase database table!");
    }
    return data;
  } catch (err) {
    console.warn("Error recording user session in Supabase:", err);
  }
}

/**
 * Helper to get local accounts registry
 */
function getLocalAccounts() {
  try {
    const raw = localStorage.getItem("blueprint_registered_accounts");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Helper to save local accounts registry
 */
function saveLocalAccount(acc) {
  try {
    const list = getLocalAccounts().filter((a) => a.email.toLowerCase() !== acc.email.toLowerCase());
    list.push(acc);
    localStorage.setItem("blueprint_registered_accounts", JSON.stringify(list));
  } catch (err) {
    console.warn("Error saving account locally:", err);
  }
}

/**
 * Sign in existing user with email & password
 */
export async function signInWithEmail(email, password) {
  const normEmail = email.trim().toLowerCase();

  // Try Supabase auth first
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normEmail,
      password,
    });
    if (!error && data?.user) {
      await recordUserSession(data.user);
      return data;
    }
  } catch (err) {
    console.warn("Supabase Auth sign in check:", err.message);
  }

  // Fallback check in registered accounts registry
  const localAccounts = getLocalAccounts();
  const matchedAcc = localAccounts.find((a) => a.email.toLowerCase() === normEmail);

  if (matchedAcc) {
    if (matchedAcc.password === password) {
      const userObj = {
        id: matchedAcc.id,
        email: matchedAcc.email,
        full_name: matchedAcc.full_name,
        user_metadata: { full_name: matchedAcc.full_name },
        last_login: new Date().toISOString(),
      };
      await recordUserSession(userObj);
      return { user: userObj };
    } else {
      throw new Error("Invalid email or password. Please check your password.");
    }
  }

  throw new Error("No account found with this email address. Please create an account.");
}

/**
 * Sign up new user with email, password and full name
 */
export async function signUpWithEmail(email, password, fullName) {
  const normEmail = email.trim().toLowerCase();
  const accId = `usr_${Date.now()}`;

  // Store in registered accounts registry first so login always works
  saveLocalAccount({
    id: accId,
    email: normEmail,
    password,
    full_name: fullName,
    created_at: new Date().toISOString(),
  });

  try {
    const { data, error } = await supabase.auth.signUp({
      email: normEmail,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      console.warn("Supabase Auth signup notice:", error.message);
      const fallbackUser = {
        id: accId,
        email: normEmail,
        full_name: fullName,
        user_metadata: { full_name: fullName },
        created_at: new Date().toISOString(),
      };
      await recordUserSession(fallbackUser);
      return { user: fallbackUser, isFallback: true };
    }

    if (data?.user) {
      await recordUserSession({ ...data.user, full_name: fullName });
    }
    return data;
  } catch (err) {
    console.warn("Supabase signup fallback triggered:", err.message);
    const fallbackUser = {
      id: accId,
      email: normEmail,
      full_name: fullName,
      user_metadata: { full_name: fullName },
      created_at: new Date().toISOString(),
    };
    await recordUserSession(fallbackUser);
    return { user: fallbackUser, isFallback: true };
  }
}

/**
 * Login as Guest: Creates a guest session and records it in Supabase
 */
export async function loginAsGuestSession(customGuestName) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 7);
  const guestEmail = `guest_${timestamp}_${randomStr}@blueprint.studio`;
  const guestPassword = `GuestPass_${timestamp}_!`;
  const guestName = customGuestName || `Guest Architect #${randomStr.toUpperCase()}`;

  let userObj = null;

  try {
    // Attempt real guest sign-up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email: guestEmail,
      password: guestPassword,
      options: {
        data: { full_name: guestName, is_guest: true },
      },
    });

    if (data?.user) {
      userObj = { ...data.user, is_guest: true, full_name: guestName, email: guestEmail };
    }
  } catch (err) {
    console.warn("Supabase guest auth fallback:", err);
  }

  if (!userObj) {
    userObj = {
      id: `guest_${timestamp}`,
      email: guestEmail,
      full_name: guestName,
      is_guest: true,
      created_at: new Date().toISOString(),
    };
  }

  // Save guest info to Supabase database
  await recordUserSession(userObj);
  return userObj;
}

/**
 * Helper to get user ID and normalized email from argument
 */
function extractUserInfo(userOrId) {
  if (!userOrId) return { id: "", email: "" };
  if (typeof userOrId === "object") {
    return {
      id: userOrId.id || userOrId.email || "",
      email: userOrId.email ? userOrId.email.toLowerCase() : "",
    };
  }
  const str = String(userOrId).trim();
  const isEmail = str.includes("@");
  return {
    id: str,
    email: isEmail ? str.toLowerCase() : "",
  };
}

/**
 * Fetch projects for a user from Supabase user_projects table & localStorage fallback.
 * Queries by user_id and email so saved projects are always visible whenever the user logs in.
 */
export async function fetchUserProjects(userOrId) {
  const { id, email } = extractUserInfo(userOrId);
  if (!id && !email) return [];

  const keys = new Set();
  if (id) keys.add(`blueprint_user_projects_${id}`);
  if (email) keys.add(`blueprint_user_projects_${email}`);

  let localProjects = [];
  keys.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          localProjects = [...localProjects, ...parsed];
        }
      }
    } catch (err) {
      console.warn("Error reading local projects for key", key, err);
    }
  });

  // Deduplicate local projects by id
  const localMap = new Map();
  localProjects.forEach((p) => localMap.set(p.id, p));

  // Try querying Supabase database
  try {
    let query = supabase.from("user_projects").select("*");
    
    if (id && email) {
      query = query.or(`user_id.eq.${id},user_id.eq.${email}`);
    } else if (id) {
      query = query.eq("user_id", id);
    } else {
      query = query.eq("user_id", email);
    }

    const { data, error } = await query.order("updated_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetch projects note:", error.message);
      console.info("💡 TIP: Ensure 'user_projects' table is created in Supabase SQL Editor:\nCREATE TABLE user_projects (id text primary key, user_id text, name text, data text, updated_at text, created_at text);");
    } else if (Array.isArray(data)) {
      const dbProjects = data.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        name: p.name || p.title || "Untitled Project",
        data: typeof p.data === "string" ? JSON.parse(p.data) : p.data,
        updated_at: p.updated_at || p.created_at || new Date().toISOString(),
        created_at: p.created_at || new Date().toISOString(),
      }));

      // Merge DB projects into localMap
      dbProjects.forEach((p) => localMap.set(p.id, p));

      const merged = Array.from(localMap.values()).sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
      );

      // Save merged list back to all user keys
      keys.forEach((key) => {
        try {
          localStorage.setItem(key, JSON.stringify(merged));
        } catch (e) {
          console.warn("Storage sync note:", e);
        }
      });

      return merged;
    }
  } catch (err) {
    console.warn("Supabase fetch projects error:", err.message);
  }

  const finalLocal = Array.from(localMap.values()).sort(
    (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
  );
  return finalLocal;
}

/**
 * Save a user project to Supabase user_projects table & localStorage
 */
export async function saveUserProject(userOrId, project) {
  const { id, email } = extractUserInfo(userOrId);
  const primaryUserId = id || email || "guest_user";
  if (!primaryUserId) return null;

  const now = new Date().toISOString();
  const projectRecord = {
    id: project.id || `proj_${Date.now()}`,
    user_id: primaryUserId,
    name: project.name || "New Architectural Blueprint",
    data: project.data,
    updated_at: now,
    created_at: project.created_at || now,
  };

  // Save to local storage cache for both user_id and email keys
  const keys = new Set([`blueprint_user_projects_${primaryUserId}`]);
  if (id) keys.add(`blueprint_user_projects_${id}`);
  if (email) keys.add(`blueprint_user_projects_${email}`);

  try {
    const current = await fetchUserProjects(userOrId);
    const updated = [projectRecord, ...current.filter((p) => p.id !== projectRecord.id)];
    keys.forEach((key) => localStorage.setItem(key, JSON.stringify(updated)));
  } catch (err) {
    console.warn("Local project save error:", err);
  }

  // Save to Supabase database table `user_projects`
  try {
    const payload = {
      id: String(projectRecord.id),
      user_id: String(primaryUserId),
      name: String(projectRecord.name),
      data: typeof projectRecord.data === "string" ? projectRecord.data : JSON.stringify(projectRecord.data),
      updated_at: now,
    };

    console.log("Upserting project to Supabase user_projects table:", payload);

    const { data: resData, error } = await supabase
      .from("user_projects")
      .upsert(payload, { onConflict: "id" })
      .select();

    if (error) {
      console.warn("Supabase upsert error note:", error.message);
      // Retry without select
      const { error: retryErr } = await supabase.from("user_projects").upsert(payload);
      if (retryErr) {
        console.warn("Supabase retry upsert error:", retryErr.message);
      } else {
        console.log("Successfully saved project to Supabase 'user_projects' table on retry!");
      }
    } else {
      console.log("Successfully saved project to Supabase database table 'user_projects'!", resData);
    }
  } catch (err) {
    console.warn("Supabase project save error:", err);
  }

  return projectRecord;
}

/**
 * Delete a user project from Supabase & localStorage
 */
export async function deleteUserProject(userOrId, projectId) {
  const { id, email } = extractUserInfo(userOrId);
  const primaryUserId = id || email || "guest_user";
  if (!primaryUserId || !projectId) return;

  const keys = new Set([`blueprint_user_projects_${primaryUserId}`]);
  if (id) keys.add(`blueprint_user_projects_${id}`);
  if (email) keys.add(`blueprint_user_projects_${email}`);

  try {
    const current = await fetchUserProjects(userOrId);
    const updated = current.filter((p) => p.id !== projectId);
    keys.forEach((key) => localStorage.setItem(key, JSON.stringify(updated)));
  } catch (err) {
    console.warn("Local project delete error:", err);
  }

  try {
    const { error } = await supabase
      .from("user_projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      console.warn("Supabase delete project note:", error.message);
    }
  } catch (err) {
    console.warn("Supabase delete project error:", err);
  }
}


