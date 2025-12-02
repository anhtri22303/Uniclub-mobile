import { AppTextInput } from '@components/ui';
import { ENV } from '@configs/environment';
import { Ionicons } from '@expo/vector-icons';
import { SignUpCredentials } from '@models/auth/auth.types';
import AuthService from '@services/auth.service';
import GoogleAuthService from '@services/googleAuth.service';
import { useAuthStore } from '@stores/auth.store';
import { getRoleRoute } from '@utils/roleRouting';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import MajorSelector from './MajorSelector';

const { width, height } = Dimensions.get('window');

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Animation refs - Simplified and subtle
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const circleAnim1 = useRef(new Animated.Value(0)).current;
  const circleAnim2 = useRef(new Animated.Value(0)).current;
  const circleAnim3 = useRef(new Animated.Value(0)).current;

  // Initialize animations and Google Sign-In
  useEffect(() => {
    GoogleAuthService.configure();

    // Very subtle logo breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slow background circles animation
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(circleAnim1, {
            toValue: 1,
            duration: 15000,
            useNativeDriver: true,
          }),
          Animated.timing(circleAnim2, {
            toValue: 1,
            duration: 18000,
            useNativeDriver: true,
          }),
          Animated.timing(circleAnim3, {
            toValue: 1,
            duration: 20000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(circleAnim1, {
            toValue: 0,
            duration: 15000,
            useNativeDriver: true,
          }),
          Animated.timing(circleAnim2, {
            toValue: 0,
            duration: 18000,
            useNativeDriver: true,
          }),
          Animated.timing(circleAnim3, {
            toValue: 0,
            duration: 20000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  // Gentle fade on mode change
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSignUpMode]);

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
      await login(loginResponse, password); // Pass password to detect "123"
      
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

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    
    try {
      console.log('🔵 Starting Google Sign-In...');
      
      // Sign in with Google and get user data from backend
      const userData = await GoogleAuthService.signInWithGoogle();
      
      console.log('✅ Google Sign-In successful, logging in...');
      
      // Login to auth store with the user data
      await login(userData);
      
      // Get the normalized role and redirect
      const { user: authUser } = useAuthStore.getState();
      const redirectPath = getRoleRoute(authUser?.role);
      
      Toast.show({
        type: 'success',
        text1: 'Welcome!',
        text2: `Signed in as ${userData.fullName}`,
        visibilityTime: 3000,
        autoHide: true,
      });
      
      router.replace(redirectPath as any);
    } catch (error: any) {
      console.error('❌ Google Sign-In failed:', error);
      
      let errorMessage = 'Google Sign-In failed. Please try again.';
      
      if (error.message.includes('cancelled')) {
        errorMessage = 'Google Sign-In was cancelled';
      } else if (error.message.includes('Play Services')) {
        errorMessage = 'Google Play Services is not available or outdated';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network connection error. Please check your internet.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Google Sign-In Failed',
        text2: errorMessage,
        visibilityTime: 4000,
        autoHide: true,
      });
    } finally {
      setIsGoogleLoading(false);
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

  // Animated circle positions - slower and more subtle
  const circle1TranslateX = circleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });
  const circle1TranslateY = circleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });
  const circle2TranslateX = circleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25],
  });
  const circle2TranslateY = circleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 35],
  });
  const circle3TranslateX = circleAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });
  const circle3TranslateY = circleAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });

  return (
    <View className="flex-1 bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50" style={{ backgroundColor: '#F0FDFA' }}>
      <StatusBar style="dark" />
      
      {/* Animated Background Circles */}
      <Animated.View
        className="absolute rounded-full bg-teal-200/30"
        style={{
          width: 300,
          height: 300,
          top: -100,
          left: -50,
          transform: [
            { translateX: circle1TranslateX },
            { translateY: circle1TranslateY },
          ],
        }}
      />
      <Animated.View
        className="absolute rounded-full bg-emerald-200/30"
        style={{
          width: 250,
          height: 250,
          top: height * 0.4,
          right: -70,
          transform: [
            { translateX: circle2TranslateX },
            { translateY: circle2TranslateY },
          ],
        }}
      />
      <Animated.View
        className="absolute rounded-full bg-cyan-200/30"
        style={{
          width: 200,
          height: 200,
          bottom: 50,
          left: width * 0.2,
          transform: [
            { translateX: circle3TranslateX },
            { translateY: circle3TranslateY },
          ],
        }}
      />

      <SafeAreaView className="flex-1">
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
              {/* Logo/Icon - Subtle breathing animation */}
              <Animated.View
                className="items-center mb-6"
                style={{
                  transform: [{ scale: logoScale }],
                }}
              >
                <View className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 items-center justify-center shadow-xl" style={{ backgroundColor: '#14B8A6' }}>
                  <Ionicons name="school" size={48} color="white" />
                </View>
                <Text className="text-3xl font-bold text-teal-600 mt-4">
                  UniClub
                </Text>
                <Text className="text-gray-500 text-sm mt-1">
                  Connect • Explore • Engage
                </Text>
              </Animated.View>

              {/* Form Section - No movement, just fade on mode change */}
              <Animated.View 
                className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/50"
                style={{
                  opacity: fadeAnim,
                }}
              >
                {/* Header */}
                <View className="mb-6">
                  <View className="flex-row items-center mb-3">
                    <View className="w-1 h-8 bg-teal-500 rounded-full mr-3" />
                    <Text className="text-3xl font-bold text-gray-800">
                      {isSignUpMode ? '✨ Create Account' : '👋 Welcome Back'}
                    </Text>
                  </View>
                  <Text className="text-gray-600 ml-4">
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
                    <AppTextInput
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
                    <AppTextInput
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
                    <AppTextInput
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
                  <AppTextInput
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
                    <AppTextInput
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
                      <AppTextInput
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
                  className="rounded-xl py-4 flex-row items-center justify-center shadow-2xl overflow-hidden"
                  style={{
                    backgroundColor: '#14B8A6',
                    shadowColor: '#14B8A6',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  {/* Gradient overlay */}
                  <View className="absolute inset-0 bg-gradient-to-r from-teal-400 to-emerald-500" style={{ backgroundColor: '#14B8A6', opacity: 0.9 }} />
                  
                  {isLoading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator color="white" />
                      <Text className="text-white font-semibold text-lg ml-2">Processing...</Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center">
                      <Text className="text-white font-bold text-lg">
                        {isSignUpMode ? '🚀 Sign Up' : '🔓 Sign In'}
                      </Text>
                      <Ionicons
                        name={isSignUpMode ? 'person-add' : 'arrow-forward'}
                        size={22}
                        color="white"
                        style={{ marginLeft: 8 }}
                      />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Forgot Password Button - Only show after login error in sign-in mode */}
                {!isSignUpMode && showLoginError && (
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    disabled={isLoadingForgotPassword}
                    className="border-2 border-teal-200 bg-teal-50/50 rounded-xl py-3 flex-row items-center justify-center"
                    style={{
                      shadowColor: '#14B8A6',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    {isLoadingForgotPassword ? (
                      <ActivityIndicator color="#0D9488" />
                    ) : (
                      <View className="flex-row items-center">
                        <Ionicons name="key-outline" size={18} color="#0D9488" />
                        <Text className="text-teal-600 font-semibold ml-2">🔑 Forgot Password?</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}

                {/* Divider */}
                <View className="flex-row items-center my-2">
                  <View className="flex-1 h-px bg-gray-300" />
                  <Text className="mx-4 text-gray-500 font-medium">OR</Text>
                  <View className="flex-1 h-px bg-gray-300" />
                </View>

                {/* Google Sign-In Button */}
                <TouchableOpacity 
                  onPress={handleGoogleSignIn}
                  disabled={isGoogleLoading || isLoading}
                  className="border-2 border-gray-300 bg-white rounded-xl py-4 flex-row items-center justify-center"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  {isGoogleLoading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator color="#DB4437" />
                      <Text className="text-gray-700 font-medium ml-3">Connecting...</Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center">
                      <View className="w-6 h-6 rounded-full bg-white items-center justify-center mr-3">
                        <Ionicons name="logo-google" size={22} color="#DB4437" />
                      </View>
                      <Text className="text-gray-700 font-semibold">
                        Đăng nhập bằng Google
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Toggle Mode */}
                <View className="border-t border-gray-200 pt-4 mt-2">
                  <TouchableOpacity 
                    onPress={toggleMode}
                    className="bg-gray-50 rounded-xl py-3 px-4"
                  >
                    <Text className="text-center text-gray-600">
                      {isSignUpMode
                        ? 'Already have an account? '
                        : "Don't have an account? "}
                      <Text className="text-teal-600 font-bold underline">
                        {isSignUpMode ? 'Sign In' : 'Sign Up'}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              </Animated.View>

              {/* Footer decoration */}
              <View className="mt-6 items-center">
                <View className="flex-row items-center space-x-2">
                  <View className="w-2 h-2 rounded-full bg-teal-400" />
                  <View className="w-2 h-2 rounded-full bg-emerald-400" />
                  <View className="w-2 h-2 rounded-full bg-cyan-400" />
                </View>
                <Text className="text-gray-500 text-xs mt-3">
                  © 2025 UniClub • Secure & Trusted
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
