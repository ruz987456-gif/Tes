import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../services/api';
import { RankDefinition } from '../data/ranks';

export interface UserProfileData {
  id: string;
  username: string;
  fullName: string;
  role: 'murid' | 'guru' | 'admin';
  avatarUrl: string;
  groupId?: string;
  status: string;
  createdAt: string;
  xp: number;
  rank: RankDefinition;
  rankProgress: {
    currentRank: RankDefinition;
    nextRank: RankDefinition | null;
    xpInCurrentRank: number;
    xpRequiredForNext: number;
    xpNeeded: number;
    percent: number;
  };
  todayAttendanceStatus: string | null;
  todayActiveLearning: boolean;
  streak: number;
  unreadNotifications: number;
}

interface AuthContextType {
  user: UserProfileData | null;
  loading: boolean;
  login: (username: string, password: string, expectedRole?: 'murid' | 'guru' | 'admin') => Promise<void>;
  register: (username: string, password: string, fullName: string, avatarUrl?: string, role?: 'murid' | 'guru') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (fullName: string, avatarUrl?: string) => Promise<void>;
  deleteAccount: (password: string, confirmationText: string) => Promise<void>;
  triggerRankCelebration: (prevRank: RankDefinition, newRank: RankDefinition, xp: number) => void;
  rankCelebrationData: {
    isOpen: boolean;
    prevRank: RankDefinition | null;
    newRank: RankDefinition | null;
    xp: number;
  };
  closeRankCelebration: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [rankCelebrationData, setRankCelebrationData] = useState<{
    isOpen: boolean;
    prevRank: RankDefinition | null;
    newRank: RankDefinition | null;
    xp: number;
  }>({
    isOpen: false,
    prevRank: null,
    newRank: null,
    xp: 0
  });

  const triggerRankCelebration = (prevRank: RankDefinition, newRank: RankDefinition, xp: number) => {
    setRankCelebrationData({
      isOpen: true,
      prevRank,
      newRank,
      xp
    });

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#38bdf8', '#10b981', '#f43f5e']
      });
    } catch (e) {
      // ignore
    }
  };

  const closeRankCelebration = () => {
    setRankCelebrationData(prev => ({ ...prev, isOpen: false }));
  };

  const refreshUser = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await api.getMe();
      if (data && data.profile) {
        // Check if rank increased from current in-memory
        if (user && user.rank && data.profile.rank.order > user.rank.order) {
          triggerRankCelebration(user.rank, data.profile.rank, data.profile.xp);
        }
        setUser(data.profile);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (username: string, password: string, expectedRole?: 'murid' | 'guru' | 'admin') => {
    const res = await api.login({ username, password, expectedRole });
    if (res.token) {
      setAuthToken(res.token);
      await refreshUser();
    }
  };

  const register = async (username: string, password: string, fullName: string, avatarUrl?: string, role?: 'murid' | 'guru') => {
    const res = await api.register({ username, password, fullName, avatarUrl, role: role || 'murid' });
    if (res.token) {
      setAuthToken(res.token);
      await refreshUser();
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  const updateProfile = async (fullName: string, avatarUrl?: string) => {
    await api.updateProfile({ fullName, avatarUrl });
    await refreshUser();
  };

  const deleteAccount = async (password: string, confirmationText: string) => {
    await api.deleteAccount({ password, confirmationText });
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
        deleteAccount,
        triggerRankCelebration,
        rankCelebrationData,
        closeRankCelebration
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
