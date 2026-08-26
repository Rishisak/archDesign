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
 * Fetch projects for a user from Supabase user_projects table with localStorage fallback
 */
export async function fetchUserProjects(userId) {
  if (!userId) return [];
  const localKey = `blueprint_user_projects_${userId}`;
  let localProjects = [];

  try {
    const raw = localStorage.getItem(localKey);
    if (raw) localProjects = JSON.parse(raw);
  } catch (err) {
    console.warn("Error reading local projects:", err);
  }

  try {
    const { data, error } = await supabase
      .from("user_projects")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      const dbProjects = data.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        name: p.name || p.title || "Untitled Project",
        data: typeof p.data === "string" ? JSON.parse(p.data) : p.data,
        updated_at: p.updated_at || p.created_at || new Date().toISOString(),
        created_at: p.created_at || new Date().toISOString(),
      }));

      // Merge local and DB projects by ID
      const map = new Map();
      localProjects.forEach((p) => map.set(p.id, p));
      dbProjects.forEach((p) => map.set(p.id, p));

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
      );

      localStorage.setItem(localKey, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn("Supabase fetch projects error:", err.message);
  }

  return localProjects;
}

/**
 * Save a user project to Supabase user_projects table & localStorage
 */
export async function saveUserProject(userId, project) {
  if (!userId) return null;
  const localKey = `blueprint_user_projects_${userId}`;
  const now = new Date().toISOString();

  const projectRecord = {
    id: project.id || `proj_${Date.now()}`,
    user_id: userId,
    name: project.name || "New Architectural Blueprint",
    data: project.data,
    updated_at: now,
    created_at: project.created_at || now,
  };

  // Save locally
  try {
    const current = await fetchUserProjects(userId);
    const updated = [projectRecord, ...current.filter((p) => p.id !== projectRecord.id)];
    localStorage.setItem(localKey, JSON.stringify(updated));
  } catch (err) {
    console.warn("Local project save error:", err);
  }

  // Save to Supabase
  try {
    const payload = {
      id: projectRecord.id,
      user_id: userId,
      name: projectRecord.name,
      data: JSON.stringify(projectRecord.data),
      updated_at: now,
      created_at: projectRecord.created_at,
    };

    const { error } = await supabase
      .from("user_projects")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.warn("Supabase save project note:", error.message);
    } else {
      console.log("Successfully saved project to Supabase database table!");
    }
  } catch (err) {
    console.warn("Supabase project save error:", err);
  }

  return projectRecord;
}

/**
 * Delete a user project from Supabase & localStorage
 */
export async function deleteUserProject(userId, projectId) {
  if (!userId || !projectId) return;
  const localKey = `blueprint_user_projects_${userId}`;

  try {
    const current = await fetchUserProjects(userId);
    const updated = current.filter((p) => p.id !== projectId);
    localStorage.setItem(localKey, JSON.stringify(updated));
  } catch (err) {
    console.warn("Local project delete error:", err);
  }

  try {
    const { error } = await supabase
      .from("user_projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", userId);

    if (error) {
      console.warn("Supabase delete project note:", error.message);
    }
  } catch (err) {
    console.warn("Supabase delete project error:", err);
  }
}

