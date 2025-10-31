/**
 * Generate a DiceBear Adventurer avatar URL based on a seed (user name or email)
 * @param seed - A unique identifier (e.g., user name, email, or ID)
 * @returns URL string for the avatar image
 */
export function getAvatarUrl(seed: string | null | undefined): string {
  if (!seed) {
    // Use a default seed if none provided
    return "https://api.dicebear.com/8.x/adventurer/svg?seed=default"
  }
  
  // Use the seed to generate a consistent avatar
  // Replace spaces and special characters to ensure URL compatibility
  const cleanSeed = seed.trim().replace(/[^a-zA-Z0-9]/g, "")
  
  if (cleanSeed.length === 0) {
    return "https://api.dicebear.com/8.x/adventurer/svg?seed=default"
  }
  
  return `https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(cleanSeed)}`
}

/**
 * Get avatar URL from user data (prefers name, falls back to email, then ID)
 */
export function getUserAvatarUrl(user: {
  name?: string | null
  email?: string | null
  id?: string | null
}): string {
  return getAvatarUrl(user.name || user.email || user.id || "default")
}

