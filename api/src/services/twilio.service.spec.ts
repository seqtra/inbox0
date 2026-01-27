const mockCreate = jest.fn();

jest.mock('twilio', () =>
  jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
    },
  }))
);

describe('TwilioService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = {
      ...originalEnv,
      TWILIO_ACCOUNT_SID: 'ACtest',
      TWILIO_AUTH_TOKEN: 'token',
      TWILIO_WHATSAPP_NUMBER: 'whatsapp:+15551234567',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('constructor throws when credentials are missing', () => {
    process.env.TWILIO_ACCOUNT_SID = '';
    process.env.TWILIO_AUTH_TOKEN = '';

    const { TwilioService } = require('./twilio.service');
    expect(() => new TwilioService()).toThrow('Twilio credentials not configured');
  });

  it('sendMessage calls Twilio client with correct args', async () => {
    mockCreate.mockResolvedValue({
      sid: 'SM123',
      status: 'sent',
    });

    const { TwilioService } = require('./twilio.service');
    const service = new TwilioService();

    const result = await service.sendMessage({
      to: '+15559876543',
      message: 'Hello',
    });

    expect(mockCreate).toHaveBeenCalledWith({
      from: 'whatsapp:+15551234567',
      to: 'whatsapp:+15559876543',
      body: 'Hello',
    });
    expect(result.id).toBe('SM123');
    expect(result.status).toBe('sent');
  });

  it('sendMessage throws on invalid phone number', async () => {
    const { TwilioService } = require('./twilio.service');
    const service = new TwilioService();

    await expect(
      service.sendMessage({ to: 'bad', message: 'Hi' })
    ).rejects.toThrow('Failed to send WhatsApp message');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('sendMessage propagates Twilio API errors', async () => {
    mockCreate.mockRejectedValue(new Error('Twilio error'));

    const { TwilioService } = require('./twilio.service');
    const service = new TwilioService();

    await expect(
      service.sendMessage({ to: '+15559876543', message: 'Hi' })
    ).rejects.toThrow('Failed to send WhatsApp message');
  });
});
