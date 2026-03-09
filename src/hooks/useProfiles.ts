import { invoke } from "@tauri-apps/api/core";

export interface Profile {
  id: string;
  name: string;
  profile_type: string;
  url?: string;
  last_updated?: string;
}

interface ProfilesResponse {
  profiles: Profile[];
  active: string | null;
}

export async function listProfiles(): Promise<ProfilesResponse> {
  return invoke<ProfilesResponse>("list_profiles");
}

export async function addLocalProfile(
  name: string,
  content: string
): Promise<Profile> {
  return invoke<Profile>("add_local_profile", { name, content });
}

export async function addRemoteProfile(
  name: string,
  url: string
): Promise<Profile> {
  return invoke<Profile>("add_remote_profile", { name, url });
}

export async function updateRemoteProfile(id: string): Promise<string> {
  return invoke<string>("update_remote_profile", { id });
}

export async function setActiveProfile(id: string): Promise<void> {
  return invoke<void>("set_active_profile", { id });
}

export async function deleteProfile(id: string): Promise<void> {
  return invoke<void>("delete_profile", { id });
}

export async function getConfigDir(): Promise<string> {
  return invoke<string>("get_config_dir");
}
