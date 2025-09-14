declare namespace IComponents {
    export interface IButton {
        title: string;
        onPress: () => void;
        variant: 'primary' | 'secondary' | 'outline' | 'ghost';
        size: 'sm' | 'md' | 'lg';
        disabled?: boolean;
        loading?: boolean;
    }
}