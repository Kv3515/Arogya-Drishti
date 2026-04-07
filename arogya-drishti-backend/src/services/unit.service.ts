import prisma from '../config/database';

// ─── In-Memory Cache for Unit Hierarchies ──────────────────────────────────
// Caches subtree results with 5-minute TTL to avoid repeated DB queries.
// Upgrade path: Replace with Redis for distributed systems.

interface CacheEntry {
  unitIds: Set<string>;
  expiresAt: number;
}

const unitSubtreeCache = new Map<string, CacheEntry>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Clears a unit's cache entry (useful when unit hierarchy changes).
 */
function invalidateUnitCache(unitId: string): void {
  unitSubtreeCache.delete(unitId);
}

/**
 * Returns all unit IDs that are descendants of the given unit (inclusive).
 * Uses iterative BFS (breadth-first search) to avoid deep recursion.
 * Result is cached in-process for 5 minutes.
 *
 * @param rootUnitId The unit ID to start from (included in result)
 * @returns Set of all unit IDs in the subtree (including root)
 */
export async function getUnitSubtree(rootUnitId: string): Promise<Set<string>> {
  // Check cache first
  const cached = unitSubtreeCache.get(rootUnitId);
  if (cached && cached.expiresAt > Date.now()) {
    return new Set(cached.unitIds); // Return a copy
  }

  const resultSet = new Set<string>();
  const queue = [rootUnitId];
  const visited = new Set<string>();

  // BFS: iteratively fetch children and add to result
  while (queue.length > 0) {
    const currentUnitId = queue.shift()!;

    if (visited.has(currentUnitId)) {
      continue; // Skip if already processed
    }
    visited.add(currentUnitId);
    resultSet.add(currentUnitId);

    // Fetch immediate children
    const children = await prisma.unit.findMany({
      where: { parent_unit_id: currentUnitId },
      select: { id: true },
    });

    for (const child of children) {
      if (!visited.has(child.id)) {
        queue.push(child.id);
      }
    }
  }

  // Cache the result
  unitSubtreeCache.set(rootUnitId, {
    unitIds: resultSet,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return resultSet;
}

/**
 * Checks if targetUnitId is within the unit subtree rooted at userUnitId.
 * Returns true if:
 * - targetUnitId equals userUnitId (exact match)
 * - targetUnitId is a descendant of userUnitId
 *
 * @param userUnitId The user's unit (root of hierarchy scope)
 * @param targetUnitId The unit to check access for
 * @returns true if access is allowed, false otherwise
 */
export async function isWithinUnitHierarchy(
  userUnitId: string | null,
  targetUnitId: string
): Promise<boolean> {
  // No unit assigned = super_admin or individual, not scope-limited
  if (!userUnitId) {
    return true;
  }

  const subtree = await getUnitSubtree(userUnitId);
  return subtree.has(targetUnitId);
}
