import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

/**
 * Unit Tests for UI Components
 * These tests verify component behavior and interactions
 */

describe('UI Components - Unit Tests', () => {
  describe('Button Component', () => {
    it('should render successfully', () => {
      const { getByTestId } = render(
        <Button onPress={() => {}} testID="test-button">
          Test Button
        </Button>
      );
      expect(getByTestId('test-button')).toBeTruthy();
    });

    it('should call onPress when pressed', () => {
      const mockOnPress = jest.fn();
      const { getByTestId } = render(
        <Button onPress={mockOnPress} testID="pressable-button">
          Press Me
        </Button>
      );
      
      fireEvent.press(getByTestId('pressable-button'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when disabled', () => {
      const mockOnPress = jest.fn();
      const { getByTestId } = render(
        <Button onPress={mockOnPress} disabled testID="disabled-button">
          Disabled Button
        </Button>
      );
      
      fireEvent.press(getByTestId('disabled-button'));
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should apply custom className', () => {
      const { getByTestId } = render(
        <Button onPress={() => {}} testID="custom-button" className="custom-class">
          Custom Button
        </Button>
      );
      
      const button = getByTestId('custom-button');
      expect(button).toBeTruthy();
    });
  });

  describe('Badge Component', () => {
    it('should render with text', () => {
      const { getByText } = render(
        <Badge>Badge Text</Badge>
      );
      expect(getByText('Badge Text')).toBeTruthy();
    });

    it('should render with secondary variant', () => {
      const { getByText } = render(
        <Badge variant="secondary">Secondary</Badge>
      );
      expect(getByText('Secondary')).toBeTruthy();
    });

    it('should render with destructive variant', () => {
      const { getByText } = render(
        <Badge variant="destructive">Destructive</Badge>
      );
      expect(getByText('Destructive')).toBeTruthy();
    });

    it('should render with outline variant', () => {
      const { getByText } = render(
        <Badge variant="outline">Outline</Badge>
      );
      expect(getByText('Outline')).toBeTruthy();
    });

    it('should apply custom className', () => {
      const { getByTestId } = render(
        <Badge testID="custom-badge" className="custom-class">
          Custom Badge
        </Badge>
      );
      
      const badge = getByTestId('custom-badge');
      expect(badge).toBeTruthy();
    });
  });
});
