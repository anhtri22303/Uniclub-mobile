import { ENV } from '@configs/environment';
import { Ionicons } from '@expo/vector-icons';
import { SignUpCredentials } from '@models/auth/auth.types';
import AuthService from '@services/auth.service';
import { useAuthStore } from '@stores/auth.store';
import { getRoleRoute } from '@utils/roleRouting';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import MajorSelector from './MajorSelector';

export default function LoginScreen() {
  const router = useRouter();
  const { login, setLoading } = useAuthStore();
  
  // Form states
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [majorName, setMajorName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginError, setShowLoginError] = useState(false);
  const [isLoadingForgotPassword, setIsLoadingForgotPassword] = useState(false);

  const handleSubmit = async () => {
    if (isSignUpMode) {
      await handleSignUp();
    } else {
      await handleLogin();
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in all fields',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    setIsLoading(true);
    setShowLoginError(false);

    try {
      console.log('Attempting login with API URL:', ENV.API_URL);
      const normalizedEmail = email.trim().toLowerCase();
      const loginResponse = await AuthService.login({ email: normalizedEmail, password });
      await login(loginResponse);
      
      // Get the normalized role from the auth store and redirect accordingly
      const { user: authUser } = useAuthStore.getState();
      const redirectPath = getRoleRoute(authUser?.role);
      
      router.replace(redirectPath as any);
    } catch (error: any) {
      console.error('Login failed:', error);
      setShowLoginError(true);
      
      let errorMessage = 'Invalid credentials or server error';
      
      if (error.message === 'Network Error') {
        errorMessage = 'Network connection error. Please check your internet connection.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server. Please try again later.';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMessage,
        visibilityTime: 3000,
        autoHide: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    // Validation
    if (!fullName) {
      Toast.show({
        type: 'error',
        text1: 'Missing Full Name',
        text2: 'Please enter your full name.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }
    if (!studentCode) {
      Toast.show({
        type: 'error',
        text1: 'Missing Student ID',
        text2: 'Please enter your student ID.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }
    if (!/^[A-Z]{2}\d{6}$/.test(studentCode)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Student ID',
        text2: 'Student ID must start with 2 letters followed by 6 digits (e.g. SE123456).',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }
    if (!majorName) {
      Toast.show({
        type: 'error',
        text1: 'Missing Major',
        text2: 'Please enter your major name.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Missing Email',
        text2: 'Please enter your email.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }
    if (!phone) {
      Toast.show({
        type: 'error',
        text1: 'Missing Phone',
        text2: 'Please enter your phone number.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phone Number',
        text2: 'Phone number must be exactly 10 digits.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }
    if (!password) {
      Toast.show({
        type: 'error',
        text1: 'Missing Password',
        text2: 'Please enter your password.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }
    if (!confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Missing Confirm Password',
        text2: 'Please confirm your password.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Password Mismatch',
        text2: 'Passwords do not match.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const signUpData: SignUpCredentials = {
        email,
        password,
        fullName,
        phone,
        roleName: 'MEMBER',
        studentCode,
        majorName,
      };

      const signUpResponse = await AuthService.signUp(signUpData);
      
      Toast.show({
        type: 'success',
        text1: 'Registration Successful',
        text2: `Welcome ${signUpResponse.fullName}! You can now sign in.`,
        visibilityTime: 3000,
        autoHide: true,
        onHide: () => {
          setIsSignUpMode(false);
          resetForm();
        },
      });
    } catch (error: any) {
      console.error('Sign up failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Sign Up Failed',
        text2: error.response?.data?.message || 'Something went wrong',
        visibilityTime: 3000,
        autoHide: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Email Required',
        text2: 'Please enter your email address first',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    setIsLoadingForgotPassword(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await AuthService.forgotPassword(normalizedEmail);
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Password Reset Email Sent',
          text2: response.message,
          visibilityTime: 3000,
          autoHide: true,
        });
        setShowLoginError(false);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Send Reset Email',
        text2: error.response?.data?.message || 'Something went wrong',
        visibilityTime: 3000,
        autoHide: true,
      });
    } finally {
      setIsLoadingForgotPassword(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setStudentCode('');
    setMajorName('');
    setPhone('');
    setConfirmPassword('');
    setShowLoginError(false);
  };

  const toggleMode = () => {
    setIsSignUpMode(!isSignUpMode);
    resetForm();
  };

  const handleDownloadApp = () => {
    Toast.show({
      type: 'info',
      text1: 'Download App',
      text2: 'App download will be available soon!',
      visibilityTime: 3000,
      autoHide: true,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          className="flex-1"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center px-6 py-8">

            {/* Form Section */}
            <View className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6">
              {/* Header */}
              <View className="mb-6">
                <Text className="text-2xl font-bold text-teal-600 mb-2">
                  {isSignUpMode ? 'Create Account' : 'Welcome Back'}
                </Text>
                <Text className="text-gray-600">
                  {isSignUpMode
                    ? 'Join UniClub and start your journey'
                    : 'Sign in to your UniClub account'}
                </Text>
              </View>

              {/* Form Fields */}
              <View className="space-y-4">
                {isSignUpMode && (
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Full Name</Text>
                    <TextInput
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Enter your full name"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    />
                  </View>
                )}

                {isSignUpMode && (
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Student ID</Text>
                    <TextInput
                      value={studentCode}
                      onChangeText={(text) => setStudentCode(text.toUpperCase())}
                      placeholder="Enter your student ID (e.g. SE123456)"
                      maxLength={8}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    />
                  </View>
                )}

                {isSignUpMode && (
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Major</Text>
                    <MajorSelector
                      selectedMajor={majorName}
                      onMajorSelect={setMajorName}
                      placeholder="Select your major"
                    />
                  </View>
                )}

                {isSignUpMode && (
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Phone</Text>
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="Enter your phone number"
                      keyboardType="phone-pad"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                    />
                  </View>
                )}

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
                  <View className="relative">
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      secureTextEntry={!showPassword}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-base"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3"
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {isSignUpMode && (
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Confirm Password</Text>
                    <View className="relative">
                      <TextInput
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm your password"
                        secureTextEntry={!showConfirmPassword}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-base"
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3"
                      >
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color="#6B7280"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading}
                  className="bg-teal-500 rounded-xl py-4 flex-row items-center justify-center shadow-lg"
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text className="text-white font-medium text-lg">
                        {isSignUpMode ? 'Sign Up' : 'Sign In'}
                      </Text>
                      <Ionicons
                        name={isSignUpMode ? 'person-add' : 'arrow-forward'}
                        size={20}
                        color="white"
                        style={{ marginLeft: 8 }}
                      />
                    </>
                  )}
                </TouchableOpacity>

                {/* Forgot Password Button - Only show after login error in sign-in mode */}
                {!isSignUpMode && showLoginError && (
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    disabled={isLoadingForgotPassword}
                    className="border border-teal-200 rounded-xl py-3 flex-row items-center justify-center"
                  >
                    {isLoadingForgotPassword ? (
                      <ActivityIndicator color="#0D9488" />
                    ) : (
                      <Text className="text-teal-600 font-medium">Forgot Password?</Text>
                    )}
                  </TouchableOpacity>
                )}

                {/* Google Sign-In Button */}
                <TouchableOpacity className="border border-gray-300 rounded-xl py-4 flex-row items-center justify-center">
                  <Ionicons name="logo-google" size={20} color="#DB4437" />
                  <Text className="text-gray-700 font-medium ml-3">
                    Đăng nhập bằng Google
                  </Text>
                </TouchableOpacity>

                {/* Toggle Mode */}
                <View className="border-t border-gray-200 pt-4">
                  <TouchableOpacity onPress={toggleMode}>
                    <Text className="text-center text-teal-600 underline">
                      {isSignUpMode
                        ? 'Already have an account? Sign In'
                        : "Don't have an account? Sign Up"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
