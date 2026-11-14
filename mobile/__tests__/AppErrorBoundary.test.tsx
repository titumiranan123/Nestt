import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import { AppErrorBoundary } from '../src/components/AppErrorBoundary';

test('recovers from a render error and returns to the app view', async () => {
  let shouldThrow = true;
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  const Child = () => {
    if (shouldThrow) throw new Error('render failure');
    return <Text>Catalogue ready</Text>;
  };
  let renderer: ReactTestRenderer.ReactTestRenderer;
  try {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<AppErrorBoundary><Child /></AppErrorBoundary>);
    });
    expect(renderer!.root.findAllByType(Text).some((text) => text.props.children === 'Something went wrong')).toBe(true);
    shouldThrow = false;
    await ReactTestRenderer.act(async () => {
      renderer!.root.findAll((node) => node.props.accessibilityLabel === 'Return to room catalogue')[0].props.onPress();
    });
    expect(renderer!.root.findAllByType(Text).some((text) => text.props.children === 'Catalogue ready')).toBe(true);
  } finally {
    consoleError.mockRestore();
  }
});
