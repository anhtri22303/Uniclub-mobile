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
      console.log('getClubWallet:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to get club wallet for clubId ${clubId}:`, error);
      throw error;
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
}

export default WalletService;
