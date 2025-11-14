import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VoiceControl from './voice-control'
import { useVoiceInput } from '@/hooks/use-voice-input'

// Mock the useVoiceInput hook
jest.mock('@/hooks/use-voice-input')

describe('VoiceControl', () => {
  const mockOnResult = jest.fn()
  const mockOnCommand = jest.fn()
  const mockUseVoiceInput = useVoiceInput as jest.MockedFunction<typeof useVoiceInput>

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseVoiceInput.mockReturnValue({
      isListening: false,
      isSupported: true,
      error: null,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      toggleListening: jest.fn(),
    })
  })

  it('should render voice control button when supported', () => {
    render(<VoiceControl onResult={mockOnResult} />)

    expect(screen.getByRole('button', { name: /start listening/i })).toBeInTheDocument()
  })

  it('should show not supported message when browser does not support', () => {
    mockUseVoiceInput.mockReturnValue({
      isListening: false,
      isSupported: false,
      error: null,
      toggleListening: jest.fn(),
    })

    render(<VoiceControl onResult={mockOnResult} />)

    expect(screen.getByText(/voice input not supported/i)).toBeInTheDocument()
  })

  it('should show listening state when active', () => {
    mockUseVoiceInput.mockReturnValue({
      isListening: true,
      isSupported: true,
      error: null,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      toggleListening: jest.fn(),
    })

    render(<VoiceControl onResult={mockOnResult} />)

    expect(screen.getByText(/listening/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /stop listening/i })).toBeInTheDocument()
  })

  it('should show error message when error occurs', () => {
    mockUseVoiceInput.mockReturnValue({
      isListening: false,
      isSupported: true,
      error: 'Microphone permission denied',
      startListening: jest.fn(),
      stopListening: jest.fn(),
      toggleListening: jest.fn(),
    })

    render(<VoiceControl onResult={mockOnResult} />)

    expect(screen.getByText(/microphone permission denied/i)).toBeInTheDocument()
  })

  it('should call toggleListening when button clicked', async () => {
    const mockToggleListening = jest.fn()
    mockUseVoiceInput.mockReturnValue({
      isListening: false,
      isSupported: true,
      error: null,
      toggleListening: mockToggleListening,
    })

    const user = userEvent.setup()
    render(<VoiceControl onResult={mockOnResult} />)

    const button = screen.getByRole('button', { name: /start listening/i })
    await user.click(button)

    expect(mockToggleListening).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when enabled prop is false', () => {
    mockUseVoiceInput.mockReturnValue({
      isListening: false,
      isSupported: true,
      error: null,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      toggleListening: jest.fn(),
    })

    render(<VoiceControl onResult={mockOnResult} enabled={false} />)

    const button = screen.getByRole('button', { name: /start listening/i })
    expect(button).toBeDisabled()
  })
})
