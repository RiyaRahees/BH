import pool from '../config/db.js';

// Memory map for connected sockets: key (lowercase string) -> socketId
const userSockets = new Map();
// Socket ID to User Keys map for quick lookup on disconnect
const socketToKeys = new Map();

export const registerUser = async (profileId, userId, socketId) => {
  const keys = [];
  if (profileId) {
    const pid = String(profileId).toLowerCase();
    userSockets.set(pid, socketId);
    keys.push(pid);
  }
  if (userId) {
    const uid = String(userId).toLowerCase();
    userSockets.set(uid, socketId);
    keys.push(uid);
  }
  
  if (keys.length > 0) {
    socketToKeys.set(socketId, keys);
    try {
      if (userId && profileId) {
        await pool.query('UPDATE user_registration SET is_online = TRUE, last_seen = NOW() WHERE id = ? OR profile_id = ?', [userId, profileId]);
      } else if (userId) {
        await pool.query('UPDATE user_registration SET is_online = TRUE, last_seen = NOW() WHERE id = ?', [userId]);
      } else if (profileId) {
        await pool.query('UPDATE user_registration SET is_online = TRUE, last_seen = NOW() WHERE profile_id = ?', [profileId]);
      }
    } catch (e) {
      console.error('[OnlineTracker] Failed to update DB on register:', e.message);
    }
  }
  return { profileId, userId };
};

export const unregisterUser = async (socketId) => {
  const keys = socketToKeys.get(socketId);
  if (keys && keys.length > 0) {
    for (const key of keys) {
      if (userSockets.get(key) === socketId) {
        userSockets.delete(key);
      }
    }
    socketToKeys.delete(socketId);

    // Update DB to offline only if no other active socket exists for this user
    try {
      const pid = keys.find(k => k.startsWith('bkl') || k.startsWith('oth') || k.length > 8);
      const uid = keys.find(k => !isNaN(Number(k)));

      const hasActivePid = pid && userSockets.has(pid);
      const hasActiveUid = uid && userSockets.has(uid);

      if (!hasActivePid && !hasActiveUid) {
        if (uid) {
          await pool.query('UPDATE user_registration SET is_online = FALSE, last_seen = NOW() WHERE id = ?', [uid]);
        } else if (pid) {
          await pool.query('UPDATE user_registration SET is_online = FALSE, last_seen = NOW() WHERE profile_id = ?', [pid]);
        }
        return { wentOffline: true, profileId: pid, userId: uid };
      }
    } catch (e) {
      console.error('[OnlineTracker] Failed to update DB on disconnect:', e.message);
    }
  }
  return { wentOffline: false };
};

export const isOnline = (idOrProfileId) => {
  if (!idOrProfileId) return false;
  const key = String(idOrProfileId).toLowerCase();
  return userSockets.has(key);
};

export const getSocketId = (idOrProfileId) => {
  if (!idOrProfileId) return null;
  return userSockets.get(String(idOrProfileId).toLowerCase()) || null;
};

export const getOnlineKeys = () => Array.from(userSockets.keys());
