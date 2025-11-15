import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ClubApplication {
  applicationId: number;
  clubName: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: any;
  category?: string;
  description?: string;
}

interface ClubApplicationsListProps {
  applications: ClubApplication[];
  maxItems?: number;
  showAll?: boolean;
  onViewAll?: () => void;
  onItemPress?: (applicationId: number) => void;
}

export const ClubApplicationsList: React.FC<ClubApplicationsListProps> = ({
  applications,
  maxItems = 3,
  showAll = false,
  onViewAll,
  onItemPress,
}) => {

  const displayedApplications = showAll
    ? applications
    : applications.slice(0, maxItems);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (applications.length === 0) {
    return (
      <View className="bg-white rounded-xl p-6 items-center justify-center border border-gray-200">
        <Text className="text-4xl mb-2">📝</Text>
        <Text className="text-base font-semibold text-gray-900 mb-1">
          No Applications
        </Text>
        <Text className="text-sm text-gray-500 text-center">
          Club applications will appear here
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {displayedApplications.map((app) => (
        <TouchableOpacity
          key={app.applicationId}
          onPress={() => onItemPress?.(app.applicationId)}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          activeOpacity={0.7}
          disabled={!onItemPress}
        >
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-base font-bold text-gray-900 mb-1">
                {app.clubName}
              </Text>
              {app.category && (
                <Text className="text-xs text-gray-500">
                  Category: {app.category}
                </Text>
              )}
            </View>
            <View
              className={`px-3 py-1 rounded-full border ${getStatusColor(
                app.status
              )}`}
            >
              <Text className="text-xs font-semibold">{app.status}</Text>
            </View>
          </View>

          {app.description && (
            <Text
              className="text-sm text-gray-600 mb-2"
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {app.description}
            </Text>
          )}

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-500">
                📅 {formatDate(app.submittedAt)}
              </Text>
            </View>
            {app.reviewedBy && (
              <Text className="text-xs text-gray-500">
                Reviewed by: {app.reviewedBy.fullName || 'N/A'}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {!showAll && applications.length > maxItems && onViewAll && (
        <TouchableOpacity
          onPress={onViewAll}
          className="bg-blue-50 rounded-xl p-4 items-center border border-blue-200"
          activeOpacity={0.7}
        >
          <Text className="text-sm font-semibold text-blue-600">
            View All Applications ({applications.length})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ClubApplicationsList;
