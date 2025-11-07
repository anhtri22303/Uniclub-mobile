import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'outline' | 'destructive';
}

export function Button({ variant = 'default', className = '', ...props }: ButtonProps) {
  const variantStyles = {
    default: 'bg-blue-500',
    outline: 'bg-transparent border border-gray-300',
    destructive: 'bg-red-500',
  };

  return (
    <TouchableOpacity
      className={`px-4 py-3 rounded-lg items-center justify-center ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
}

