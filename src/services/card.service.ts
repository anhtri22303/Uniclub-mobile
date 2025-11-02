import { axiosClient } from '@configs/axios';

// Card design response from backend
export interface CardDesign {
  cardId: number;
  clubId: number;
  clubName: string;
  borderRadius: string;
  cardColorClass: string;
  cardOpacity: number;
  colorType: string;
  gradient: string;
  logoSize: number;
  pattern: string;
  patternOpacity: number;
  qrPosition: string;
  qrSize: number;
  qrStyle: string;
  showLogo: boolean;
  logoUrl: string;
  createdAt: string;
}

export interface CardApiResponse {
  success: boolean;
  message: string;
  data: CardDesign;
}

// Request body for creating card design
export interface CreateCardRequest {
  borderRadius: string;
  cardColorClass: string;
  cardOpacity: number;
  colorType: string;
  gradient: string;
  logoSize: number;
  pattern: string;
  patternOpacity: number;
  qrPosition: string;
  qrSize: number;
  qrStyle: string;
  showLogo: boolean;
  logoUrl: string;
}

/**
 * GET /api/cards/club/{clubId} -> returns card design for a specific club
 */
const getCardByClubId = async (clubId: number): Promise<CardDesign> => {
  try {
    const response = await axiosClient.get<CardApiResponse>(`/api/cards/club/${clubId}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Failed to fetch card design:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * POST /api/cards/{clubId} -> creates/updates card design for a specific club
 */
const createCard = async (clubId: number, cardData: CreateCardRequest): Promise<CardDesign> => {
  try {
    const response = await axiosClient.post<CardApiResponse>(`/api/cards/${clubId}`, cardData);
    return response.data.data;
  } catch (error: any) {
    console.error('Failed to create card design:', error.response?.data || error.message);
    throw error;
  }
};

const CardService = {
  getCardByClubId,
  createCard,
};

export default CardService;

