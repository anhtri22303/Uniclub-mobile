import { Text, View, ViewProps } from 'react-native';

interface BadgeProps extends ViewProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children: React.ReactNode;
}

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-green-500',
    secondary: 'bg-yellow-500',
    destructive: 'bg-red-500',
    outline: 'bg-transparent border border-gray-400',
  };

  const textStyles = {
    default: 'text-white',
    secondary: 'text-white',
    destructive: 'text-white',
    outline: 'text-gray-700',
  };

  return (
    <View
      className={`px-2 py-1 rounded-full ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <Text className={`text-xs font-medium ${textStyles[variant]}`}>
        {children}
      </Text>
    </View>
  );
}

