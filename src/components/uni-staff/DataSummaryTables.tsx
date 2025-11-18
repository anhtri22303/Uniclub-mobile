import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

// Types
interface Location {
  locationId: number;
  name: string;
  address: string;
  capacity: number;
}

interface Tag {
  tagId: number;
  name: string;
  description?: string;
  core?: boolean;
}

interface Major {
  majorId: number;
  code: string;
  name: string;
  colorHex?: string;
  policies?: any[];
}

interface MultiplierPolicy {
  id: number;
  targetType: 'CLUB' | 'MEMBER';
  activityType: string;
  ruleName: string;
  multiplier: number;
  active: boolean;
  conditionType?: 'PERCENTAGE' | 'ABSOLUTE';
  minThreshold?: number;
  maxThreshold?: number;
}

interface DataSummaryTablesProps {
  locations: Location[];
  tags: Tag[];
  majors: Major[];
  multiplierPolicies: MultiplierPolicy[];
  onEditLocation?: (location: Location) => void;
  onDeleteLocation?: (locationId: number) => void;
  onEditTag?: (tag: Tag) => void;
  onDeleteTag?: (tagId: number) => void;
  onEditMajor?: (major: Major) => void;
  onDeleteMajor?: (majorId: number) => void;
  onEditPolicy?: (policy: MultiplierPolicy) => void;
  onDeletePolicy?: (policyId: number) => void;
}

type TabType = 'locations' | 'tags' | 'majors' | 'policies';

