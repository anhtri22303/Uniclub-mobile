import NavigationBar from '@components/navigation/NavigationBar';
import { AppTextInput } from '@components/ui';
import Sidebar from '@components/navigation/Sidebar';
import { Badge } from '@components/ui/Badge';
import { Card, CardContent } from '@components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  AttendanceStatus,
  createClubAttendanceSession,
  CreateSessionBody,
  fetchClubAttendanceHistory,
  fetchTodayClubAttendance,
  markAttendanceBulk,
  MarkBulkBody,
  MarkBulkRecord,
} from '@services/attendance.service';
import { ClubService } from '@services/club.service';
import { ApiMembership, MembershipsService } from '@services/memberships.service';
import { useAuthStore } from '@stores/auth.store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PageAttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface Club {
  id: number;
  name: string;
  description: string;
  majorPolicyName: string;
  majorName: string;
  leaderName: string;
}

interface Member {
  id: number;
  fullName: string;
  studentCode: string;
  avatarUrl: string | null;
  role: string;
  isStaff: boolean;
}

interface AttendanceResponse {
  sessionId: number;
  date?: string;
  isLocked?: boolean;
  records: {
    memberId: number;
    status: AttendanceStatus;
    note: string | null;
    studentCode: string | null;
    fullName: string;
  }[];
}

