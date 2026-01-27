import { api } from '../../../shared/api/api';
import type {
  CreateTrelloCardRequest,
  TrelloCard,
  ApiResponse,
} from '@email-whatsapp-bridge/shared';

const trelloApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Create a Trello card on a list
     */
    createTrelloCard: builder.mutation<
      ApiResponse<TrelloCard>,
      CreateTrelloCardRequest
    >({
      query: (body) => ({
        url: '/trello/cards',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TrelloCard'],
    }),
  }),
});

export const { useCreateTrelloCardMutation } = trelloApi;

/*
 * Usage example in a React component:
 *
 * import { useCreateTrelloCardMutation } from '@/entities/trello/api/trelloApi';
 *
 * function AddCardForm() {
 *   const [createCard, { isLoading, isError, isSuccess, error }] = useCreateTrelloCardMutation();
 *
 *   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
 *     e.preventDefault();
 *     try {
 *       const result = await createCard({
 *         listId: 'your-list-id',
 *         title: 'New card',
 *         description: 'Card description',
 *       }).unwrap();
 *       if (result.success && result.data) {
 *         console.log('Created:', result.data);
 *       }
 *     } catch (err) {
 *       console.error('Failed to create card:', err);
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <button type="submit" disabled={isLoading}>
 *         {isLoading ? 'Creating...' : 'Create card'}
 *       </button>
 *       {isError && <span>Error: {String(error)}</span>}
 *       {isSuccess && <span>Card created!</span>}
 *     </form>
 *   );
 * }
 */
