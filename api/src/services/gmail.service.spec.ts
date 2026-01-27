const mockList = jest.fn();
const mockGet = jest.fn();
const mockSetCredentials = jest.fn();

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: mockSetCredentials,
        getToken: jest.fn().mockResolvedValue({
          tokens: {
            access_token: 'at',
            refresh_token: 'rt',
          },
        }),
      })),
    },
    gmail: jest.fn().mockReturnValue({
      users: {
        messages: {
          list: mockList,
          get: mockGet,
        },
      },
    }),
    oauth2: jest.fn().mockReturnValue({
      userinfo: {
        get: jest.fn().mockResolvedValue({ data: { email: 'user@example.com' } }),
      },
    }),
  },
}));

describe('GmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({
      data: {
        messages: [
          { id: 'msg1', threadId: 't1' },
          { id: 'msg2', threadId: 't2' },
        ],
      },
    });
    mockGet
      .mockResolvedValueOnce({
        data: {
          id: 'msg1',
          threadId: 't1',
          snippet: 'S1',
          payload: {
            headers: [
              { name: 'Subject', value: 'Subj1' },
              { name: 'From', value: 'a@b.com' },
              { name: 'To', value: 'c@d.com' },
              { name: 'Date', value: 'Wed, 1 Jan 2025 00:00:00 GMT' },
            ],
            body: { data: null, size: 0 },
            parts: [],
          },
          labelIds: ['INBOX'],
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'msg2',
          threadId: 't2',
          snippet: 'S2',
          payload: {
            headers: [
              { name: 'Subject', value: 'Subj2' },
              { name: 'From', value: 'x@y.com' },
              { name: 'To', value: 'z@w.com' },
              { name: 'Date', value: 'Wed, 1 Jan 2025 00:00:00 GMT' },
            ],
            body: { data: null, size: 0 },
            parts: [],
          },
          labelIds: ['INBOX'],
        },
      });
  });

  it('fetchEmails returns parsed Email array', async () => {
    const { GmailService } = require('./gmail.service');
    const service = new GmailService('access_token', 'refresh_token');

    const emails = await service.fetchEmails(undefined, 10);

    expect(emails).toHaveLength(2);
    expect(emails[0].id).toBe('msg1');
    expect(emails[0].subject).toBe('Subj1');
    expect(emails[0].from).toBe('a@b.com');
    expect(emails[1].id).toBe('msg2');
    expect(mockList).toHaveBeenCalledWith({
      userId: 'me',
      q: '',
      maxResults: 10,
    });
  });

  it('fetchEmails throws when Gmail API list fails', async () => {
    mockList.mockRejectedValue(new Error('API error'));

    const { GmailService } = require('./gmail.service');
    const service = new GmailService('access_token');

    await expect(service.fetchEmails(undefined, 5)).rejects.toThrow(
      'Failed to fetch emails from Gmail'
    );
  });
});