export const DataSummaryTables: React.FC<DataSummaryTablesProps> = ({
  locations,
  tags,
  majors,
  multiplierPolicies,
  onEditLocation,
  onDeleteLocation,
  onEditTag,
  onDeleteTag,
  onEditMajor,
  onDeleteMajor,
  onEditPolicy,
  onDeletePolicy,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('locations');

  // Debug: Log props
  React.useEffect(() => {
    console.log('📋 DataSummaryTables Props:', {
      locations: locations?.length || 0,
      tags: tags?.length || 0,
      majors: majors?.length || 0,
      policies: multiplierPolicies?.length || 0
    });
  }, [locations, tags, majors, multiplierPolicies]);

  const tabs = [
    { key: 'locations' as TabType, label: 'Locations', count: locations.length, icon: '📍' },
    { key: 'tags' as TabType, label: 'Tags', count: tags.length, icon: '🏷️' },
    { key: 'majors' as TabType, label: 'Majors', count: majors.length, icon: '🎓' },
    { key: 'policies' as TabType, label: 'Policies', count: multiplierPolicies.length, icon: '⚙️' },
  ];

  const renderLocationCard = (location: Location) => (
    <View
      key={location.locationId}
      className="bg-white rounded-xl p-4 mb-3 border border-gray-200"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-base font-bold text-gray-900 mb-1">
            📍 {location.name}
          </Text>
          <Text className="text-sm text-gray-600 mb-1">{location.address}</Text>
          <Text className="text-xs text-gray-500">
            Capacity: {location.capacity} people
          </Text>
        </View>
        <View className="flex-row gap-2">
          {onEditLocation && (
            <TouchableOpacity
              onPress={() => onEditLocation(location)}
              className="bg-blue-50 px-3 py-1 rounded-lg"
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold text-blue-600">Edit</Text>
            </TouchableOpacity>
          )}
          {onDeleteLocation && (
            <TouchableOpacity
              onPress={() => onDeleteLocation(location.locationId)}
              className="bg-red-50 px-3 py-1 rounded-lg"
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold text-red-600">Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderTagCard = (tag: Tag) => (
    <View
      key={tag.tagId}
      className="bg-white rounded-xl p-4 mb-3 border border-gray-200"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center mb-1">
            <Text className="text-base font-bold text-gray-900 mr-2">
              🏷️ {tag.name}
            </Text>
            {tag.core && (
              <View className="bg-yellow-100 px-2 py-0.5 rounded-full">
                <Text className="text-xs font-semibold text-yellow-800">
                  CORE
                </Text>
              </View>
            )}
          </View>
          {tag.description && (
            <Text className="text-sm text-gray-600">{tag.description}</Text>
          )}
        </View>
        <View className="flex-row gap-2">
          {onEditTag && (
            <TouchableOpacity
              onPress={() => onEditTag(tag)}
              className="bg-blue-50 px-3 py-1 rounded-lg"
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold text-blue-600">Edit</Text>
            </TouchableOpacity>
          )}
          {onDeleteTag && (
            <TouchableOpacity
              onPress={() => onDeleteTag(tag.tagId)}
              className="bg-red-50 px-3 py-1 rounded-lg"
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold text-red-600">Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderMajorCard = (major: Major) => (
    <View
      key={major.majorId}
      className="bg-white rounded-xl p-4 mb-3 border border-gray-200"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center mb-1">
            {major.colorHex && (
              <View
                className="w-4 h-4 rounded mr-2"
                style={{ backgroundColor: major.colorHex }}
              />
            )}
            <Text className="text-base font-bold text-gray-900">
              🎓 {major.name}
            </Text>
          </View>
          <Text className="text-sm text-gray-600 mb-1">Code: {major.code}</Text>
          {major.policies && major.policies.length > 0 && (
            <Text className="text-xs text-gray-500">
              {major.policies.length} policies
            </Text>
          )}
        </View>
        <View className="flex-row gap-2">
          {onEditMajor && (
            <TouchableOpacity
              onPress={() => onEditMajor(major)}
              className="bg-blue-50 px-3 py-1 rounded-lg"
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold text-blue-600">Edit</Text>
            </TouchableOpacity>
          )}
          {onDeleteMajor && (
            <TouchableOpacity
              onPress={() => onDeleteMajor(major.majorId)}
              className="bg-red-50 px-3 py-1 rounded-lg"
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold text-red-600">Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderPolicyCard = (policy: MultiplierPolicy) => (
    <View
      key={policy.id}
      className="bg-white rounded-xl p-4 mb-3 border border-gray-200"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center mb-1">
            <Text className="text-base font-bold text-gray-900 mr-2">
              ⚙️ {policy.ruleName}
            </Text>
            <View
              className={`px-2 py-0.5 rounded-full ${
                policy.active ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  policy.active ? 'text-green-700' : 'text-gray-700'
                }`}
              >
                {policy.active ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
          </View>
          <Text className="text-sm text-gray-600 mb-1">
            {policy.targetType} - {policy.activityType}
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="bg-purple-100 px-2 py-1 rounded">
              <Text className="text-xs font-bold text-purple-800">
                {policy.multiplier}x
              </Text>
            </View>
            {policy.conditionType && (
              <Text className="text-xs text-gray-500">
                {policy.conditionType}
                {policy.minThreshold !== undefined &&
                  ` (${policy.minThreshold}${
                    policy.maxThreshold !== undefined
                      ? ` - ${policy.maxThreshold}`
                      : '+'
                  })`}
              </Text>
            )}
          </View>
        </View>
        <View className="flex-row gap-2">
          {onEditPolicy && (
            <TouchableOpacity
              onPress={() => onEditPolicy(policy)}
              className="bg-blue-50 px-3 py-1 rounded-lg"
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold text-blue-600">Edit</Text>
            </TouchableOpacity>
          )}
          {onDeletePolicy && (
            <TouchableOpacity
              onPress={() => onDeletePolicy(policy.id)}
              className="bg-red-50 px-3 py-1 rounded-lg"
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold text-red-600">Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1">
      {/* Tab Navigation */}
      <View className="mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View className="flex-row gap-2">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg border ${
                activeTab === tab.key
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-white border-gray-300'
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Text className="mr-1">{tab.icon}</Text>
                <Text
                  className={`text-sm font-semibold ${
                    activeTab === tab.key ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {tab.label}
                </Text>
                <View
                  className={`ml-2 px-2 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-blue-400' : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      activeTab === tab.key ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      </View>

      {/* Content */}
      <View>
        {activeTab === 'locations' &&
          (locations.length > 0 ? (
            locations.map((location) => renderLocationCard(location))
          ) : (
            <View className="bg-white rounded-xl p-6 items-center justify-center border border-gray-200">
              <Text className="text-4xl mb-2">📍</Text>
              <Text className="text-base font-semibold text-gray-900 mb-1">
                No Locations
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                Add locations for events
              </Text>
            </View>
          ))}

        {activeTab === 'tags' &&
          (tags.length > 0 ? (
            tags.map((tag) => renderTagCard(tag))
          ) : (
            <View className="bg-white rounded-xl p-6 items-center justify-center border border-gray-200">
              <Text className="text-4xl mb-2">🏷️</Text>
              <Text className="text-base font-semibold text-gray-900 mb-1">
                No Tags
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                Add tags to categorize events
              </Text>
            </View>
          ))}

        {activeTab === 'majors' &&
          (majors.length > 0 ? (
            majors.map((major) => renderMajorCard(major))
          ) : (
            <View className="bg-white rounded-xl p-6 items-center justify-center border border-gray-200">
              <Text className="text-4xl mb-2">🎓</Text>
              <Text className="text-base font-semibold text-gray-900 mb-1">
                No Majors
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                Add majors for student classification
              </Text>
            </View>
          ))}

        {activeTab === 'policies' &&
          (multiplierPolicies.length > 0 ? (
            multiplierPolicies.map((policy) => renderPolicyCard(policy))
          ) : (
            <View className="bg-white rounded-xl p-6 items-center justify-center border border-gray-200">
              <Text className="text-4xl mb-2">⚙️</Text>
              <Text className="text-base font-semibold text-gray-900 mb-1">
                No Policies
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                Add multiplier policies for point calculation
              </Text>
            </View>
          ))}
      </View>
    </View>
  );
};

export default DataSummaryTables;