export default function ClubLeaderAttendancesPage() {
  const { user } = useAuthStore();

  // State management
  const [clubId, setClubId] = useState<number | null>(null);
  const [managedClub, setManagedClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiMembers, setApiMembers] = useState<ApiMembership[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [attendance, setAttendance] = useState<Record<number, PageAttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [editingNoteMember, setEditingNoteMember] = useState<Member | null>(null);
  const [currentNote, setCurrentNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [selectedMemberForStatus, setSelectedMemberForStatus] = useState<Member | null>(null);

  // Get clubId from user (same pattern as other club leader pages)
  useEffect(() => {
    if (user?.clubIds && user.clubIds.length > 0) {
      setClubId(user.clubIds[0]);
    }
  }, [user]);

  // Load base data when clubId is available
  useEffect(() => {
    if (!clubId) return;

    const loadBaseData = async () => {
      setLoading(true);
      try {
        // Fetch club details
        const clubResponse = await ClubService.getClubByIdFull(clubId);
        console.log('🏢 Club response:', clubResponse);
        
        if (!clubResponse?.success) {
          throw new Error('Unable to load club information. The club may not exist or you may not have access.');
        }
        
        setManagedClub(clubResponse.data as any);
        console.log('✅ Club loaded successfully:', clubResponse.data.name);
      } catch (err: any) {
        console.error('❌ Error in loadBaseData:', err);
        const errorMessage = err?.message || 'Error loading initial data';
        setMembersError(errorMessage);
        Alert.alert('Error', errorMessage);
      } finally {
        setLoading(false);
      }
    };
    loadBaseData();
  }, [clubId]);

  // Load members and attendance when club or date changes
  useEffect(() => {
    if (!clubId) return;

    const today = new Date();
    const isToday =
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear();

    setIsReadOnly(!isToday);

    const loadMembersAndAttendance = async () => {
      setMembersLoading(true);
      setMembersError(null);
      setSessionError(null);
      setSessionId(null);

      const getMembers = async (): Promise<ApiMembership[]> => {
        if (apiMembers.length > 0) return apiMembers;
        const membersData = await MembershipsService.getMembersByClubId(clubId);
        setApiMembers(membersData);
        return membersData;
      };

      const setAttendanceStates = (
        data: AttendanceResponse | null,
        members: ApiMembership[]
      ) => {
        const initialAttendance: Record<number, PageAttendanceStatus> = {};
        const initialNotes: Record<number, string> = {};

        if (data && data.sessionId) {
          setSessionId(data.sessionId);

          if (data.records && data.records.length > 0) {
            data.records.forEach((record) => {
              const status = (record.status?.toLowerCase() || 'absent') as PageAttendanceStatus;
              initialAttendance[record.memberId] = status;
              initialNotes[record.memberId] = record.note || '';
            });
          }

          members.forEach((m: any) => {
            const memberUiId = m.membershipId;
            if (memberUiId && !initialAttendance[memberUiId]) {
              initialAttendance[memberUiId] = 'absent';
              initialNotes[memberUiId] = '';
            }
          });
        }
        setAttendance(initialAttendance);
        setNotes(initialNotes);
      };

      try {
        const members = await getMembers();
        let attendanceData: AttendanceResponse | null = null;
        let apiResponse: any = null;

        const formattedDate = formatDate(selectedDate);

        if (isToday) {
          try {
            apiResponse = await fetchTodayClubAttendance(clubId);
            attendanceData = apiResponse.data;

            if (!attendanceData || !attendanceData.sessionId) {
              const now = new Date();
              const endTime = new Date(now.getTime() + 60 * 60 * 1000); // Add 1 hour
              
              const formatTime = (date: Date): string => {
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = '00';
                return `${hours}:${minutes}:${seconds}`;
              };
              
              const newSessionBody: CreateSessionBody = {
                date: formattedDate,
                startTime: formatTime(now),
                endTime: formatTime(endTime),
                note: 'Auto-created session by mobile app',
              };

              try {
                apiResponse = await createClubAttendanceSession(clubId, newSessionBody);
                attendanceData = apiResponse.data;
                Alert.alert('Success', 'New attendance session created for today');
              } catch (createErr: any) {
                const errorMsg = createErr?.response?.data?.error || 'Unknown creation error';
                
                if (errorMsg.toLowerCase().includes('already exists')) {
                  apiResponse = await fetchClubAttendanceHistory({
                    clubId: clubId,
                    date: formattedDate,
                  });
                  attendanceData = apiResponse.data;
                } else {
                  throw createErr;
                }
              }
            }
          } catch (err: any) {
            console.error('Failed to fetch or create session:', err);
            const error = err?.response?.data?.error || err?.message || 'An error occurred.';
            setSessionError(`Backend Error: ${error}`);
          }
        } else {
          try {
            apiResponse = await fetchClubAttendanceHistory({
              clubId: clubId,
              date: formattedDate,
            });
            attendanceData = apiResponse.data;
          } catch (historyErr: any) {
            console.error('Failed to fetch attendance history:', historyErr);
            setSessionError('No attendance records found for this date.');
          }
        }

        setAttendanceStates(attendanceData, members);
      } catch (err: any) {
        setMembersError(err?.message || 'Error loading member list');
        Alert.alert('Error', err?.message || 'Failed to load members');
      } finally {
        setMembersLoading(false);
      }
    };

    loadMembersAndAttendance();
  }, [clubId, selectedDate, apiMembers]);

  // Show reminder if leader is marked absent
  useEffect(() => {
    if (!user?.userId || apiMembers.length === 0 || Object.keys(attendance).length === 0) {
      return;
    }

    const leaderMembership = apiMembers.find((m: any) => String(m.userId) === String(user.userId));

    if (leaderMembership && leaderMembership.membershipId) {
      const leaderStatus = attendance[leaderMembership.membershipId];

      if (leaderStatus === 'absent' || !leaderStatus) {
        Alert.alert(
          '🔔 Attendance Reminder',
          'You are currently marked as "Absent". Please update your own status if this is incorrect.',
          [{ text: 'OK' }]
        );
      }
    }
  }, [user?.userId, apiMembers, attendance]);

  // Filter members
  const clubMembers = useMemo(
    () =>
      clubId
        ? apiMembers
            .filter(
              (m: any) =>
                m.membershipId &&
                String(m.clubId) === String(clubId) &&
                m.state === 'ACTIVE'
            )
            .map((m: any) => ({
              id: m.membershipId,
              fullName: m.fullName ?? `User ${m.userId}`,
              studentCode: m.studentCode ?? '—',
              avatarUrl: m.avatarUrl ?? null,
              role: m.clubRole ?? 'MEMBER',
              isStaff: m.staff ?? false,
            }))
        : [],
    [clubId, apiMembers]
  );

  const filteredMembers = useMemo(() => {
    return clubMembers.filter((member) => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchName = member.fullName.toLowerCase().includes(searchLower);
        const matchStudentCode = member.studentCode.toLowerCase().includes(searchLower);
        if (!matchName && !matchStudentCode) return false;
      }

      if (roleFilter && roleFilter !== 'all' && member.role !== roleFilter) {
        return false;
      }

      if (staffFilter && staffFilter !== 'all') {
        const isStaff = staffFilter === 'true';
        if (member.isStaff !== isStaff) return false;
      }

      return true;
    });
  }, [clubMembers, searchTerm, roleFilter, staffFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredMembers.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    filteredMembers.forEach((member) => {
      const status = attendance[member.id];
      switch (status) {
        case 'present':
          present++;
          break;
        case 'late':
          late++;
          break;
        case 'excused':
          excused++;
          break;
        case 'absent':
        default:
          absent++;
          break;
      }
    });

    return { total, present, absent, late, excused };
  }, [attendance, filteredMembers]);

  // Handlers
  const handleStatusChange = (memberId: number, status: PageAttendanceStatus) => {
    if (isReadOnly) return;
    setAttendance((prev) => ({ ...prev, [memberId]: status }));
    setShowStatusPicker(false);
    setSelectedMemberForStatus(null);
  };

  const handleBulkAction = (status: 'present' | 'absent') => {
    if (isReadOnly) return;
    const newAttendance = { ...attendance };
    filteredMembers.forEach((member) => {
      newAttendance[member.id] = status;
    });
    setAttendance(newAttendance);
    Alert.alert('Success', `All members marked as ${status}`);
  };

  const handleSaveNote = () => {
    if (isReadOnly || !editingNoteMember) return;
    const memberId = editingNoteMember.id;
    setNotes((prev) => ({ ...prev, [memberId]: currentNote }));
    setEditingNoteMember(null);
    setCurrentNote('');
  };

  const handleSaveAttendance = async () => {
    if (isReadOnly || !sessionId || isSaving) return;

    setIsSaving(true);

    const recordsToSave: MarkBulkRecord[] = clubMembers.map((member) => {
      const memberId = member.id;
      const status = (attendance[memberId] || 'absent') as PageAttendanceStatus;
      const note = notes[memberId] || '';

      return {
        membershipId: memberId,
        status: status.toUpperCase() as AttendanceStatus,
        note: note,
      };
    });

    const requestBody: MarkBulkBody = {
      records: recordsToSave,
    };

    try {
      await markAttendanceBulk(sessionId, requestBody);
      Alert.alert('Success', `All ${recordsToSave.length} records have been saved successfully.`);
    } catch (err) {
      console.error('Failed to save bulk attendance:', err);
      Alert.alert('Error', 'Could not save attendance. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStaffFilter('all');
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: PageAttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 border-green-300';
      case 'late':
        return 'bg-orange-100 border-orange-300';
      case 'excused':
        return 'bg-gray-100 border-gray-300';
      case 'absent':
      default:
        return 'bg-red-100 border-red-300';
    }
  };

  const getStatusTextColor = (status: PageAttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'text-green-800';
      case 'late':
        return 'text-orange-800';
      case 'excused':
        return 'text-gray-800';
      case 'absent':
      default:
        return 'text-red-800';
    }
  };

  const getStatusIcon = (status: PageAttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'checkmark-circle';
      case 'late':
        return 'time';
      case 'excused':
        return 'alert-circle';
      case 'absent':
      default:
        return 'close-circle';
    }
  };

  const uniqueRoles = Array.from(new Set(clubMembers.map((m) => m.role)));

  const renderMemberItem = ({ item: member }: { item: Member }) => {
    const status = attendance[member.id] || 'absent';
    const hasNote = notes[member.id]?.length > 0;

    return (
      <Card className="mb-3 mx-4">
        <CardContent className="p-3">
          <View className="flex-row items-center justify-between">
            {/* Member Info */}
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
                {member.avatarUrl ? (
                  <Image
                    source={{ uri: member.avatarUrl }}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <Text className="text-lg font-bold text-gray-600">
                    {member.fullName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>

              <View className="flex-1">
                <Text className="font-semibold text-gray-900 text-base">
                  {member.fullName}
                </Text>
                <Text className="text-sm text-gray-500">({member.studentCode})</Text>
                <Badge variant="secondary" className="mt-1 self-start">
                  {member.role}
                </Badge>
              </View>
            </View>

            {/* Controls */}
            <View className="flex-row items-center">
              {/* Note Button */}
              <TouchableOpacity
                onPress={() => {
                  setEditingNoteMember(member);
                  setCurrentNote(notes[member.id] || '');
                }}
                disabled={isReadOnly || !sessionId}
                className="mr-2 relative"
              >
                <Ionicons
                  name="chatbox-outline"
                  size={24}
                  color={hasNote ? '#3b82f6' : '#9ca3af'}
                />
                {hasNote && (
                  <View className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </TouchableOpacity>

              {/* Status Button */}
              <TouchableOpacity
                onPress={() => {
                  setSelectedMemberForStatus(member);
                  setShowStatusPicker(true);
                }}
                disabled={isReadOnly || !sessionId}
                className={`px-3 py-2 rounded-lg border ${getStatusColor(status)}`}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name={getStatusIcon(status)}
                    size={16}
                    color={status === 'present' ? '#166534' : status === 'late' ? '#9a3412' : status === 'excused' ? '#374151' : '#991b1b'}
                  />
                  <Text className={`ml-1 text-xs font-medium capitalize ${getStatusTextColor(status)}`}>
                    {status}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
        <StatusBar style="dark" />
        <Sidebar role={user?.role} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-gray-600">Loading club and members...</Text>
        </View>
        <NavigationBar role={user?.role} user={user || undefined} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-gray-900">Club Attendance</Text>
          {managedClub ? (
            <Text className="text-gray-600 mt-1">
              Members of "<Text className="font-semibold text-blue-600">{managedClub.name}</Text>"
            </Text>
          ) : (
            <Text className="text-red-600 mt-1">Could not load club details</Text>
          )}
        </View>

        {/* Date Picker Button */}
        <View className="px-4 py-2">
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="bg-white border border-gray-300 rounded-lg p-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
              <Text className="ml-2 text-base text-gray-900">{formatDisplayDate(selectedDate)}</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event: any, date?: Date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) {
                setSelectedDate(date);
              }
            }}
            maximumDate={new Date()}
          />
        )}

        {/* Search Bar */}
        <View className="px-4 py-2">
          <View className="bg-white border border-gray-300 rounded-lg flex-row items-center px-3 py-2">
            <Ionicons name="search-outline" size={20} color="#9ca3af" />
            <AppTextInput
              placeholder="Search by name or student code..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="flex-1 ml-2 text-base text-gray-900"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Button */}
        <View className="px-4 py-2">
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className="bg-white border border-gray-300 rounded-lg p-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <Ionicons name="funnel-outline" size={20} color="#3b82f6" />
              <Text className="ml-2 text-base text-gray-900">Filters</Text>
            </View>
            <Ionicons
              name={showFilters ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#6b7280"
            />
          </TouchableOpacity>
        </View>

        {/* Filters Section */}
        {showFilters && (
          <View className="px-4 py-2 mb-2">
            <Card>
              <CardContent className="p-3">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="font-semibold text-gray-900">Advanced Filters</Text>
                  {(roleFilter !== 'all' || staffFilter !== 'all' || searchTerm) && (
                    <TouchableOpacity onPress={clearFilters}>
                      <Text className="text-blue-600 text-sm">Clear all</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Role Filter */}
                <View className="mb-3">
                  <Text className="text-xs font-semibold text-gray-700 uppercase mb-2">Role</Text>
                  <View className="flex-row flex-wrap">
                    <TouchableOpacity
                      onPress={() => setRoleFilter('all')}
                      className={`px-3 py-2 rounded-lg mr-2 mb-2 ${
                        roleFilter === 'all' ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    >
                      <Text className={roleFilter === 'all' ? 'text-white' : 'text-gray-700'}>
                        All Roles
                      </Text>
                    </TouchableOpacity>
                    {uniqueRoles.map((role) => (
                      <TouchableOpacity
                        key={role}
                        onPress={() => setRoleFilter(role)}
                        className={`px-3 py-2 rounded-lg mr-2 mb-2 ${
                          roleFilter === role ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                      >
                        <Text className={roleFilter === role ? 'text-white' : 'text-gray-700'}>
                          {role}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Staff Filter */}
                <View>
                  <Text className="text-xs font-semibold text-gray-700 uppercase mb-2">Staff</Text>
                  <View className="flex-row flex-wrap">
                    <TouchableOpacity
                      onPress={() => setStaffFilter('all')}
                      className={`px-3 py-2 rounded-lg mr-2 ${
                        staffFilter === 'all' ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    >
                      <Text className={staffFilter === 'all' ? 'text-white' : 'text-gray-700'}>
                        All
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setStaffFilter('true')}
                      className={`px-3 py-2 rounded-lg mr-2 ${
                        staffFilter === 'true' ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    >
                      <Text className={staffFilter === 'true' ? 'text-white' : 'text-gray-700'}>
                        Staff Only
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setStaffFilter('false')}
                      className={`px-3 py-2 rounded-lg ${
                        staffFilter === 'false' ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    >
                      <Text className={staffFilter === 'false' ? 'text-white' : 'text-gray-700'}>
                        Non-Staff
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Alerts */}
        {isReadOnly && (
          <View className="px-4 py-2">
            <View className="bg-gray-100 border border-gray-300 rounded-lg p-3 flex-row">
              <Ionicons name="information-circle-outline" size={20} color="#374151" />
              <View className="ml-2 flex-1">
                <Text className="font-semibold text-gray-900">Read-Only Mode</Text>
                <Text className="text-sm text-gray-700 mt-1">
                  Viewing past attendance. Changes cannot be made.
                </Text>
              </View>
            </View>
          </View>
        )}

        {sessionError && (
          <View className="px-4 py-2">
            <View className="bg-red-100 border border-red-300 rounded-lg p-3 flex-row">
              <Ionicons name="alert-circle-outline" size={20} color="#991b1b" />
              <View className="ml-2 flex-1">
                <Text className="font-semibold text-red-900">Session Error</Text>
                <Text className="text-sm text-red-800 mt-1">{sessionError}</Text>
              </View>
            </View>
          </View>
        )}

        {!isReadOnly && sessionId && (
          <View className="px-4 py-2">
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex-row">
              <Ionicons name="information-circle-outline" size={20} color="#1e40af" />
              <View className="ml-2 flex-1">
                <Text className="font-semibold text-blue-900">Session Active</Text>
                <Text className="text-sm text-blue-800 mt-1">
                  Session (ID: {sessionId}) is ready. Use the Save button to save changes.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Statistics */}
        {!membersLoading && filteredMembers.length > 0 && (
          <View className="px-4 py-2">
            <Card>
              <CardContent className="p-3">
                <View className="flex-row flex-wrap justify-between">
                  <View className="items-center mb-2">
                    <Text className="text-2xl font-bold text-gray-900">{stats.total}</Text>
                    <Text className="text-xs text-gray-600">Total</Text>
                  </View>
                  <View className="items-center mb-2">
                    <Text className="text-2xl font-bold text-green-600">{stats.present}</Text>
                    <Text className="text-xs text-gray-600">Present</Text>
                  </View>
                  <View className="items-center mb-2">
                    <Text className="text-2xl font-bold text-orange-600">{stats.late}</Text>
                    <Text className="text-xs text-gray-600">Late</Text>
                  </View>
                  <View className="items-center mb-2">
                    <Text className="text-2xl font-bold text-gray-600">{stats.excused}</Text>
                    <Text className="text-xs text-gray-600">Excused</Text>
                  </View>
                  <View className="items-center mb-2">
                    <Text className="text-2xl font-bold text-red-600">{stats.absent}</Text>
                    <Text className="text-xs text-gray-600">Absent</Text>
                  </View>
                </View>

                {/* Bulk Actions */}
                <View className="flex-row mt-3 space-x-2">
                  <TouchableOpacity
                    onPress={() => handleBulkAction('present')}
                    disabled={isReadOnly || !sessionId}
                    className="flex-1 bg-green-500 rounded-lg py-2 mr-2"
                  >
                    <Text className="text-white text-center font-medium">Mark All Present</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleBulkAction('absent')}
                    disabled={isReadOnly || !sessionId}
                    className="flex-1 bg-red-500 rounded-lg py-2"
                  >
                    <Text className="text-white text-center font-medium">Mark All Absent</Text>
                  </TouchableOpacity>
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Member List */}
        {membersLoading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-4 text-gray-600">Loading members...</Text>
          </View>
        ) : membersError ? (
          <View className="mx-4 my-4">
            <Card>
              <CardContent className="py-12 items-center">
                <Text className="text-red-600 text-center">{membersError}</Text>
              </CardContent>
            </Card>
          </View>
        ) : clubMembers.length === 0 ? (
          <View className="mx-4 my-4">
            <Card>
              <CardContent className="py-12 items-center">
                <Ionicons name="people-outline" size={48} color="#9ca3af" />
                <Text className="text-gray-600 text-center mt-3">No active members in your club</Text>
              </CardContent>
            </Card>
          </View>
        ) : (
          <View className="py-2">
            <FlatList
              data={filteredMembers}
              renderItem={renderMemberItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ListEmptyComponent={
                <View className="mx-4 my-4">
                  <Card>
                    <CardContent className="py-12 items-center">
                      <Text className="text-gray-600 text-center">No members match your filters</Text>
                    </CardContent>
                  </Card>
                </View>
              }
            />
          </View>
        )}

        {/* Save Button */}
        {!isReadOnly && sessionId && filteredMembers.length > 0 && (
          <View className="px-4 py-4 mb-20">
            <TouchableOpacity
              onPress={handleSaveAttendance}
              disabled={isSaving || !sessionId}
              className={`rounded-lg py-4 flex-row items-center justify-center ${
                isSaving ? 'bg-blue-300' : 'bg-blue-500'
              }`}
            >
              {isSaving ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-semibold text-base ml-2">Saving...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text className="text-white font-semibold text-base ml-2">Save Attendance</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Note Modal */}
      <Modal
        visible={!!editingNoteMember}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingNoteMember(null)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">
                Add Note for {editingNoteMember?.fullName}
              </Text>
              <TouchableOpacity onPress={() => setEditingNoteMember(null)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <AppTextInput
              placeholder="E.g., Excused (sick), Late (traffic)..."
              value={currentNote}
              onChangeText={setCurrentNote}
              multiline
              numberOfLines={4}
              className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-base text-gray-900 mb-4"
              textAlignVertical="top"
              editable={!isReadOnly}
            />

            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => setEditingNoteMember(null)}
                className="flex-1 bg-gray-200 rounded-lg py-3 mr-2"
              >
                <Text className="text-gray-700 text-center font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveNote}
                disabled={isReadOnly}
                className="flex-1 bg-blue-500 rounded-lg py-3"
              >
                <Text className="text-white text-center font-medium">Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Picker Modal */}
      <Modal
        visible={showStatusPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">
                Select Attendance Status
              </Text>
              <TouchableOpacity onPress={() => setShowStatusPicker(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
      </View>

            <View className="space-y-2">
              <TouchableOpacity
                onPress={() =>
                  selectedMemberForStatus && handleStatusChange(selectedMemberForStatus.id, 'present')
                }
                className="bg-green-100 border border-green-300 rounded-lg p-4 mb-2"
              >
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={24} color="#166534" />
                  <Text className="ml-3 text-lg font-medium text-green-800">Present</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  selectedMemberForStatus && handleStatusChange(selectedMemberForStatus.id, 'late')
                }
                className="bg-orange-100 border border-orange-300 rounded-lg p-4 mb-2"
              >
                <View className="flex-row items-center">
                  <Ionicons name="time" size={24} color="#9a3412" />
                  <Text className="ml-3 text-lg font-medium text-orange-800">Late</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  selectedMemberForStatus && handleStatusChange(selectedMemberForStatus.id, 'excused')
                }
                className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-2"
              >
                <View className="flex-row items-center">
                  <Ionicons name="alert-circle" size={24} color="#374151" />
                  <Text className="ml-3 text-lg font-medium text-gray-800">Excused</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  selectedMemberForStatus && handleStatusChange(selectedMemberForStatus.id, 'absent')
                }
                className="bg-red-100 border border-red-300 rounded-lg p-4"
              >
                <View className="flex-row items-center">
                  <Ionicons name="close-circle" size={24} color="#991b1b" />
                  <Text className="ml-3 text-lg font-medium text-red-800">Absent</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
