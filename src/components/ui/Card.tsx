import { View, ViewProps } from 'react-native';

export function Card({ className = '', ...props }: ViewProps) {
  return (
    <View
      className={`bg-white rounded-lg border border-gray-200 ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = '', ...props }: ViewProps) {
  return <View className={`p-4 ${className}`} {...props} />;
}

export function CardTitle({ className = '', ...props }: ViewProps) {
  return <View className={`${className}`} {...props} />;
}

export function CardDescription({ className = '', ...props }: ViewProps) {
  return <View className={`${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }: ViewProps) {
  return <View className={`px-4 pb-4 ${className}`} {...props} />;
}

