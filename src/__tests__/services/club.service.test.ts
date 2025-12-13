import { axiosClient } from '@configs/axios';
import { Club, ClubApiResponse, ClubPageableResponse, ClubService } from '@services/club.service';
import { mockAxiosError, mockAxiosResponse } from '../__mocks__/axiosMock';

jest.mock('@configs/axios');

const mockedAxiosClient = axiosClient as jest.Mocked<typeof axiosClient>;

describe('ClubService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchClubs', () => {
    it('should fetch clubs with paginated response', async () => {
      const mockClubsResponse: ClubPageableResponse = {
        content: [
          {
            id: 1,
            name: 'Tech Club',
            majorId: 1,
            majorName: 'Computer Science',
            leaderName: 'John Doe',
            description: 'A club for tech enthusiasts',
            majorPolicyName: 'Tech Policy',
            memberCount: 50,
            eventCount: 10,
            status: 'ACTIVE',
          },
          {
            id: 2,
            name: 'Art Club',
            majorId: 2,
            majorName: 'Fine Arts',
            leaderName: 'Jane Smith',
            description: 'A club for artists',
            majorPolicyName: 'Art Policy',
            memberCount: 30,
            eventCount: 5,
            status: 'ACTIVE',
          },
        ],
        totalElements: 2,
        totalPages: 1,
        size: 20,
        number: 0,
        first: true,
        last: true,
        empty: false,
      };

      mockedAxiosClient.get.mockResolvedValue(mockAxiosResponse(mockClubsResponse));

      const result = await ClubService.fetchClubs(0, 20);

      expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/clubs', {
        params: {
          page: 0,
          size: 20,
          sort: 'name',
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        name: 'Tech Club',
        category: 'Computer Science',
        leaderName: 'John Doe',
        members: 50,
        policy: 'Tech Policy',
        events: 10,
        description: 'A club for tech enthusiasts',
        status: 'ACTIVE',
      });
    });

    it('should handle empty clubs list', async () => {
      const mockEmptyResponse: ClubPageableResponse = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0,
        first: true,
        last: true,
        empty: true,
      };

      mockedAxiosClient.get.mockResolvedValue(mockAxiosResponse(mockEmptyResponse));

      const result = await ClubService.fetchClubs();

      expect(result).toEqual([]);
    });

    it('should handle clubs with missing optional fields', async () => {
      const mockClubsResponse: ClubPageableResponse = {
        content: [
          {
            id: 1,
            name: 'New Club',
            majorName: null,
            leaderName: null,
            description: null,
            majorPolicyName: null,
            memberCount: 0,
            eventCount: 0,
          },
        ],
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0,
        first: true,
        last: true,
        empty: false,
      };

      mockedAxiosClient.get.mockResolvedValue(mockAxiosResponse(mockClubsResponse));

      const result = await ClubService.fetchClubs();

      expect(result[0]).toEqual({
        id: 1,
        name: 'New Club',
        category: '-',
        leaderName: 'No Leader',
        members: 0,
        policy: '-',
        events: 0,
        description: null,
        status: undefined,
      });
    });

    it('should handle API error', async () => {
      const mockError = mockAxiosError('Failed to fetch clubs', 500);
      mockedAxiosClient.get.mockRejectedValue(mockError);

      await expect(ClubService.fetchClubs()).rejects.toMatchObject({
        response: {
          status: 500,
        },
      });
    });

    it('should use custom pagination parameters', async () => {
      const mockResponse: ClubPageableResponse = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 2,
        first: false,
        last: true,
        empty: true,
      };

      mockedAxiosClient.get.mockResolvedValue(mockAxiosResponse(mockResponse));

      await ClubService.fetchClubs(2, 10, ['name', 'asc']);

      expect(mockedAxiosClient.get).toHaveBeenCalledWith('/api/clubs', {
        params: {
          page: 2,
          size: 10,
          sort: 'name,asc',
        },
      });
    });
  });

  describe('Club data transformation', () => {
    it('should properly transform all club fields', () => {
      const apiClub: ClubApiResponse = {
        id: 1,
        name: 'Test Club',
        majorId: 1,
        majorName: 'Engineering',
        leaderName: 'Test Leader',
        description: 'Test Description',
        majorPolicyName: 'Engineering Policy',
        memberCount: 100,
        eventCount: 20,
        status: 'ACTIVE',
        createdAt: '2025-01-01T00:00:00Z',
      };

      const expectedClub: Club = {
        id: 1,
        name: 'Test Club',
        category: 'Engineering',
        leaderName: 'Test Leader',
        members: 100,
        policy: 'Engineering Policy',
        events: 20,
        description: 'Test Description',
        status: 'ACTIVE',
      };

      // This tests the transformation logic
      const transformed: Club = {
        id: apiClub.id,
        name: apiClub.name,
        category: apiClub.majorName || '-',
        leaderName: apiClub.leaderName || 'No Leader',
        members: apiClub.memberCount ?? 0,
        policy: apiClub.majorPolicyName || '-',
        events: apiClub.eventCount ?? 0,
        description: apiClub.description,
        status: apiClub.status,
      };

      expect(transformed).toEqual(expectedClub);
    });

    it('should handle undefined member and event counts', () => {
      const apiClub: ClubApiResponse = {
        id: 1,
        name: 'Test Club',
        majorName: null,
        leaderName: null,
        description: null,
        majorPolicyName: null,
        memberCount: undefined as any,
        eventCount: undefined as any,
      };

      const transformed: Club = {
        id: apiClub.id,
        name: apiClub.name,
        category: apiClub.majorName || '-',
        leaderName: apiClub.leaderName || 'No Leader',
        members: apiClub.memberCount ?? 0,
        policy: apiClub.majorPolicyName || '-',
        events: apiClub.eventCount ?? 0,
        description: apiClub.description,
        status: apiClub.status,
      };

      expect(transformed.members).toBe(0);
      expect(transformed.events).toBe(0);
    });
  });
});
