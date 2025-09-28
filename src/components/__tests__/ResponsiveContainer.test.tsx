import React from 'react';
import { render } from '@testing-library/react';
import { ResponsiveContainer, ResponsiveGrid, ResponsiveStack } from '../ResponsiveContainer';

describe('ResponsiveContainer', () => {
  it('renders with default props', () => {
    const { container } = render(
      <ResponsiveContainer>
        <div>Test Content</div>
      </ResponsiveContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
  });

  it('applies custom maxWidth', () => {
    const { container } = render(
      <ResponsiveContainer maxWidth="lg">
        <div>Test Content</div>
      </ResponsiveContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('max-w-lg');
  });

  it('applies custom padding', () => {
    const { container } = render(
      <ResponsiveContainer padding="sm">
        <div>Test Content</div>
      </ResponsiveContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('px-2', 'sm:px-4');
  });

  it('applies no padding when specified', () => {
    const { container } = render(
      <ResponsiveContainer padding="none">
        <div>Test Content</div>
      </ResponsiveContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).not.toHaveClass('px-2', 'px-4', 'px-6');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ResponsiveContainer className="custom-class">
        <div>Test Content</div>
      </ResponsiveContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });
});

describe('ResponsiveGrid', () => {
  it('renders with default grid columns', () => {
    const { container } = render(
      <ResponsiveGrid>
        <div>Item 1</div>
        <div>Item 2</div>
      </ResponsiveGrid>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
  });

  it('applies custom column configuration', () => {
    const { container } = render(
      <ResponsiveGrid cols={{ default: 2, sm: 3, md: 4, lg: 5, xl: 6 }}>
        <div>Item 1</div>
        <div>Item 2</div>
      </ResponsiveGrid>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass(
      'grid-cols-2',
      'sm:grid-cols-3',
      'md:grid-cols-4',
      'lg:grid-cols-5',
      'xl:grid-cols-6'
    );
  });

  it('applies custom gap', () => {
    const { container } = render(
      <ResponsiveGrid gap="lg">
        <div>Item 1</div>
        <div>Item 2</div>
      </ResponsiveGrid>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('gap-6', 'sm:gap-8');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ResponsiveGrid className="custom-grid">
        <div>Item 1</div>
        <div>Item 2</div>
      </ResponsiveGrid>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-grid');
  });
});

describe('ResponsiveStack', () => {
  it('renders with default vertical direction', () => {
    const { container } = render(
      <ResponsiveStack>
        <div>Item 1</div>
        <div>Item 2</div>
      </ResponsiveStack>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex', 'flex-col', 'space-y-4', 'items-stretch', 'justify-start');
  });

  it('applies horizontal direction', () => {
    const { container } = render(
      <ResponsiveStack direction="horizontal">
        <div>Item 1</div>
        <div>Item 2</div>
      </ResponsiveStack>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex', 'flex-row', 'space-x-4');
  });

  it('applies responsive direction', () => {
    const { container } = render(
      <ResponsiveStack direction="responsive">
        <div>Item 1</div>
        <div>Item 2</div>
      </ResponsiveStack>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'space-y-4', 'sm:space-y-0', 'sm:space-x-4');
  });

  it('applies custom spacing', () => {
    const { container } = render(
      <ResponsiveStack spacing="lg">
        <div>Item 1</div>
        <div>Item 2</div>
      </ResponsiveStack>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('space-y-6');
  });

  it('applies custom alignment and justification', () => {
    const { container } = render(
      <ResponsiveStack align="center" justify="between">
        <div>Item 1</div>
        <div>Item 2</div>
      </ResponsiveStack>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('items-center', 'justify-between');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ResponsiveStack className="custom-stack">
        <div>Item 1</div>
        <div>Item 2</div>
      </ResponsiveStack>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-stack');
  });
});