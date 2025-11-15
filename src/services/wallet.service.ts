import { axiosClient } from '@configs/axios';

export interface Wallet {
  points: number;
  userId?: number;
  balance?: number;
  balancePoints?: number;
}

export interface DistributePointsRequest {
  clubIds: (string | number)[];
  points: number;
  reason?: string;
}

export interface DistributePointsResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface RewardPointsRequest {
  membershipId: string | number;
  points: number;
  reason?: string;
}

export interface ClubWallet {
  walletId: number;
  balancePoints: number;
  ownerType: string;
  clubId: number;
  clubName: string;
  userId: number | null;
  userFullName: string | null;
}

export interface ClubToMemberTransaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  signedAmount: string;
  senderName: string | null;
  receiverName: string | null;
}

export interface RewardMembersTransaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  receiverName: string;
}

export interface RewardMembersResponse {
  success: boolean;
  message: string;
  data: RewardMembersTransaction[];
}

export interface UniToClubTransaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  senderName: string | null;
  receiverName: string | null;
}

export interface UniToEventTransaction {
  id: number;
  type: string;
  signedAmount: string;
  description: string;
  createdAt: string;
  senderName: string | null;
  receiverName: string | null;
}

export class WalletService {
  /**
   * Get current user's wallet
   */
  static async getWallet(): Promise<Wallet> {
    try {
      const response = await axiosClient.get<Wallet>('/api/wallets/me');
      const data = response.data;
      
      // Normalize different response formats to consistent "points" field
      const points = Number(
        (data as any).points ?? 
        (data as any).balance ?? 
        (data as any).balancePoints ?? 
        (data as any).balance_points ?? 
        0
      );
      
      return { ...data, points };
    } catch (error) {
      console.error('Error fetching wallet:', error);
      throw error;
    }
  }

  /**
   * Get wallet transaction history for current user
   */
  static async getWalletTransactions(): Promise<ClubToMemberTransaction[]> {
    try {
      const response = await axiosClient.get('/api/wallets/me/transactions');
      console.log('getWalletTransactions:', response.data);
      
      // Handle nested data structure
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        const nestedData = (response.data as any).data;
        return Array.isArray(nestedData) ? nestedData : [];
      }
      
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      return [];
    }
  }

  /**
   * Reward points to a specific member
   */
  static async rewardPointsToMember(
    membershipId: string | number,
    points: number,
    reason?: string
  ): Promise<any> {
    try {
      const response = await axiosClient.post(
        `/api/wallets/reward/${membershipId}`,
        null,
        {
          params: {
            points,
            reason,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to reward points to membership ${membershipId}:`, error);
      throw error;
    }
  }

  /**
   * Distribute points to multiple clubs
   */
  static async distributePointsToClubs(
    clubIds: (string | number)[],
    points: number,
    reason?: string
  ): Promise<DistributePointsResponse> {
    try {
      const response = await axiosClient.post<DistributePointsResponse>(
        '/api/wallets/distribute/clubs',
        {
          clubIds,
          points,
          reason,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to distribute points to clubs:', error);
      
      // Return structured error response
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to distribute points',
      };
    }
  }

  /**
   * Reward points to multiple clubs (new API matching web)
   * POST /api/wallets/reward/clubs
   */
  static async pointsToClubs(
    targetIds: number[],
    points: number,
    reason?: string
  ): Promise<RewardMembersResponse> {
    try {
      const response = await axiosClient.post<RewardMembersResponse>(
        '/api/wallets/reward/clubs',
        {
          targetIds,
          points,
          reason: reason || '',
        }
      );
      console.log(`pointsToClubs (targetIds: ${targetIds.length} clubs):`, response.data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to reward points to clubs', error);
      throw error;
    }
  }

  /**
   * Top up points to a specific club wallet
   */
  static async topupClubWallet(
    clubId: string | number,
    points: number,
    reason?: string
  ): Promise<ClubWallet> {
    try {
      const response = await axiosClient.post<ClubWallet>(
        `/api/wallets/club/${clubId}/topup`,
        null,
        {
          params: {
            points,
            reason,
          },
        }
      );
      console.log('topupClubWallet:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to topup club wallet for clubId ${clubId}:`, error);
      throw error;
    }
  }

  /**
   * Get club wallet information
   */
  static async getClubWallet(clubId: string | number): Promise<ClubWallet> {
    try {
      const response = await axiosClient.get<ClubWallet>(
        `/api/wallets/club/${clubId}`
      );
      console.log('getClubWallet raw response:', response.data);
      
      // Handle nested data structure (e.g., { success: true, data: {...} })
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        const nestedData = (response.data as any).data;
        console.log('getClubWallet extracted data:', nestedData);
        return nestedData;
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`Failed to get club wallet for clubId ${clubId}:`, error);
      throw error;
    }
  }

  /**
   * Reward points to multiple members (batch operation)
   */
  static async rewardPointsToMembers(
    targetIds: number[],
    points: number,
    reason?: string
  ): Promise<RewardMembersResponse> {
    try {
      const response = await axiosClient.post<RewardMembersResponse>(
        `/api/wallets/reward/members`,
        {
          targetIds,
          points,
          reason: reason || '',
        }
      );
      console.log(`rewardPointsToMembers (targetIds: ${targetIds.length} members):`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to reward points to members`, error);
      throw error;
    }
  }

  /**
   * Get club-to-member transaction history
   */
  static async getClubToMemberTransactions(): Promise<ClubToMemberTransaction[]> {
    try {
      const response = await axiosClient.get('/api/wallets/transactions/club-to-member');
      console.log('getClubToMemberTransactions:', response.data);
      
      // Handle nested data structure
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        const nestedData = (response.data as any).data;
        return Array.isArray(nestedData) ? nestedData : [];
      }
      
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching club-to-member transactions:', error);
      return [];
    }
  }

  /**
   * Get wallet transaction history
   */
  static async getTransactionHistory(): Promise<any[]> {
    try {
      const response = await axiosClient.get('/api/wallets/transactions');
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Get university to club transaction history
   */
  static async getUniToClubTransactions(): Promise<UniToClubTransaction[]> {
    try {
      const response = await axiosClient.get('/api/wallets/transactions/uni-to-club');
      console.log('getUniToClubTransactions:', response.data);
      
      // Handle nested data structure
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        const nestedData = (response.data as any).data;
        return Array.isArray(nestedData) ? nestedData : [];
      }
      
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching uni-to-club transactions:', error);
      return [];
    }
  }

  /**
   * Get university to event transaction history
   */
  static async getUniToEventTransactions(): Promise<UniToEventTransaction[]> {
    try {
      const response = await axiosClient.get('/api/wallets/transactions/uni-to-event');
      console.log('getUniToEventTransactions:', response.data);
      
      // Handle nested data structure
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        const nestedData = (response.data as any).data;
        return Array.isArray(nestedData) ? nestedData : [];
      }
      
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching uni-to-event transactions:', error);
      return [];
    }
  }
}

export default WalletService;
