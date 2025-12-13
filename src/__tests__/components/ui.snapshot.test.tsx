import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { render } from '@testing-library/react-native';
import React from 'react';

/**
 * Snapshot Tests for UI Components
 * These tests ensure UI components don't change unexpectedly
 */

describe('UI Components - Snapshot Tests', () => {
  describe('Button Component', () => {
    it('should match snapshot for default button', () => {
      const { toJSON } = render(
        <Button onPress={() => {}}>
          Click Me
        </Button>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot for outline button', () => {
      const { toJSON } = render(
        <Button onPress={() => {}} variant="outline">
          Outline Button
        </Button>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot for disabled button', () => {
      const { toJSON } = render(
        <Button onPress={() => {}} disabled>
          Disabled Button
        </Button>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot for destructive button', () => {
      const { toJSON } = render(
        <Button onPress={() => {}} variant="destructive">
          Destructive Button
        </Button>
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Card Component', () => {
    it('should match snapshot for default card', () => {
      const { toJSON } = render(
        <Card>
          <Card>Card Content</Card>
        </Card>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot for card with custom style', () => {
      const { toJSON } = render(
        <Card style={{ padding: 20 }}>
          <Card>Custom Card</Card>
        </Card>
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Badge Component', () => {
    it('should match snapshot for default badge', () => {
      const { toJSON } = render(
        <Badge>Default</Badge>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot for secondary badge', () => {
      const { toJSON } = render(
        <Badge variant="secondary">Secondary</Badge>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot for destructive badge', () => {
      const { toJSON } = render(
        <Badge variant="destructive">Destructive</Badge>
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot for outline badge', () => {
      const { toJSON } = render(
        <Badge variant="outline">Outline</Badge>
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
