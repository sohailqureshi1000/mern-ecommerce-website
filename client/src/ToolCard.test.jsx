import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
// Requires the one-line `export { ToolCard };` change — see PATCH-ChatPage-export.md
import { ToolCard } from './ChatPage.jsx';

describe('ToolCard — searchProducts tool lifecycle', () => {
  test('input-streaming: shows the "building search" placeholder', () => {
    render(<ToolCard tool={{ state: 'input-streaming' }} />);
    expect(screen.getByText(/search build ho rahi hai/i)).toBeInTheDocument();
  });

  test('input-available: shows the query being searched, including maxPrice', () => {
    const { container } = render(
      <ToolCard
        tool={{
          state: 'input-available',
          args: { query: 'running shoes', maxPrice: 70 },
        }}
      />
    );
    expect(container.textContent).toContain('running shoes');
    expect(container.textContent).toContain('$70');
    expect(container.textContent).toMatch(/dhoonda ja raha hai/i);
  });

  test('input-available: omits the price qualifier when maxPrice is not set', () => {
    const { container } = render(
      <ToolCard tool={{ state: 'input-available', args: { query: 'jackets' } }} />
    );
    expect(container.textContent).toContain('jackets');
    expect(container.textContent).not.toContain('tak)');
  });

  test('output-available: renders a product card per result, with name, price, and accessible image', () => {
    const result = [
      { id: '1', name: 'Air Runner 3', price: 65, image: '/img/air-runner.jpg', category: 'shoes' },
      { id: '2', name: 'Trail Blazer', price: 89, image: '/img/trail-blazer.jpg', category: 'shoes' },
    ];
    render(<ToolCard tool={{ state: 'output-available', result }} />);

    expect(screen.getByRole('img', { name: 'Air Runner 3' })).toBeInTheDocument();
    expect(screen.getByText('$65')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Trail Blazer' })).toBeInTheDocument();
    expect(screen.getByText('$89')).toBeInTheDocument();
  });

  test('output-error: shows the failure message from the tool', () => {
    render(
      <ToolCard tool={{ state: 'output-error', error: 'No products matched that search.' }} />
    );
    expect(screen.getByText(/search fail ho gayi/i)).toBeInTheDocument();
    expect(screen.getByText('No products matched that search.')).toBeInTheDocument();
  });

  test('renders nothing for an unknown/unset state', () => {
    const { container } = render(<ToolCard tool={{ state: 'something-unexpected' }} />);
    expect(container).toBeEmptyDOMElement();
  });
});