import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

interface MonthlyAttendance {
  month: string;
  totalAttendances: number;
  uniqueUsers: number;
  averagePerEvent: number;
}

interface AttendanceSummaryCardProps {
  monthlyData: MonthlyAttendance[];
  availableYears?: number[];
  selectedYear?: number;
  onYearChange?: (year: number) => void;
}

export const AttendanceSummaryCard: React.FC<AttendanceSummaryCardProps> = ({
  monthlyData,
  availableYears = [],
  selectedYear,
  onYearChange,
}) => {
  const currentYear = new Date().getFullYear();
  const years =
    availableYears.length > 0
      ? availableYears
      : [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const [year, setYear] = useState(selectedYear || currentYear);

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
    if (onYearChange) {
      onYearChange(newYear);
    }
  };

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  // Calculate summary statistics
  const totalAttendances = monthlyData.reduce(
    (sum, m) => sum + m.totalAttendances,
    0
  );
  const totalUniqueUsers = monthlyData.reduce(
    (sum, m) => sum + m.uniqueUsers,
    0
  );
  const avgAttendancePerMonth =
    monthlyData.length > 0 ? totalAttendances / monthlyData.length : 0;

  // Find highest attendance month
  const highestMonth = monthlyData.reduce(
    (max, current) =>
      current.totalAttendances > max.totalAttendances ? current : max,
    monthlyData[0] || { month: '', totalAttendances: 0 }
  );

  return (
    <View className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with Year Selector */}
      <View className="bg-gradient-to-r from-purple-500 to-blue-500 p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-bold text-white">
             Attendance Summary
          </Text>
        </View>
        <View className="bg-white/20 rounded-lg border border-white/30 overflow-hidden">
          <Picker
            selectedValue={year}
            onValueChange={(value) => handleYearChange(Number(value))}
            style={{ color: '#FFFFFF' }}
            dropdownIconColor="#FFFFFF"
          >
            {years.map((y) => (
              <Picker.Item key={y} label={`Year ${y}`} value={y} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Summary Stats */}
      <View className="p-4 border-b border-gray-200">
        <View className="flex-row flex-wrap gap-3">
          <View className="bg-blue-50 rounded-lg p-3 flex-1 min-w-[45%]">
            <Text className="text-xs text-blue-600 font-semibold mb-1">
              Total Attendances
            </Text>
            <Text className="text-2xl font-bold text-blue-900">
              {totalAttendances.toLocaleString()}
            </Text>
          </View>
          <View className="bg-green-50 rounded-lg p-3 flex-1 min-w-[45%]">
            <Text className="text-xs text-green-600 font-semibold mb-1">
              Unique Users
            </Text>
            <Text className="text-2xl font-bold text-green-900">
              {totalUniqueUsers.toLocaleString()}
            </Text>
          </View>
          <View className="bg-purple-50 rounded-lg p-3 flex-1 min-w-[45%]">
            <Text className="text-xs text-purple-600 font-semibold mb-1">
              Avg per Month
            </Text>
            <Text className="text-2xl font-bold text-purple-900">
              {avgAttendancePerMonth.toFixed(0)}
            </Text>
          </View>
          <View className="bg-orange-50 rounded-lg p-3 flex-1 min-w-[45%]">
            <Text className="text-xs text-orange-600 font-semibold mb-1">
              Peak Month
            </Text>
            <Text className="text-2xl font-bold text-orange-900">
              {highestMonth.month || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Monthly Breakdown */}
      <View className="p-4">
        <Text className="text-sm font-bold text-gray-900 mb-3">
          Monthly Breakdown
        </Text>
        {monthlyData.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="gap-2"
          >
            {monthlyData.map((data, index) => {
              const percentage =
                totalAttendances > 0
                  ? (data.totalAttendances / totalAttendances) * 100
                  : 0;
              return (
                <View
                  key={index}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200 min-w-[120px]"
                >
                  <Text className="text-xs font-bold text-gray-700 mb-2">
                    {data.month}
                  </Text>
                  <View className="gap-1">
                    <View>
                      <Text className="text-xs text-gray-500">
                        Attendances
                      </Text>
                      <Text className="text-lg font-bold text-gray-900">
                        {data.totalAttendances}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-xs text-gray-500">Users</Text>
                      <Text className="text-sm font-semibold text-gray-700">
                        {data.uniqueUsers}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-xs text-gray-500">Avg/Event</Text>
                      <Text className="text-sm font-semibold text-gray-700">
                        {data.averagePerEvent.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                  {/* Progress bar */}
                  <View className="mt-2 bg-gray-200 rounded-full h-1 overflow-hidden">
                    <View
                      className="bg-blue-500 h-1 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <View className="bg-gray-50 rounded-lg p-6 items-center justify-center border border-gray-200">
            <Text className="text-3xl mb-2">📅</Text>
            <Text className="text-sm font-semibold text-gray-700 mb-1">
              No Data Available
            </Text>
            <Text className="text-xs text-gray-500 text-center">
              Attendance data will appear here
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default AttendanceSummaryCard;
