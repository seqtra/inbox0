import { api } from '../../../shared/api/api';
import type {
  WhatsAppMessage,
  SendWhatsAppMessageRequest,
  ApiResponse,
} from '@email-whatsapp-bridge/shared';

const whatsappApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Send a WhatsApp message
     */
    sendWhatsAppMessage: builder.mutation<
      ApiResponse<WhatsAppMessage>,
      SendWhatsAppMessageRequest
    >({
      query: (body) => ({
        url: '/whatsapp/send',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WhatsAppMessage'],
    }),

    /**
     * Get WhatsApp message history
     */
    getWhatsAppMessages: builder.query<ApiResponse<WhatsAppMessage[]>, void>({
      query: () => '/whatsapp/messages',
      providesTags: ['WhatsAppMessage'],
    }),
  }),
});

export const {
  useSendWhatsAppMessageMutation,
  useGetWhatsAppMessagesQuery,
} = whatsappApi;